import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { eq, and, gt } from 'drizzle-orm';
import { inventory, medications } from '@/lib/schema';
import { unstable_cache } from 'next/cache';

// Cache inventory for 2 minutes to reduce database load
const getCachedInventory = unstable_cache(
  async (pharmacyId: string) => {
    const result = await db
      .select({
        id: inventory.id,
        medicationId: inventory.medicationId,
        name: medications.name,
        quantity: inventory.quantity,
        price: inventory.price,
        requiresPrescription: medications.requiresPrescription,
        expiryDate: inventory.expiryDate,
      })
      .from(inventory)
      .innerJoin(medications, eq(inventory.medicationId, medications.id))
      .where(
        and(
          eq(inventory.pharmacyId, pharmacyId),
          // Only show medications that are in stock
          gt(inventory.quantity, 0)
        )
      )
      .orderBy(medications.name);
    
    return result.map(item => ({
      id: item.medicationId,
      name: item.name,
      price: Number(item.price),
      requiresPrescription: item.requiresPrescription,
      available: true,
      quantity: item.quantity,
      expiryDate: item.expiryDate,
      inventoryId: item.id
    }));
  },
  ['pharmacy-inventory'],
  { revalidate: 120 } // 2 minutes
);

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    const { id: pharmacyId } = params;
    
    if (!pharmacyId) {
      return NextResponse.json({ error: 'Pharmacy ID is required' }, { status: 400 });
    }
    
    // Get inventory items
    const medications = await getCachedInventory(pharmacyId);
    
    return NextResponse.json({
      success: true,
      medications
    });
  } catch (error) {
    console.error('Error fetching pharmacy inventory:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
