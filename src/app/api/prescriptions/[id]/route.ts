import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PrescriptionRepository } from '@/lib/repositories/PrescriptionRepository';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const prescriptionId = params.id;
    const prescriptionRepo = new PrescriptionRepository();
    const prescription = await prescriptionRepo.findById(prescriptionId);
    
    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }
    
    return NextResponse.json(prescription);
  } catch (error) {
    console.error('Error fetching prescription:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Verify authentication
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const prescriptionId = params.id;
    const prescriptionRepo = new PrescriptionRepository();
    
    // Check if prescription exists before attempting deletion
    const prescription = await prescriptionRepo.findById(prescriptionId);
    
    if (!prescription) {
      return NextResponse.json({ error: 'Prescription not found' }, { status: 404 });
    }
    
    // In a production app, we should verify that the user has permission to delete this prescription
    // For example, checking if they're the patient, a doctor, or an admin
    
    const deleted = await prescriptionRepo.delete(prescriptionId);
    
    if (deleted) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to delete prescription' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting prescription:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
