export interface PatientProfile {
    id: string;
    patientId: string;
    firstName: string;
    lastName: string;
    middleName: string | null;
    primaryAddress: string;
    alternateAddresses: string[];
    weight: number | null;
    height: number | null;
    bloodType: string | null;
    allergies: string[];
    chronicConditions: string[];
    insuranceProvider: string | null;
    insurancePolicyNumber: string | null;
    insuranceExpiryDate: Date | null;
    nhifNumber: string | null;
    createdAt: Date;
    updatedAt: Date;
}
