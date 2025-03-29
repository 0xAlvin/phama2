import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const orderId = params.orderId;
    
    // Get order details
    const order = await db.query.orders.findFirst({
      where: (orders, { eq }) => eq(orders.id, orderId),
      with: {
        orderItems: {
          with: {
            medication: true
          }
        },
        payment: true
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify the order belongs to the current user
    const patient = await db.query.patients.findFirst({
      where: (patients, { eq }) => eq(patients.userId, session.user.id)
    });

    if (!patient || order.patientId !== patient.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Format the order data for the client
    const formattedOrder = {
      id: order.id,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      createdAt: order.createdAt,
      items: order.orderItems.map(item => ({
        name: item.medication.name,
        quantity: item.quantity,
        price: Number(item.price)
      })),
      paymentStatus: order.payment?.length ? order.payment[0].status : 'pending',
      paymentMethod: order.payment?.length ? order.payment[0].paymentMethod : null,
    };

    return NextResponse.json({ order: formattedOrder });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json({ error: 'Failed to fetch order details' }, { status: 500 });
  }
}
