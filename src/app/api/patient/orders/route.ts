import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPatientIdFromUserId, getPatientOrders, createPatientOrder } from '@/services/orderService';

// GET endpoint to fetch patient orders
export async function GET(request: Request) {
  try {
    // Verify authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (!session.user.id) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    // Get patient ID from user ID
    const patientId = await getPatientIdFromUserId(session.user.id);
    
    if (!patientId) {
      return NextResponse.json(
        { 
          success: true, 
          data: [], // Return empty array instead of error for better UX
          message: 'No patient profile found for this user' 
        }, 
        { status: 200 }
      );
    }
    
    // Get patient orders - now with better error handling
    try {
      const orders = await getPatientOrders(patientId, session);
      
      return NextResponse.json({
        success: true,
        data: orders
      });
    } catch (error) {
      console.error('Error in patient orders API:', error);
      // Return empty data array instead of error
      return NextResponse.json({
        success: true,
        data: [],
        message: error instanceof Error ? error.message : 'Could not fetch orders'
      });
    }
  } catch (error) {
    console.error('Error fetching patient orders:', error);
    // Return a 200 with empty data for better UX
    return NextResponse.json({
      success: true,
      data: [],
      error: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 200 });
  }
}

// POST endpoint to create a new order
export async function POST(request: Request) {
  try {
    // Verify authentication
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (!session.user.id) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }
    
    // Get patient ID from user ID
    const patientId = await getPatientIdFromUserId(session.user.id);
    
    if (!patientId) {
      return NextResponse.json({ error: 'Patient profile not found' }, { status: 404 });
    }
    
    // Parse request body
    const body = await request.json();
    const { pharmacyId, medications, prescriptionId } = body;
    
    if (!pharmacyId) {
      return NextResponse.json({ error: 'Pharmacy ID is required' }, { status: 400 });
    }
    
    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return NextResponse.json({ error: 'At least one medication is required' }, { status: 400 });
    }
    
    // Create the order
    const result = await createPatientOrder(
      patientId,
      pharmacyId,
      medications,
      session,
      prescriptionId
    );
    
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      orderId: result.orderId,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating patient order:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
