import { db } from '@/lib/db';
import { prescriptions, prescriptionItems } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { PrescriptionStatusType } from '@/lib/models/Prescription';

// Helper function to safely parse and format dates
const formatDateString = (dateValue: any): string | null => {
  if (!dateValue) return null;
  
  try {
    // If it's already a string in ISO format, return it
    if (typeof dateValue === 'string') {
      // Verify it's a valid date string
      const testDate = new Date(dateValue);
      if (isNaN(testDate.getTime())) {
        throw new Error('Invalid date string');
      }
      return dateValue;
    }
    
    // If it's a Date object, convert to ISO string
    if (dateValue instanceof Date) {
      return dateValue.toISOString();
    }
    
    // Otherwise try to parse it
    return new Date(dateValue).toISOString();
  } catch (err) {
    console.error('Date formatting error:', err);
    return null;
  }
};

// Create a Prescription class to use when instantiating with 'new'
class Prescription {
  id: string;
  patientId: string;
  doctorName: string;
  doctorContact: string | null;
  issueDate: Date;
  expiryDate: Date | null;
  status: string;
  notes: string | null;
  items: any[];
  createdAt: Date;
  updatedAt: Date;

  constructor(data: any) {
    this.id = data.id;
    this.patientId = data.patientId;
    this.doctorName = data.doctorName;
    this.doctorContact = data.doctorContact;
    
    // Safely parse dates
    try {
      this.issueDate = data.issueDate instanceof Date ? data.issueDate : new Date(data.issueDate);
    } catch (e) {
      console.error('Error parsing issue date:', e);
      this.issueDate = new Date(); // Fallback to current date
    }
    
    try {
      this.expiryDate = data.expiryDate ? 
        (data.expiryDate instanceof Date ? data.expiryDate : new Date(data.expiryDate)) : 
        null;
    } catch (e) {
      console.error('Error parsing expiry date:', e);
      this.expiryDate = null;
    }
    
    this.status = data.status;
    this.notes = data.notes;
    this.items = data.items || [];
    
    try {
      this.createdAt = data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt);
    } catch (e) {
      this.createdAt = new Date();
    }
    
    try {
      this.updatedAt = data.updatedAt instanceof Date ? data.updatedAt : new Date(data.updatedAt);
    } catch (e) {
      this.updatedAt = new Date();
    }
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

  async findByPatient(patientId: string): Promise<Prescription[]> {
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
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      
      // Format dates properly
      const issueDateStr = formatDateString(prescriptionData.issueDate);
      const expiryDateStr = formatDateString(prescriptionData.expiryDate);
      
      await db.transaction(async (tx) => {
        // Insert prescription with proper string dates
        await tx.insert(prescriptions).values({
          id,
          patientId: prescriptionData.patientId,
          doctorName: prescriptionData.doctorName,
          doctorContact: prescriptionData.doctorContact || null,
          issueDate: issueDateStr || now.split('T')[0], // Default to today if no valid date
          expiryDate: expiryDateStr,
          status: prescriptionData.status,
          notes: prescriptionData.notes || null,
          createdAt: now,
          updatedAt: now
        });
        
        // Insert prescription items
        for (const item of items) {
          await tx.insert(prescriptionItems).values({
            id: crypto.randomUUID(),
            prescriptionId: id,
            ...item,
            createdAt: now,
            updatedAt: now
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
      // Normalize status to ensure consistency
      let normalizedStatus = status;
      
      // Convert to uppercase for consistent comparison
      const uppercaseStatus = status.toUpperCase();
      if (uppercaseStatus === 'ACTIVE' || 
          uppercaseStatus === 'PENDING' || 
          uppercaseStatus === 'FILLED' || 
          uppercaseStatus === 'EXPIRED' || 
          uppercaseStatus === 'REJECTED') {
        normalizedStatus = uppercaseStatus as PrescriptionStatusType;
      }
      
      const now = new Date().toISOString();
      
      const updateData: {
        status: PrescriptionStatusType;
        updatedAt: string;
      } = { 
        status: normalizedStatus,
        updatedAt: now
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
