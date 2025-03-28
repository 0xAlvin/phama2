import { Prescription, PrescriptionStatusType } from '@/lib/models/Prescription';
import { PrescriptionItem } from '@/lib/models/PrescriptionItem';

export interface IPrescriptionRepository {
  findById(id: string): Promise<Prescription | undefined>;
  findByPatientId(patientId: string): Promise<Prescription[]>;
  create(prescriptionData: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>, 
         items: Omit<PrescriptionItem, 'id' | 'prescriptionId' | 'createdAt' | 'updatedAt'>[]): Promise<Prescription | undefined>;
  updateStatus(id: string, status: PrescriptionStatusType, verifiedBy?: string): Promise<Prescription | undefined>;
  delete(id: string): Promise<boolean>;
}
