import { Payment, PaymentStatus } from '@/lib/models/Payment';

export interface IPaymentRepository {
  findById(id: string): Promise<Payment | undefined>;
  findByOrderId(orderId: string): Promise<Payment[]>;
  create(paymentData: Omit<Payment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Payment | undefined>;
  updateStatus(id: string, status: PaymentStatus, gatewayResponse?: Record<string, unknown>): Promise<Payment | undefined>;
  recordRefund(id: string, amount: number, reason: string): Promise<Payment | undefined>;
}
