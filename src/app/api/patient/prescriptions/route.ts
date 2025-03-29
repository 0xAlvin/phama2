import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { prescriptions, prescriptionItems, medications } from '@/lib/schema';

export async function GET(request: Request) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ error: 'Missing patient ID' }, { status: 400 });
    }

    // Fetch prescriptions directly without relying on Drizzle's relation inference
    const prescriptionsData = await db.select({
      id: prescriptions.id,
      doctorName: prescriptions.doctorName,
      doctorContact: prescriptions.doctorContact,
      issueDate: prescriptions.issueDate,
      expiryDate: prescriptions.expiryDate,
      status: prescriptions.status,
      notes: prescriptions.notes,
      createdAt: prescriptions.createdAt,
      updatedAt: prescriptions.updatedAt,
    })
    .from(prescriptions)
    .where(eq(prescriptions.patientId, patientId))
    .orderBy(desc(prescriptions.createdAt));
    
    // For each prescription, fetch its items separately
    const formattedPrescriptions = await Promise.all(prescriptionsData.map(async (prescription) => {
      // Get prescription items
      const items = await db.select({
        id: prescriptionItems.id,
        dosage: prescriptionItems.dosage,
        frequency: prescriptionItems.frequency,
        duration: prescriptionItems.duration,
        quantity: prescriptionItems.quantity,
        instructions: prescriptionItems.instructions,
        medicationId: prescriptionItems.medicationId,
      })
      .from(prescriptionItems)
      .where(eq(prescriptionItems.prescriptionId, prescription.id));
      
      // For each item, get the medication details
      const formattedItems = await Promise.all(items.map(async (item) => {
        const med = await db.select({
          id: medications.id,
          name: medications.name,
          description: medications.description,
        })
        .from(medications)
        .where(eq(medications.id, item.medicationId))
        .then(results => results[0]);
        
        return {
          id: item.id,
          name: med ? med.name : 'Unknown Medication',
          dosage: item.dosage,
          frequency: item.frequency,
          duration: item.duration || '30 days',
          quantity: item.quantity,
          instructions: item.instructions,
          expiryDate: prescription.expiryDate ? new Date(prescription.expiryDate).toISOString().split('T')[0] : null,
        };
      }));
      
      return {
        id: prescription.id,
        doctorName: prescription.doctorName,
        issueDate: prescription.issueDate ? new Date(prescription.issueDate).toISOString().split('T')[0] : 
                  prescription.createdAt.toISOString().split('T')[0],
        expiryDate: prescription.expiryDate ? new Date(prescription.expiryDate).toISOString().split('T')[0] : null,
        status: prescription.status,
        items: formattedItems,
      };
    }));
    
    return NextResponse.json(formattedPrescriptions);
  } catch (error) {
    console.error('Error fetching patient prescriptions:', error);

    // Handle database connection errors
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
      return NextResponse.json(
        { error: 'Database connection failed. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch prescriptions' },
      { status: 500 }
    );
  }
}
