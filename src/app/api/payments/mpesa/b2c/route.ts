import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payments } from '@/lib/schema';
import { auth } from '@/lib/auth';
import { initiateB2CPayment } from '@/lib/mpesa';

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check if the user has admin privileges for B2C payments
    // You might want to implement proper role-based auth here
    // This is just a placeholder
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const data = await request.json();
    const { amount, phoneNumber, remarks, occasion, referenceId } = data;

    if (!amount || !phoneNumber) {
      return NextResponse.json({ 
        error: 'Missing required fields: amount and phoneNumber are required' 
      }, { status: 400 });
    }

    try {
      // Initiate B2C payment
      const b2cResponse = await initiateB2CPayment({
        amount,
        phoneNumber,
        remarks: remarks || 'PhamApp Payment',
        occasion: occasion || referenceId || 'Payment'
      });

      // Create a record of the outgoing payment
      const [paymentRecord] = await db.insert(payments).values({
        // B2C payments require an orderId - using a placeholder for now
        orderId: referenceId || `b2c-${Date.now()}`,
        amount: amount.toString(),
        paymentMethod: 'M-PESA-B2C',
        status: 'processing',
        transactionId: b2cResponse.ConversationID || b2cResponse.originatorConversationID
      }).returning();

      return NextResponse.json({
        success: true,
        message: 'B2C payment initiated successfully',
        transactionId: b2cResponse.ConversationID || b2cResponse.originatorConversationID,
        paymentId: paymentRecord.id,
        responseDescription: b2cResponse.ResponseDescription
      });
    } catch (error: any) {
      console.error('B2C payment error:', error);
      return NextResponse.json({ 
        error: error.message || 'Failed to process B2C payment' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Server error in B2C payment:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
