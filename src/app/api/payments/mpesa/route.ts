import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';  // Replace Clerk auth with NextAuth
import { db } from '@/lib/db';
import { initiateSTKPush } from '@/lib/mpesa';
import { orders, orderItems, payments, patients, pharmacies } from '@/lib/schema';
import { v4 as uuid } from 'uuid';
import { eq } from 'drizzle-orm';

export async function POST(request: Request) {
  try {
    // Authenticate the request using NextAuth
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from session
    const userId = session.user.id;

    const body = await request.json();
    const { phoneNumber, medications = [], pharmacyId, totalAmount } = body;

    // Find patient using proper database query format
    const patient = await db.query.patients.findFirst({
      where: eq(patients.userId, userId)
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'No patient profile found' },
        { status: 400 }
      );
    }

    // Find pharmacy with proper query format
    let selectedPharmacyId = pharmacyId;
    if (!selectedPharmacyId) {
      const defaultPharmacy = await db.query.pharmacies.findFirst();
      
      if (!defaultPharmacy) {
        return NextResponse.json(
          { error: 'No pharmacy found to fulfill this order' },
          { status: 400 }
        );
      }
      selectedPharmacyId = defaultPharmacy.id;
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    // Create a reference for this transaction
    const referenceId = `ORDER-${uuid().substring(0, 8)}`;
    
    // Get the base URL for callbacks
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:3000'
        : 'https://your-production-url.com'
    );
    
    const callbackUrl = `${baseUrl}/api/payments/mpesa/callback`;
    console.log(`Initiating M-Pesa STK Push for ${phoneNumber} with amount ${totalAmount}`);
    console.log(`Using callback URL: ${callbackUrl}`);

    try {
      // Create order without checking medications
      const [order] = await db.insert(orders)
        .values({
          patientId: patient.id,
          pharmacyId: selectedPharmacyId,
          totalAmount: totalAmount.toString(),
          status: 'pending',
        })
        .returning();

      // Skip medication validation and create order items directly if provided
      if (medications && medications.length > 0) {
        console.log('Skipping medication validation for:', medications);
        
        for (const item of medications) {
          try {
            await db.insert(orderItems)
              .values({
                orderId: order.id,
                medicationId: item.medicationId,
                quantity: item.quantity || 1,
                price: item.price?.toString() || '0',
              });
          } catch (itemError) {
            console.error('Error adding order item (non-critical):', itemError);
          }
        }
      }

      // Create a payment record
      const [payment] = await db.insert(payments)
        .values({
          orderId: order.id,
          amount: totalAmount.toString(),
          paymentMethod: 'M-PESA',
          status: 'pending',
        })
        .returning();

      // Generate a proper callback URL - use a ngrok URL if available or provide a fallback
      // In production, this should be your actual domain
      let callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/mpesa/callback`;

      // For development, if you're using ngrok or a similar tunnel, set MPESA_CALLBACK_URL in .env
      if (process.env.NODE_ENV === 'development' && process.env.MPESA_CALLBACK_URL) {
        callbackUrl = `${process.env.MPESA_CALLBACK_URL}/api/payments/mpesa/callback`;
        console.log(`Using development callback URL: ${callbackUrl}`);
      }

      console.log(`Using callback URL: ${callbackUrl}`);

      // Initiate the STK Push
      const stkResponse = await initiateSTKPush(
        phoneNumber,
        totalAmount,
        callbackUrl,
        referenceId,
        'Payment for pharmacy order'
      );

      // Update payment with transaction ID
      await db.update(payments)
        .set({
          transactionId: stkResponse.CheckoutRequestID,
          // Note: metadata isn't in the schema, so we may need to add it if needed
          // If we want to store metadata, add a JSON/JSONB column to the payments table
        })
        .where(eq(payments.id, payment.id));

      return NextResponse.json({
        success: true,
        message: 'Payment initiated successfully',
        orderId: order.id,
        paymentId: payment.id,
        transactionId: stkResponse.CheckoutRequestID,
        CheckoutRequestID: stkResponse.CheckoutRequestID,
        ResponseDescription: stkResponse.ResponseDescription
      });
    } catch (mpesaError) {
      console.error('M-Pesa API error:', mpesaError);
      
      return NextResponse.json(
        {
          error: 'Failed to initiate M-Pesa payment',
          details: mpesaError.message,
          errorResponse: mpesaError.response?.data
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    return NextResponse.json({
      error: `Failed to process payment: ${error.message}`
    }, { status: 400 });
  }
}
