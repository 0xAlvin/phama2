import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments, orders, inventory } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    // MPesa sends callback data in a specific format
    // We'll parse it and update our database accordingly
    const callbackData = await request.json();
    
    // Extract the necessary data from MPesa callback
    // The structure depends on the MPesa API you're using
    // This is a simplified example
    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      TransactionID,
      PhoneNumber,
      Amount,
    } = callbackData.Body.stkCallback;
    
    // Check if the payment was successful
    const isSuccessful = ResultCode === 0;
    
    // Find our payment record using CheckoutRequestID
    // In a real implementation, you'd store the CheckoutRequestID when initiating payment
    const payment = await db.query.payments.findFirst({
      where: (payments, { eq }) => eq(payments.transactionId, CheckoutRequestID),
      with: {
        order: true
      }
    });
    
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Update payment status based on MPesa result
    await db.update(payments)
      .set({
        status: isSuccessful ? 'completed' : 'failed',
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));
    
    // If successful, update the order status
    if (isSuccessful) {
      await db.update(orders)
        .set({
          status: 'paid',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, payment.orderId));
      
      // Update inventory (decrement quantities)
      const orderItems = await db.query.orderItems.findMany({
        where: (orderItems, { eq }) => eq(orderItems.orderId, payment.orderId)
      });
      
      // Update inventory for each ordered item
      for (const item of orderItems) {
        const inventoryItem = await db.query.inventory.findFirst({
          where: (inv, { eq }) => eq(inv.medicationId, item.medicationId)
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
    
    // Send response to MPesa
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Callback processed successfully",
    });
  } catch (error) {
    console.error('MPesa callback error:', error);
    return NextResponse.json({ error: 'Failed to process MPesa callback' }, { status: 500 });
  }
}
