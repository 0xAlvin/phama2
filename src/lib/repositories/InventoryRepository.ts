import { db } from '@/lib/db';
import { inventory, medications } from '@/lib/schema';
import { eq, and, lt, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { IInventoryRepository } from './interfaces/IInventoryRepository';
import { Inventory } from '@/lib/models/Inventory';

export class InventoryRepository implements IInventoryRepository {
  async findById(id: string): Promise<Inventory | undefined> {
    return db.query.inventory.findFirst({
      where: eq(inventory.id, id),
      with: {
        medication: true
      }
    }) as unknown as Promise<Inventory | undefined>;
  }

  async findByPharmacyId(pharmacyId: string): Promise<Inventory[]> {
    return db.query.inventory.findMany({
      where: eq(inventory.pharmacyId, pharmacyId),
      with: {
        medication: true
      }
    }) as unknown as Promise<Inventory[]>;
  }

  async findByMedicationId(medicationId: string, pharmacyId?: string): Promise<Inventory[]> {
    const conditions = [eq(inventory.medicationId, medicationId)];
    
    if (pharmacyId) {
      conditions.push(eq(inventory.pharmacyId, pharmacyId));
    }
    
    return db.query.inventory.findMany({
      where: and(...conditions),
      with: {
        medication: true
      }
    }) as unknown as Promise<Inventory[]>;
  }

  async findLowStock(pharmacyId: string, threshold = 10): Promise<Inventory[]> {
    return db.query.inventory.findMany({
      where: and(
        eq(inventory.pharmacyId, pharmacyId),
        lt(inventory.currentStock, threshold) // Updated to use currentStock instead of quantity
      ),
      with: {
        medication: true
      }
    }) as unknown as Promise<Inventory[]>;
  }

  async findExpiringStock(pharmacyId: string, daysThreshold = 30): Promise<Inventory[]> {
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() + daysThreshold);
    
    return db.query.inventory.findMany({
      where: and(
        eq(inventory.pharmacyId, pharmacyId),
        lt(inventory.expiryDate, expiryThreshold)
      ),
      with: {
        medication: true
      }
    }) as unknown as Promise<Inventory[]>;
  }

  async create(inventoryData: Omit<Inventory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Inventory | undefined> {
    const id = uuidv4();
    const now = new Date();
    
    await db.insert(inventory).values({
      ...inventoryData,
      id,
      createdAt: now,
      updatedAt: now
    });
    
    return this.findById(id);
  }

  async updateQuantity(id: string, quantity: number): Promise<Inventory | undefined> {
    await db.update(inventory)
      .set({ 
        currentStock: quantity, // Updated to use currentStock instead of quantity
        updatedAt: new Date()
      })
      .where(eq(inventory.id, id));
      
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    await db.delete(inventory)
      .where(eq(inventory.id, id));
    
    return true;
  }
}
