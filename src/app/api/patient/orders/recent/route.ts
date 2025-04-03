import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, patients, users } from '@/lib/schema'; // Import orders here
import { eq, desc } from 'drizzle-orm';
import { getPatientIdFromUserId } from '@/services/orderService';

export async function GET() {
  try {
    // Authenticate the request
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user from session
    const userId = session.user.id;
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID not found' }, { status: 400 });
    }
    
    // Get patient ID from user ID
    const patientId = await getPatientIdFromUserId(userId);
    
    if (!patientId) {
      return NextResponse.json({ success: false, error: 'Patient record not found' }, { status: 404 });
    }
    
    // Get the most recent order for this patient
    const recentOrder = await db.query.orders.findFirst({
      where: eq(orders.patientId, patientId),
      orderBy: [desc(orders.createdAt)],
      with: {
        payment: true,
        pharmacy: true
      }
    });
    
    if (!recentOrder) {
      return NextResponse.json({ success: false, error: 'No recent orders found' }, { status: 404 });
    }
    
    // Return the most recent order
    return NextResponse.json({
      success: true,
      order: {
        id: recentOrder.id,
        date: recentOrder.createdAt,
        status: recentOrder.status,
        totalAmount: Number(recentOrder.totalAmount),
        paymentStatus: recentOrder.payment.length ? recentOrder.payment[0].status : 'pending',
        paymentMethod: recentOrder.payment.length ? recentOrder.payment[0].paymentMethod : null,
        pharmacy: recentOrder.pharmacy ? {
          id: recentOrder.pharmacy.id,
          name: recentOrder.pharmacy.name
        } : null
      }
    });
    
  } catch (error) {
    console.error('Error fetching recent order:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'An error occurred while fetching recent order'
    }, { status: 500 });
  }
}
