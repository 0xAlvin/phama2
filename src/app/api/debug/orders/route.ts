import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders } from '@/lib/schema';

export async function GET() {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Check if the user is an admin
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    
    // Count total orders
    const totalOrders = await db.select({ count: db.fn.count() }).from(orders);
    
    // Get a sample of the latest orders
    const latestOrders = await db.query.orders.findMany({
      limit: 5,
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      with: {
        patient: true,
        pharmacy: true,
        items: true,
      }
    });
    
    return NextResponse.json({
      totalOrderCount: totalOrders[0]?.count || 0,
      sampleOrders: latestOrders.map(order => ({
        id: order.id,
        status: order.status,
        totalAmount: order.totalAmount,
        patientId: order.patientId,
        pharmacyId: order.pharmacyId,
        createdAt: order.createdAt,
        itemCount: order.items?.length || 0
      })),
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Error retrieving order data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
