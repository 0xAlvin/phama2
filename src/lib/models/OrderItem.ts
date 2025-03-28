export interface OrderItem {
    id: string;
    orderId: string;
    medicationId: string;
    inventoryId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    dosageInstructions: string | null;
    notes: string | null;
    substitutionAllowed: boolean;
    wasSubstituted: boolean;
    originalMedicationId: string | null;
    createdAt: Date;
    updatedAt: Date;
}
