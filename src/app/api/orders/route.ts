import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { desc } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    // Authenticate the request
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get user from session
    const userId = session.user.id;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
    }
    
    // Get patient info
    const patient = await db.query.patients.findFirst({
      where: (patients, { eq }) => eq(patients.userId, userId)
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    
    // Get orders for the patient
    const ordersList = await db.query.orders.findMany({
      where: (orders, { eq }) => eq(orders.patientId, patient.id),
      orderBy: (orders) => [desc(orders.createdAt)],
      with: {
        payment: true,
        pharmacy: true
      }
    });
    
    // Format the orders data
    const formattedOrders = ordersList.map(order => ({
      id: order.id,
      date: order.createdAt,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      paymentStatus: order.payment.length ? order.payment[0].status : 'pending',
      paymentMethod: order.payment.length ? order.payment[0].paymentMethod : null,
      pharmacy: {
        id: order.pharmacy.id,
        name: order.pharmacy.name
      }
    }));

    return NextResponse.json({ orders: formattedOrders });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
