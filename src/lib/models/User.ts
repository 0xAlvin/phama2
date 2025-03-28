export const UserRoles = {
    PATIENT: 'PATIENT',
    PHARMACY: 'PHARMACY',
} as const;

export type UserRole = typeof UserRoles[keyof typeof UserRoles];

export interface User {
    id: string;
    email: string;
    phoneNumber: string;
    password: string;
    role: UserRole;
    isVerified: boolean;
    isActive: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
    profileUrl?: string | null;
}
