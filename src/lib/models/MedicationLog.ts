export const MedicationLogActionType = {
    PURCHASE: 'PURCHASE',
    REFILL: 'REFILL',
    RETURN: 'RETURN',
    SCHEDULED: 'SCHEDULED'
} as const;

export type MedicationLogActionType = typeof MedicationLogActionType[keyof typeof MedicationLogActionType];

export interface MedicationLog {
    id: string;
    patientId: string;
    medicationId: string;
    orderId: string | null;
    prescriptionId: string | null;
    actionType: MedicationLogActionType;
    quantity: number;
    pharmacyId: string;
    pharmacistId: string | null;
    notes: string | null;
    isControlledSubstance: boolean;
    createdAt: Date;
}
