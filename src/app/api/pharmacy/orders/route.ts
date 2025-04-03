import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPharmacyIdFromUserId } from '@/services/orderService';
import { db } from '@/lib/db';
import { orders, pharmacies, patients, orderItems, medications } from "@/lib/schema";
import { eq, inArray } from "drizzle-orm";

export async function GET(request: Request) {
  console.log("GET /api/pharmacy/orders endpoint called");
  
  try {
    // Authenticate the request
    const session = await auth();
    console.log("Session data:", JSON.stringify({
      authenticated: !!session?.user,
      userId: session?.user?.id || 'not-found',
      role: session?.user?.role || 'not-found'
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
    
    // Check if the user's role is a pharmacy or admin
    let pharmacyId: string | null = null;
    
    if (session.user.role === 'ADMIN') {
      // For admin, we'll handle differently - maybe they can see all orders?
      console.log("Admin user accessing pharmacy orders");
      return NextResponse.json(
        { 
          success: false, 
          error: 'Admin view of all pharmacy orders not yet implemented' 
        }, 
        { status: 501 }
      );
    }
    
    console.log("Getting pharmacy ID for user:", userId);
    pharmacyId = await getPharmacyIdFromUserId(userId);
    console.log("Pharmacy ID result:", pharmacyId || 'not-found');
    
    if (!pharmacyId) {
      console.warn(`No pharmacy record found for user ID: ${userId}`);
      return NextResponse.json({ 
        success: false, 
        error: 'No pharmacy record associated with this account',
      }, { status: 404 });
    }
    
    // Get orders for the pharmacy with safer error handling
    try {
      console.log("Fetching orders for pharmacy:", pharmacyId);
      
      // Fix the query by using separate queries instead of 'with' to avoid reference issues
      const pharmacyOrders = await db.query.orders.findMany({
        where: eq(orders.pharmacyId, pharmacyId),
        orderBy: (orders, { desc }) => [desc(orders.createdAt)]
      });
      
      console.log(`Found ${pharmacyOrders.length || 0} pharmacy orders`);
      
      // Format orders for the response
      const formattedOrders = await Promise.all(
        pharmacyOrders.map(async (order) => {
          // Get patient info separately
          const patient = await db.query.patients.findFirst({
            where: eq(patients.id, order.patientId)
          });
          
          // Get order items separately
          const orderItemsList = await db.query.orderItems.findMany({
            where: eq(orderItems.orderId, order.id)
          });
          
          // Get medication names separately
          const medicationIds = orderItemsList.map(item => item.medicationId);
          const medicationMap = new Map();
          
          if (medicationIds.length > 0) {
            const medicationsData = await db.query.medications.findMany({
              where: (meds) => inArray(meds.id, medicationIds)
            });
            
            medicationsData.forEach(med => {
              medicationMap.set(med.id, med);
            });
          }
          
          // Get pharmacy name
          const pharmacy = await db.query.pharmacies.findFirst({
            where: eq(pharmacies.id, order.pharmacyId),
            columns: { name: true }
          });
          
          // Format patient name
          let patientName = 'Unknown Patient';
          if (patient) {
            patientName = `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unnamed Patient';
          }
          
          return {
            id: order.id,
            patientId: order.patientId,
            patientName: patientName,
            pharmacyId: order.pharmacyId,
            pharmacyName: pharmacy?.name || 'Your Pharmacy',
            totalAmount: order.totalAmount,
            status: order.status,
            prescriptionId: order.prescriptionId,
            createdAt: order.createdAt,
            formattedDate: new Date(order.createdAt).toLocaleDateString(),
            isCompletable: order.status === 'pending' || order.status === 'processing',
            isCancelable: order.status === 'pending',
            isDeliverable: order.status === 'processing',
            items: orderItemsList.map(item => ({
              id: item.id,
              medicationId: item.medicationId,
              medicationName: medicationMap.get(item.medicationId)?.name || 'Unknown Medication',
              quantity: item.quantity,
              price: item.price
            }))
          };
        })
      );
      
      return NextResponse.json({ 
        success: true, 
        data: formattedOrders 
      });
    } catch (orderError) {
      console.error('Error in orders retrieval:', orderError);
      return NextResponse.json({
        success: false,
        data: [],
        error: 'Error retrieving orders data: ' + (orderError instanceof Error ? orderError.message : String(orderError))
      }, { status: 200 }); // Return 200 with empty data rather than 500
    }
  } catch (error) {
    console.error('Error in pharmacy orders API:', error);
    
    return NextResponse.json({ 
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to process request'
    }, { status: 200 }); // Return 200 with empty data rather than 500
  }
}
