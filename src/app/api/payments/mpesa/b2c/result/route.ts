import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    // B2C sends callback data in a specific format
    const callbackData = await request.json();
    
    // Log the callback for debugging
    console.log('B2C result callback received:', JSON.stringify(callbackData, null, 2));
    
    // Extract the necessary data from the B2C result callback
    const result = callbackData.Result;
    
    if (!result) {
      return NextResponse.json({ error: 'Invalid callback data' }, { status: 400 });
    }
    
    const {
      OriginatorConversationID,
      ConversationID,
      ResultCode,
      ResultDesc,
      TransactionID,
      TransactionAmount,
      ReceiverPartyPublicName
    } = result;
    
    // Check if the payment was successful
    const isSuccessful = ResultCode === 0;
    
    // Find our payment record using ConversationID or OriginatorConversationID
    let payment = await db.query.payments.findFirst({
      where: (payments, { eq }) => eq(payments.transactionId, ConversationID)
    });
    
    if (!payment) {
      // Try with OriginatorConversationID as fallback
      payment = await db.query.payments.findFirst({
        where: (payments, { or, eq, like }) => or(
          eq(payments.transactionId, OriginatorConversationID),
          like(payments.metadata, `%${OriginatorConversationID}%`) // Using metadata column from the payments schema
        )
      });
    }
    
    if (!payment) {
      console.log('Payment not found for transaction:', ConversationID, OriginatorConversationID);
      return NextResponse.json({
        ResultCode: 0,
        ResultDesc: "Callback received but no matching payment found"
      });
    }
    
    // Update the payment status based on the result
    await db.update(payments)
      .set({
        status: isSuccessful ? 'completed' : 'failed',
        transactionId: TransactionID || ConversationID,
        updatedAt: new Date(),
        metadata: JSON.stringify({
          ...(payment.metadata ? JSON.parse(payment.metadata) : {}),
          resultCode: ResultCode,
          resultDesc: ResultDesc,
          transactionID: TransactionID,
          transactionAmount: TransactionAmount,
          receiverName: ReceiverPartyPublicName
        })
      })
      .where(eq(payments.id, payment.id));
    
    // Send acknowledgment response to M-Pesa
    return NextResponse.json({
      ResultCode: 0,
      ResultDesc: "Callback processed successfully"
    });
  } catch (error) {
    console.error('B2C result callback error:', error);
    return NextResponse.json({ error: 'Failed to process B2C callback' }, { status: 500 });
  }
}
