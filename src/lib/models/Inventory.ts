export interface Inventory {
    id: string;
    pharmacyId: string;
    medicationId: string;
    batchNumber: string | null;
    currentStock: number;
    unitPrice: number;
    purchasePrice: number | null;
    expiryDate: Date;
    manufactureDate: Date | null;
    reorderLevel: number | null;
    maximumLevel: number | null;
    location: string | null;
    isAvailable: boolean;
    lastRestockDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
