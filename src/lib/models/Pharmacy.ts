export const PharmacyVerificationStatus = {
    PENDING: 'PENDING',
    VERIFIED: 'VERIFIED',
    REJECTED: 'REJECTED'
} as const;

export type PharmacyVerificationStatusType = typeof PharmacyVerificationStatus[keyof typeof PharmacyVerificationStatus];

export interface Pharmacy {
    id: string;
    userId: string;
    registrationNumber: string;
    taxComplianceNumber: string;
    businessRegistrationNumber: string;
    countyLicenseNumber: string;
    verificationStatus: PharmacyVerificationStatusType;
    verificationDocuments: string[];
    operationalStatus: boolean;
    createdAt: Date;
    updatedAt: Date;
}
