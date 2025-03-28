export interface PrescriptionItem {
    id: string;
    prescriptionId: string;
    medicationId: string;
    dosage: string;
    frequency: string;
    duration: string | null;
    quantity: number;
    instructions: string | null;
    refillable: boolean;
    refillsAllowed: number;
    refillsUsed: number;
    startDate: Date | null;
    endDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
}
