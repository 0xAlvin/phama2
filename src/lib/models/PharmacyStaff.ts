export const PharmacyStaffRoles = {
    SUPERINTENDENT: 'SUPERINTENDENT',
    PHARMACIST: 'PHARMACIST',
    TECHNOLOGIST: 'TECHNOLOGIST',
    ASSISTANT: 'ASSISTANT',
    INTERN: 'INTERN',
    ADMIN: 'ADMIN'
} as const;

export type PharmacyStaffRole = typeof PharmacyStaffRoles[keyof typeof PharmacyStaffRoles];

export interface PharmacyStaff {
    id: string;
    pharmacyId: string;
    userId: string;
    role: PharmacyStaffRole;
    firstName: string;
    lastName: string;
    licenseNumber?: string;
    email: string;
    phoneNumber?: string;
    isActive: boolean;
    hireDate: Date;
    endDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

