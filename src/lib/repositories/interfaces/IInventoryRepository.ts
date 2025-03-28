import { Inventory } from '@/lib/models/Inventory';

export interface IInventoryRepository {
  findById(id: string): Promise<Inventory | undefined>;
  findByPharmacyId(pharmacyId: string): Promise<Inventory[]>;
  findByMedicationId(medicationId: string, pharmacyId?: string): Promise<Inventory[]>;
  findLowStock(pharmacyId: string, threshold?: number): Promise<Inventory[]>;
  findExpiringStock(pharmacyId: string, daysThreshold?: number): Promise<Inventory[]>;
  create(inventoryData: Omit<Inventory, 'id' | 'createdAt' | 'updatedAt'>): Promise<Inventory | undefined>;
  updateQuantity(id: string, quantity: number): Promise<Inventory | undefined>;
  delete(id: string): Promise<boolean>;
}
