import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, payments } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    // Parse the callback data from M-Pesa
    const callbackData = await request.json();
    
    console.log('M-Pesa callback received:', JSON.stringify(callbackData, null, 2));

    // Extract the necessary information
    const { Body } = callbackData;
    
    if (!Body || !Body.stkCallback) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid callback data' 
      }, { status: 400 });
    }

    const { ResultCode, ResultDesc, CallbackMetadata } = Body.stkCallback;
    
    // Extract the order reference from the callback data
    // Assuming the Account Reference was formatted as "Order-{orderId}"
    const accountReference = CallbackMetadata?.Item?.find(
      (item: any) => item.Name === 'AccountReference'
    )?.Value || '';

    const orderId = accountReference.replace('Order-', '');
    
    // Find the order in the database
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
    });

    if (!order) {
      console.error(`Order not found for reference: ${accountReference}`);
      return NextResponse.json({ 
        success: false, 
        error: 'Order not found' 
      }, { status: 404 });
    }

    if (ResultCode === 0) {
      // Payment successful
      const mpesaReceiptNumber = CallbackMetadata.Item.find(
        (item: any) => item.Name === 'MpesaReceiptNumber'
      )?.Value;
      
      const amount = CallbackMetadata.Item.find(
        (item: any) => item.Name === 'Amount'
      )?.Value;

      // Record the payment
      await db.insert(payments).values({
        orderId,
        amount: amount.toString(),
        paymentMethod: 'M-PESA',
        status: 'completed',
        transactionId: mpesaReceiptNumber,
      });

      // Update order status to confirmed
      await db.update(orders)
        .set({ 
          status: 'confirmed',
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));

      return NextResponse.json({
        success: true,
        message: 'Payment processed successfully'
      });
    } else {
      // Payment failed
      console.error(`M-Pesa payment failed: ${ResultDesc}`);
      
      // Record the failed payment
      await db.insert(payments).values({
        orderId,
        amount: order.totalAmount.toString(),
        paymentMethod: 'M-PESA',
        status: 'failed',
        transactionId: null,
      });

      // Update order status to payment_failed
      await db.update(orders)
        .set({ 
          status: 'payment_failed',
          updatedAt: new Date()
        })
        .where(eq(orders.id, orderId));

      return NextResponse.json({
        success: false,
        message: `Payment failed: ${ResultDesc}`
      });
    }
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    return NextResponse.json({ 
      success: false, 
      error: `Server error: ${(error as Error).message}` 
    }, { status: 500 });
  }
}
