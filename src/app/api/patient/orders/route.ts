import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPatientIdFromUserId, getPatientOrders, createPatientOrder } from '@/services/orderService';

export async function GET(request: Request) {
  console.log("GET /api/patient/orders endpoint called");
  
  try {
    // Authenticate the request
    const session = await auth();
    console.log("Session data:", JSON.stringify({
      authenticated: !!session?.user,
      userId: session?.user?.id || 'not-found'
    }));
    
    if (!session?.user) {
      console.log("Authentication failed: No user in session");
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    if (!userId) {
      console.log("User ID not found in session");
      return NextResponse.json({ 
        success: false, 
        error: 'User ID not found' 
      }, { status: 401 });
    }
    
    // Get patient ID from user ID
    console.log("Getting patient ID for user:", userId);
    const patientId = await getPatientIdFromUserId(userId);
    console.log("Patient ID result:", patientId || 'not-found');
    
    if (!patientId) {
      // Return empty data instead of error when patient not found
      console.warn(`No patient record found for user ID: ${userId}`);
      return NextResponse.json({ 
        success: true, 
        data: [],
        message: 'No patient record associated with this user'
      });
    }
    
    // Get orders for the patient - with safer error handling
    try {
      console.log("Fetching orders for patient:", patientId);
      const orders = await getPatientOrders(patientId, session);
      console.log(`Found ${orders?.length || 0} orders`);
      
      return NextResponse.json({ 
        success: true, 
        data: orders 
      });
    } catch (orderError) {
      console.error('Error in orders retrieval:', orderError);
      return NextResponse.json({
        success: false,
        data: [],
        error: 'Error retrieving orders data'
      }, { status: 200 }); // Return 200 with empty data rather than 500
    }
  } catch (error) {
    console.error('Error in patient orders API:', error);
    
    return NextResponse.json({ 
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to process request'
    }, { status: 200 }); // Return 200 with empty data rather than 500
  }
}

export async function POST(request: Request) {
  try {
    // Authenticate the request
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ 
        error: 'Authentication required' 
      }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    if (!userId) {
      return NextResponse.json({ 
        error: 'User ID not found' 
      }, { status: 401 });
    }
    
    // Get patient ID from user ID
    const patientId = await getPatientIdFromUserId(userId);
    
    if (!patientId) {
      return NextResponse.json({ 
        error: 'No patient record associated with this account'
      }, { status: 404 });
    }
    
    // Parse the request body
    const { pharmacyId, medications } = await request.json();
    if (!pharmacyId || !medications || !Array.isArray(medications) || medications.length === 0) {
      return NextResponse.json({
        error: 'Invalid request. Required fields: pharmacyId, medications'
      }, { status: 400 });
    }
    
    // Create the order with properly typed medications matching schema
    const result = await createPatientOrder(
      patientId,
      pharmacyId,
      medications.map(med => ({
        medicationId: med.medicationId, // Ensure this is a valid UUID
        quantity: med.quantity,
        price: med.price
      }))
    );
    
    if (!result.success) {
      return NextResponse.json({ success: result.success }, { status: 400 });
    }
    
    return NextResponse.json({
      success: true,
      id: result.orderId,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating patient order:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to create order'
    }, { status: 500 });
  }
}
