import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, payments, patients } from '@/lib/schema';
import { auth } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia', // Use the latest Stripe API version
});

export async function POST(request: Request) {
  try {
    // Authenticate the request
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user ID from session - only rely on guaranteed fields
    const userId = session.user.id;
    
    // Log relevant session data for debugging
    console.log(`Processing Stripe payment for user ID: ${userId}`);

    const body = await request.json();
    const { items, totalAmount, pharmacyId, prescriptionId } = body;

    // Validate required fields
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order items are required' }, { status: 400 });
    }

    if (!pharmacyId) {
      return NextResponse.json({ error: 'Pharmacy ID is required' }, { status: 400 });
    }

    if (!totalAmount || isNaN(Number(totalAmount)) || Number(totalAmount) <= 0) {
      return NextResponse.json({ error: 'Valid total amount is required' }, { status: 400 });
    }

    // Get the patient ID from the user ID
    let patient = await db.query.patients.findFirst({
      where: eq(patients.userId, userId)
    });

    // If patient profile doesn't exist, create one
    if (!patient) {
      console.log(`No patient profile found for user ${userId}. Creating one now.`);
      
      try {
        // Use email to derive patient name (simpler approach)
        const email = session.user?.email || 'unknown@example.com';
        const emailName = email.split('@')[0];
        
        // Convert email name to proper case and replace dots/underscores with spaces
        const formattedName = emailName
          .replace(/[._]/g, ' ')
          .replace(/\b\w/g, letter => letter.toUpperCase());
        
        // Split into first and last name if possible
        const nameParts = formattedName.split(' ');
        const firstName = nameParts[0] || 'New';
        const lastName = nameParts.length > 1 ? nameParts[1] : 'Patient';
        
        console.log(`Creating patient with name: ${firstName} ${lastName}`);
        
        // Create patient record
        const patientId = uuidv4();
        try {
          [patient] = await db.insert(patients).values({
            id: patientId,
            userId: userId,
            firstName: firstName,
            lastName: lastName,
            dateOfBirth: new Date('2000-01-01'), // Default date
            phone: '0000000000', // Default phone
            createdAt: new Date(),
            updatedAt: new Date()
          }).returning();
          
          console.log(`Created new patient profile with ID: ${patient.id}`);
        } catch (dbError) {
          console.error('Database error creating patient:', dbError);
          
          // Log more details about the insert operation
          console.log('Insert operation details:', JSON.stringify({
            table: 'patients',
            values: {
              id: patientId,
              userId,
              firstName,
              lastName
            }
          }));
          
          return NextResponse.json({ 
            error: 'Failed to create patient profile in database',
            details: dbError instanceof Error ? dbError.message : 'Unknown database error'
          }, { status: 500 });
        }
      } catch (error) {
        console.error('Error creating patient profile:', error);
        return NextResponse.json({ 
          error: 'Failed to create patient profile. Please complete your profile before making a payment.',
          details: error instanceof Error ? error.message : undefined
        }, { status: 500 });
      }
    }

    if (!patient) {
      return NextResponse.json({ 
        error: 'Could not find or create patient profile' 
      }, { status: 404 });
    }

    // Create the order record with explicit values for all required fields
    const [orderResult] = await db.insert(orders).values({
      patientId: patient.id,
      pharmacyId: pharmacyId,
      totalAmount: totalAmount,
      status: 'pending',
      prescriptionId: prescriptionId || null
    }).returning();

    // Insert all order items
    const orderItemsToInsert = items.map(item => ({
      orderId: orderResult.id,
      medicationId: item.medicationId,
      quantity: item.quantity,
      price: item.price,
    }));

    await db.insert(orderItems).values(orderItemsToInsert);

    // Create a Stripe checkout session
    const lineItems = await Promise.all(items.map(async (item) => {
      const medication = await db.query.medications.findFirst({
        where: (medications, { eq }) => eq(medications.id, item.medicationId)
      });
      
      return {
        price_data: {
          currency: 'kes',
          product_data: {
            name: medication?.name || 'Medication',
            description: medication?.description || undefined,
          },
          unit_amount: Math.round(item.price * 100), // convert to cents
        },
        quantity: item.quantity,
      };
    }));

    // Create the Stripe session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/order/confirmation?orderId=${orderResult.id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout?canceled=true`,
      metadata: {
        orderId: orderResult.id,
      },
    });

    // Create payment record
    const [paymentRecord] = await db.insert(payments).values({
      orderId: orderResult.id,
      amount: totalAmount,
      paymentMethod: 'stripe',
      status: 'pending',
      transactionId: stripeSession.id,
    }).returning();

    return NextResponse.json({
      success: true,
      url: stripeSession.url,
      orderId: orderResult.id,
      transactionId: paymentRecord.id,
    });
  } catch (error) {
    console.error('Stripe API error:', error);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}
