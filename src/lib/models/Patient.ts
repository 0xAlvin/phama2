export const Gender = {
    MALE: 'MALE',
    FEMALE: 'FEMALE',
} as const;

export type GenderType = typeof Gender[keyof typeof Gender];

export interface Patient {
    id: string;
    userId: string;
    nationalId: string;
    dateOfBirth: Date;
    gender: GenderType;
    emergencyContact: string | null;
    consentToDataUse: boolean;
    marketingConsent: boolean | null;
    createdAt: Date;
    updatedAt: Date;
}
