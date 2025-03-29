import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, orders, inventory } from '@/lib/schema';
import Stripe from 'stripe';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature') || '';
    
    // Verify Stripe event
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err) {
      console.error('Webhook signature verification failed', err);
      return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      
      if (orderId) {
        // Update payment status
        await db.update(payments)
          .set({ status: 'completed', updatedAt: new Date() })
          .where(eq(payments.transactionId, session.id));
        
        // Update order status
        await db.update(orders)
          .set({ status: 'paid', updatedAt: new Date() })
          .where(eq(orders.id, orderId));
          
        // Update inventory (decrement quantities)
        const orderItemsResult = await db.query.orderItems.findMany({
          where: (orderItems, { eq }) => eq(orderItems.orderId, orderId)
        });
        
        // Update inventory for each ordered item
        for (const item of orderItemsResult) {
          const inventoryItem = await db.query.inventory.findFirst({
            where: (inv, { eq, and }) => and(
              eq(inv.medicationId, item.medicationId)
            )
          });
          
          if (inventoryItem) {
            await db.update(inventory)
              .set({ 
                quantity: inventoryItem.quantity - item.quantity,
                updatedAt: new Date()
              })
              .where(eq(inventory.id, inventoryItem.id));
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
