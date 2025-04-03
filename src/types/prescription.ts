export interface Prescription {
  id: string;
  userId: string;
  medicationName: string;
  dosage: string;
  instructions: string;
  doctorName: string;
  pharmacyName: string;
  pharmacyId?: string;
  prescribedDate: string | Date;
  expirationDate?: string | Date;
  status: 'Active' | 'Pending' | 'Completed' | 'Expired';
  refills?: number;
  refillsRemaining?: number;
  notes?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}
