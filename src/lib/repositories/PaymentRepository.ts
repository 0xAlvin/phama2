import { db } from '@/lib/db';
import { payments } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { Payment, PaymentStatus } from '@/lib/models/Payment';
import { IPaymentRepository } from './interfaces/IPaymentRepository';

export class PaymentRepository implements IPaymentRepository {
  async findById(id: string): Promise<Payment | undefined> {
    return db.query.payments.findFirst({
      where: eq(payments.id, id)
    }) as unknown as Promise<Payment | undefined>;
  }

  async findByOrderId(orderId: string): Promise<Payment[]> {
    return db.query.payments.findMany({
      where: eq(payments.orderId, orderId),
      orderBy: (payments, { desc }) => [desc(payments.createdAt)]
    }) as unknown as Promise<Payment[]>;
  }

  async create(paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment | undefined> {
    const id = uuidv4();
    const now = new Date();
    
    await db.insert(payments).values({
      ...paymentData,
      id,
      createdAt: now,
      updatedAt: now
    });
    
    return this.findById(id);
  }

  async updateStatus(id: string, status: PaymentStatus, gatewayResponse?: Record<string, unknown>): Promise<Payment | undefined> {
    await db.update(payments)
      .set({ 
        status,
        gatewayResponse: gatewayResponse ? JSON.stringify(gatewayResponse) : undefined,
        updatedAt: new Date()
      })
      .where(eq(payments.id, id));
      
    return this.findById(id);
  }

  async recordRefund(id: string, amount: number, reason: string): Promise<Payment | undefined> {
    const now = new Date();
    
    await db.update(payments)
      .set({ 
        status: 'REFUNDED' as PaymentStatus,
        refundAmount: amount,
        refundReason: reason,
        refundDate: now,
        updatedAt: now
      })
      .where(eq(payments.id, id));
      
    return this.findById(id);
  }
}
