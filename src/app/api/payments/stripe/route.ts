import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, payments } from '@/lib/schema';
import { auth } from '@/lib/auth';
import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16', // Use the latest Stripe API version
});

export async function POST(request: Request) {
  try {
    // Authenticate the request
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from session
    const userId = session.user.id;
    
    // Parse request body
    const { items, totalAmount } = await request.json();
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 });
    }

    // Get patient info
    const patient = await db.query.patients.findFirst({
      where: (patients, { eq }) => eq(patients.userId, userId)
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Get pharmacy info (using first item's pharmacy for now)
    // In a real app, you'd likely want to group by pharmacy
    const firstMedicationId = items[0].medicationId;
    const inventoryItem = await db.query.inventory.findFirst({
      where: (inventory, { eq }) => eq(inventory.medicationId, firstMedicationId)
    });

    if (!inventoryItem) {
      return NextResponse.json({ error: 'Medication not found in inventory' }, { status: 404 });
    }

    // Create order record
    const [orderResult] = await db.insert(orders).values({
      patientId: patient.id,
      pharmacyId: inventoryItem.pharmacyId,
      totalAmount: totalAmount,
      status: 'pending',
    }).returning();

    // Add order items
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
    const session = await stripe.checkout.sessions.create({
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
      transactionId: session.id,
    }).returning();

    return NextResponse.json({
      success: true,
      url: session.url,
      orderId: orderResult.id,
      transactionId: paymentRecord.id,
    });
  } catch (error) {
    console.error('Stripe API error:', error);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}
