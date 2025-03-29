/**
 * Service for handling product-related API calls
 */
import { db } from '@/lib/db';
import { inventory, medications, pharmacies, addresses } from '@/lib/schema';
import { eq, and, gt, inArray } from 'drizzle-orm';
import { Product } from '@/types/product';
import { sql } from 'drizzle-orm';

// Cache for pharmacy data to avoid repeated DB calls
const pharmacyCache = new Map<string, { id: string, name: string, phone: string }>();

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;
let lastFetched: number | null = null;
let cachedProducts: Product[] = [];

/**
 * Fetches all available products with efficient queries
 */
export async function getAllProducts(forceFresh = false): Promise<Product[]> {
  try {
    const now = Date.now();
    
    // Use cached data if available and fresh
    if (!forceFresh && lastFetched && now - lastFetched < CACHE_DURATION && cachedProducts.length > 0) {
      console.log('Using cached product data in service');
      return cachedProducts;
    }
    
    try {
      // Try to use Drizzle's typed query first
      const inventoryItems = await db.select({
        id: inventory.id,
        quantity: inventory.quantity,
        price: inventory.price,
        medicationId: inventory.medicationId,
        pharmacyId: inventory.pharmacyId,
        expiryDate: inventory.expiryDate,
        // Handle the case where column names might be different
        batchNumber: inventory.batchNumber
      })
      .from(inventory)
      .where(gt(inventory.quantity, 0));
      
      if (inventoryItems.length === 0) {
        return [];
      }
      
      // Extract unique medication and pharmacy IDs for batch queries
      const medicationIds = inventoryItems.map(item => item.medicationId);
      const pharmacyIds = [...new Set(inventoryItems.map(item => item.pharmacyId))];
      
      // Rest of the function remains the same...
      // ...existing code...
      
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
          imageUrl: '/images/medications/default.jpg', // Always use default image
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
      
      // Update cache
      cachedProducts = products;
      lastFetched = Date.now();
      
      return products;
    } catch (typedQueryError) {
      console.error('Error in typed query:', typedQueryError);
      
      // Fall back to raw SQL if the typed query fails (likely due to schema mismatch)
      console.log('Falling back to raw SQL query');
      
      const result = await db.execute(sql`
        SELECT 
          i.id, 
          i.quantity,
          i.price,
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
      
      console.log(`SQL query returned ${result.rows.length} rows`);
      
      // Simple mapping for compatibility
      const fallbackProducts = result.rows.map(row => ({
        id: row.id,
        name: row.medication_name || 'Unknown Medication',
        description: row.description || '',
        price: Number(row.price) || 0,
        dosage: row.strength || '',
        inventory: row.quantity || 0,
        imageUrl: '/images/medications/default.jpg',
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
      
      // Update cache
      cachedProducts = fallbackProducts;
      lastFetched = Date.now();
      
      return fallbackProducts;
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    
    // Return empty array instead of throwing to prevent UI breaks
    return [];
  }
}

/**
 * Get product by ID (from cache if available)
 */
export async function getProductById(id: string): Promise<Product | null> {
  try {
    // Try to find in cache first
    if (cachedProducts.length > 0) {
      const cachedProduct = cachedProducts.find(p => p.id === id);
      if (cachedProduct) {
        return cachedProduct;
      }
    }
    
    // If not in cache, try a raw SQL query which is more robust to schema changes
    const result = await db.execute(sql`
      SELECT 
        i.id, 
        i.quantity,
        i.price,
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
        i.id = ${id}
    `);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    
    // Get pharmacy address
    const addressResult = await db.execute(sql`
      SELECT 
        street_address,
        city,
        state,
        zip_code
      FROM 
        addresses
      WHERE 
        pharmacy_id = ${row.pharmacy_id}
      LIMIT 1
    `);
    
    const address = addressResult.rows[0] || {};
    
    return {
      id: row.id,
      name: row.medication_name || 'Unknown Medication',
      description: row.description || '',
      price: Number(row.price) || 0,
      dosage: row.strength || '',
      inventory: row.quantity || 0,
      imageUrl: '/images/medications/default.jpg',
      prescription: row.requires_prescription || false,
      pharmacy: {
        id: row.pharmacy_id,
        name: row.pharmacy_name || 'Unknown Pharmacy',
        address: address.street_address || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.zip_code || '',
        phone: row.phone || ''
      },
      category: row.dosage_form || 'General'
    };
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }
}

/**
 * Clear product cache 
 */
export function clearProductCache() {
  cachedProducts = [];
  lastFetched = null;
  pharmacyCache.clear();
}
