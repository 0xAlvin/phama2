import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { inventory, medications } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    // Authenticate the request
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Fix: Don't use await on params.id - it's a string, not a Promise
    const pharmacyId = await context.params.id;
    
    if (!pharmacyId) {
      return NextResponse.json({ error: 'Pharmacy ID is required' }, { status: 400 });
    }
    
    // Get inventory items matching schema fields exactly
    const inventoryItems = await db
      .select({
        id: inventory.id,
        medicationId: inventory.medicationId,
        quantity: inventory.quantity,
        expiryDate: inventory.expiryDate,
        price: inventory.price,
        name: medications.name,
        description: medications.description,
        dosageForm: medications.dosageForm,
        strength: medications.strength,
        requiresPrescription: medications.requiresPrescription,
      })
      .from(inventory)
      .innerJoin(medications, eq(inventory.medicationId, medications.id))
      .where(eq(inventory.pharmacyId, pharmacyId));
    
    if (!inventoryItems || inventoryItems.length === 0) {
      return NextResponse.json({
        success: true,
        data: []
      });
    }
    
    // Map to frontend-friendly format with correct types and include inventory ID
    return NextResponse.json({
      success: true,
      data: inventoryItems.map(item => ({
        id: item.medicationId,
        inventoryId: item.id, // Include inventory ID to help create unique keys
        name: item.name,
        description: item.description || '',
        dosageForm: item.dosageForm || '',
        strength: item.strength || '',
        price: Number(item.price),
        requiresPrescription: Boolean(item.requiresPrescription),
        quantity: Number(item.quantity),
        available: Number(item.quantity) > 0
      }))
    });
  } catch (error) {
    console.error('Error fetching pharmacy inventory:', error);
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch inventory'
    }, { status: 500 });
  }
}
