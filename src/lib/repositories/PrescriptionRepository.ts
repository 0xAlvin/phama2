import { db } from '@/lib/db';
import { prescriptions, prescriptionItems } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { PrescriptionStatusType } from '@/lib/models/Prescription';

// Create a Prescription class to use when instantiating with 'new'
class Prescription {
  id: string;
  patientId: string;
  doctorName: string;
  doctorContact: string | null;
  issueDate: Date;
  expiryDate: Date | null;
  status: PrescriptionStatusType;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: any[];

  constructor(data: any) {
    this.id = data.id;
    this.patientId = data.patientId;
    this.doctorName = data.doctorName;
    this.doctorContact = data.doctorContact;
    this.issueDate = data.issueDate;
    this.expiryDate = data.expiryDate;
    this.status = data.status;
    this.notes = data.notes;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.items = data.items || [];
  }
}

export class PrescriptionRepository {
  async findById(id: string): Promise<Prescription | null> {
    try {
      const result = await db.query.prescriptions.findFirst({
        where: eq(prescriptions.id, id),
        with: {
          items: true
        }
      });
      return result ? new Prescription(result) : null;
    } catch (error) {
      console.error('Error finding prescription by ID:', error);
      throw error;
    }
  }

  async findByPatientId(patientId: string): Promise<Prescription[]> {
    try {
      const results = await db.query.prescriptions.findMany({
        where: eq(prescriptions.patientId, patientId),
        with: {
          items: true
        },
        orderBy: (prescriptions, { desc }) => [desc(prescriptions.createdAt)]
      });
      
      // Map database results to Prescription model
      return results.map(result => new Prescription(result));
    } catch (error) {
      console.error('Error finding prescriptions by patient ID:', error);
      throw error;
    }
  }

  async create(prescriptionData: Omit<Prescription, 'id' | 'createdAt' | 'updatedAt'>, 
               items: Array<Omit<typeof prescriptionItems.$inferInsert, 'id' | 'prescriptionId' | 'createdAt' | 'updatedAt'>>): Promise<Prescription | null> {
    try {
      
      await db.transaction(async (tx) => {
        // Insert prescription
        await tx.insert(prescriptions).values({
          patientId: prescriptionData.patientId,
          doctorName: prescriptionData.doctorName,
          doctorContact: prescriptionData.doctorContact || null,
          issueDate: prescriptionData.issueDate,
          expiryDate: prescriptionData.expiryDate || null,
          status: prescriptionData.status,
          notes: prescriptionData.notes || null,
        });
        
        // Insert prescription items
        for (const item of items) {
          await tx.insert(prescriptionItems).values({
            ...item,
            prescriptionId: id
          });
        }
      });
      
      return this.findById(id);
    } catch (error) {
      console.error('Error creating prescription:', error);
      throw error;
    }
  }

  async updateStatus(id: string, status: PrescriptionStatusType): Promise<Prescription | null> {
    try {
      const updateData: {
        status: PrescriptionStatusType;
        updatedAt: Date;
      } = { 
        status,
        updatedAt: new Date()
      };
      
      await db.update(prescriptions)
        .set(updateData)
        .where(eq(prescriptions.id, id));
        
      return this.findById(id);
    } catch (error) {
      console.error('Error updating prescription status:', error);
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      await db.transaction(async (tx) => {
        // Delete all prescription items first
        await tx.delete(prescriptionItems)
          .where(eq(prescriptionItems.prescriptionId, id));
        
        // Delete the prescription
        await tx.delete(prescriptions)
          .where(eq(prescriptions.id, id));
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting prescription:', error);
      throw error;
    }
  }
}
