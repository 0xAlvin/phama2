import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createPatientOrder, getPatientIdFromUserId } from '@/services/orderService';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    // Verify authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const { patientId, pharmacyId, medications, prescriptionId } = body;
    
    let finalPatientId = patientId;
    
    // If patient ID not provided and user is a patient, use their own ID
    if (!finalPatientId && session.user.role === 'PATIENT') {
      // Find the patient ID from the user ID
      if (!session.user.id) {
        return NextResponse.json(
          { error: 'User ID is missing' },
          { status: 400 }
        );
      }
      finalPatientId = await getPatientIdFromUserId(session.user.id);
      
      if (!finalPatientId) {
        return NextResponse.json(
          { error: 'Patient profile not found for current user' },
          { status: 404 }
        );
      }
    }
    
    // Validate required fields
    if (!finalPatientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }
    
    if (!pharmacyId) {
      return NextResponse.json({ error: 'Pharmacy ID is required' }, { status: 400 });
    }
    
    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return NextResponse.json({ error: 'Medications are required' }, { status: 400 });
    }
    
    // Create the order
    const result = await createPatientOrder(
      finalPatientId,
      pharmacyId,
      medications,
      session,
      prescriptionId
    );
    
    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to create order' }, { status: 400 });
    }
    
    // Revalidate cache paths
    revalidatePath(`/api/patient/orders?patientId=${finalPatientId}`);
    revalidatePath(`/api/pharmacy/orders?pharmacyId=${pharmacyId}`);
    
    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      message: 'Order created successfully'
    });
    
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to create order'
    }, { status: 500 });
  }
}
