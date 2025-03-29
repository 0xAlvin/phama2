import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, payments } from '@/lib/schema';
import { auth } from '@/lib/auth';

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
    const { items, totalAmount, phoneNumber } = await request.json();
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Invalid items' }, { status: 400 });
    }

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required for M-Pesa payment' }, { status: 400 });
    }

    // Get patient info
    const patient = await db.query.patients.findFirst({
      where: (patients, { eq }) => eq(patients.userId, userId)
    });

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    // Get pharmacy info (using first item's pharmacy for now)
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

    // In a real application, you would integrate with the M-Pesa API here
    // For example using the Daraja API to initiate an STK push
    // This is a simplified example
    const mpesaTransactionId = `MPESA-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // Create payment record
    const [paymentRecord] = await db.insert(payments).values({
      orderId: orderResult.id,
      amount: totalAmount,
      paymentMethod: 'mpesa',
      status: 'pending',
      transactionId: mpesaTransactionId,
    }).returning();

    // In a real implementation, you would wait for an M-Pesa callback
    // For this example, we'll simulate a successful payment
    return NextResponse.json({
      success: true,
      message: 'M-Pesa payment initiated. Please check your phone to complete the transaction.',
      orderId: orderResult.id,
      transactionId: paymentRecord.id,
    });
  } catch (error) {
    console.error('M-Pesa API error:', error);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}
