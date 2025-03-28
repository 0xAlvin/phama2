import { type } from "node:os";

export enum Role {
    PATIENT = 'PATIENT',
    PHARMACY = 'PHARMACY'
}

export type AddressData = {
    streetAddress?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
}

export type RegisterUserData = {
    email: string;
    password: string;
    phoneNumber?: string;
    role: Role;
    // Patient specific fields
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string | Date | null; // Optional - can be added later
    allergies?: Record<string, any>; // Using jsonb in database
    medicalConditions?: Record<string, any>; // Using jsonb in database
    medications?: Record<string, any>; // Using jsonb in database
    // Pharmacy specific fields
    pharmacyName?: string;
    licenseNumber?: string;
    // Common fields
    address?: AddressData;
}