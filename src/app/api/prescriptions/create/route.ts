import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { prescriptions, prescriptionItems, medications } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.patientId || !data.doctorName || !data.issueDate || !data.medications || data.medications.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Create prescription
    const prescriptionId = uuidv4();
    
    // Begin transaction
    await db.transaction(async (tx) => {
      // Insert prescription
      await tx.insert(prescriptions).values({
        id: prescriptionId,
        patientId: data.patientId,
        doctorName: data.doctorName,
        doctorContact: data.doctorContact || null,
        issueDate: new Date(data.issueDate),
        expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        status: 'active',
        notes: data.notes || null,
        imageUrl: data.imageUrl || null,
      });
      
      // Insert prescription items
      for (const med of data.medications) {
        // First, ensure medication exists in the medications table
        let medicationId;
        
        // Try to find the medication by name
        const existingMed = await tx.select({ id: medications.id })
          .from(medications)
          .where(eq(medications.name, med.name))
          .limit(1);
        
        if (existingMed.length > 0) {
          medicationId = existingMed[0].id;
        } else {
          // Create a new medication record if it doesn't exist
          medicationId = uuidv4();
          await tx.insert(medications).values({
            id: medicationId,
            name: med.name,
            genericName: null,
            description: null,
            dosageForm: null,
            strength: null,
            manufacturer: null,
            requiresPrescription: true,
          });
        }
        
        // Now insert the prescription item
        await tx.insert(prescriptionItems).values({
          id: uuidv4(),
          prescriptionId: prescriptionId,
          medicationId: medicationId,
          dosage: med.dosage,
          frequency: med.frequency,
          duration: med.duration || null,
          quantity: med.quantity || 1, // Default to 1 if not specified
          instructions: med.instructions || null,
        });
      }
    });
    
    return NextResponse.json({ 
      success: true,
      id: prescriptionId,
      message: 'Prescription created successfully' 
    });
    
  } catch (error) {
    console.error('Error creating prescription:', error);
    return NextResponse.json({ 
      error: 'Failed to create prescription'
    }, { status: 500 });
  }
}
