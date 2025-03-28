export const PrescriptionStatus = {
    PENDING: 'PENDING',
    VERIFIED: 'VERIFIED',
    FILLED: 'FILLED',
    EXPIRED: 'EXPIRED',
    REJECTED: 'REJECTED'
} as const;

export type PrescriptionStatusType = typeof PrescriptionStatus[keyof typeof PrescriptionStatus];

export interface Prescription {
    id: string;
    patientId: string;
    prescriptionNumber: string;
    prescriptionImage: string[];
    prescriptionText: string;
    doctorName: string;
    doctorLicenseNumber: string;
    hospitalName: string;
    issueDate: Date;
    expiryDate: Date | null;
    status: PrescriptionStatusType;
    verifiedBy: string | null;
    notes: string | null;
    isControlledSubstance: boolean;
    createdAt: Date;
    updatedAt: Date;
}
