export const UserRoles = {
  PATIENT: 'PATIENT',
  PHARMACY: 'PHARMACY',
  PHARMACY_STAFF: 'PHARMACY_STAFF',
  ADMIN: 'ADMIN'
};

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
  emailVerified?: Date | null;
  name?: string | null;
  image?: string | null;
}
