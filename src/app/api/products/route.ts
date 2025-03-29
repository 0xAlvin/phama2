import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { inventory, medications, pharmacies, addresses } from '@/lib/schema';
import { eq, and, gt, inArray } from 'drizzle-orm';
import { unstable_cache } from 'next/cache';

// Cache for pharmacy data to avoid repeated DB calls
const pharmacyCache = new Map<string, any>();

// Debug logger 
const debug = (message: string) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] PRODUCTS_API: ${message}`);
};

// Efficient database query function following patterns from orderService
async function getProductsFromDb() {
  debug("Fetching products from database");
  
  try {
    // Get inventory items with quantity > 0
    const inventoryItems = await db.select({
      id: inventory.id,
      quantity: inventory.quantity,
      price: inventory.price,
      // Use the correct column name from schema.ts
      // The column might be called 'imageUrl' in the schema but 'image_url' in older code
      imageUrl: inventory.imageUrl || null, // Handle possible undefined column
      medicationId: inventory.medicationId,
      pharmacyId: inventory.pharmacyId,
      expiryDate: inventory.expiryDate,
    })
    .from(inventory)
    .where(gt(inventory.quantity, 0));
    
    debug(`Raw inventory query successful with ${inventoryItems.length} items`);
    
    if (inventoryItems.length === 0) {
      debug("No inventory items with stock found");
      return [];
    }
    
    // Extract unique medication and pharmacy IDs for batch queries
    const medicationIds = inventoryItems.map(item => item.medicationId);
    const pharmacyIds = [...new Set(inventoryItems.map(item => item.pharmacyId))];
    
    debug(`Found ${inventoryItems.length} inventory items across ${pharmacyIds.length} pharmacies`);
    
    // Batch fetch all medications
    const medicationsData = await db.select({
      id: medications.id,
      name: medications.name,
      description: medications.description,
      strength: medications.strength,
      dosageForm: medications.dosageForm,
      requiresPrescription: medications.requiresPrescription,
    })
    .from(medications)
    .where(inArray(medications.id, medicationIds));
    
    // Create a map for medications
    const medicationMap = new Map();
    medicationsData.forEach(med => {
      medicationMap.set(med.id, med);
    });
    
    // Batch fetch uncached pharmacies
    const uncachedPharmacyIds = pharmacyIds.filter(id => !pharmacyCache.has(id));
    if (uncachedPharmacyIds.length > 0) {
      const pharmaciesData = await db.select({
        id: pharmacies.id,
        name: pharmacies.name,
        phone: pharmacies.phone,
      })
      .from(pharmacies)
      .where(inArray(pharmacies.id, uncachedPharmacyIds));
      
      // Update pharmacy cache
      pharmaciesData.forEach(pharm => {
        pharmacyCache.set(pharm.id, pharm);
      });
    }
    
    // Batch fetch all addresses
    const addressesData = await db.select({
      pharmacyId: addresses.pharmacyId,
      streetAddress: addresses.streetAddress,
      city: addresses.city,
      state: addresses.state,
      zipCode: addresses.zipCode,
    })
    .from(addresses)
    .where(inArray(addresses.pharmacyId, pharmacyIds));
    
    // Create a map for addresses
    const addressMap = new Map();
    addressesData.forEach(addr => {
      if (!addressMap.has(addr.pharmacyId)) {
        addressMap.set(addr.pharmacyId, addr);
      }
    });
    
    // Format products with all related data
    const products = inventoryItems.map(item => {
      const medication = medicationMap.get(item.medicationId) || {};
      const pharmacy = pharmacyCache.get(item.pharmacyId) || {};
      const address = addressMap.get(item.pharmacyId) || {};
      
      return {
        id: item.id,
        name: medication.name || 'Unknown Medication',
        description: medication.description || '',
        price: Number(item.price) || 0,
        dosage: medication.strength || '',
        inventory: item.quantity || 0,
        // Use default image if imageUrl is not available (different column name issue)
        imageUrl: item.imageUrl || '/images/medications/default.jpg',
        prescription: medication.requiresPrescription || false,
        pharmacy: {
          id: item.pharmacyId,
          name: pharmacy.name || 'Unknown Pharmacy',
          address: address.streetAddress || '',
          city: address.city || '',
          state: address.state || '',
          zipCode: address.zipCode || '',
          phone: pharmacy.phone || ''
        },
        category: medication.dosageForm || 'General'
      };
    });
    
    debug(`Successfully processed ${products.length} products`);
    return products;
  } catch (error) {
    debug(`Database error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    if (error instanceof Error) {
      debug(`Stack trace: ${error.stack}`);
    }
    
    // Try a simpler query approach if the first one failed
    try {
      debug("Attempting fallback query with raw SQL");
      
      const result = await db.execute(sql`
        SELECT 
          i.id, 
          i.quantity,
          i.price,
          i.batch_number,
          i.medication_id,
          i.pharmacy_id,
          m.name as medication_name,
          m.description,
          m.strength,
          m.dosage_form,
          m.requires_prescription,
          p.name as pharmacy_name,
          p.phone
        FROM 
          inventory i
        INNER JOIN 
          medications m ON i.medication_id = m.id
        INNER JOIN 
          pharmacies p ON i.pharmacy_id = p.id
        WHERE 
          i.quantity > 0
      `);
      
      debug(`Fallback query returned ${result.rows.length} rows`);
      
      // Simple mapping to ensure compatibility
      const fallbackProducts = result.rows.map(row => ({
        id: row.id,
        name: row.medication_name || 'Unknown Medication',
        description: row.description || '',
        price: Number(row.price) || 0,
        dosage: row.strength || '',
        inventory: row.quantity || 0,
        imageUrl: '/images/medications/default.jpg', // Default image always
        prescription: row.requires_prescription || false,
        pharmacy: {
          id: row.pharmacy_id,
          name: row.pharmacy_name || 'Unknown Pharmacy',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          phone: row.phone || ''
        },
        category: row.dosage_form || 'General'
      }));
      
      debug(`Processed ${fallbackProducts.length} products with fallback method`);
      return fallbackProducts;
    } catch (fallbackError) {
      debug(`Fallback query also failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
      throw error; // Re-throw the original error
    }
  }
}

// Add missing import at the top of the file
import { sql } from 'drizzle-orm';

// Server-side caching function using patterns from orderService
const getCachedProducts = unstable_cache(
  getProductsFromDb,
  ['products-list'],
  { revalidate: 300 } // 5 minutes
);

// Clear cache function
export function clearProductCache() {
  pharmacyCache.clear();
}

export async function GET() {
  try {
    debug("API endpoint called");
    
    const products = await getCachedProducts();
    
    debug(`Returning ${products.length} products to client`);
    return NextResponse.json(products);
  } catch (error) {
    debug(`API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    
    // Follow orderService error handling pattern - return a structured error
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        message: process.env.NODE_ENV === 'development' 
          ? (error instanceof Error ? error.message : String(error)) 
          : 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
}
