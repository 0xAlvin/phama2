import { Order, OrderStatusType } from '@/lib/models/Order';
import { OrderItem } from '@/lib/models/OrderItem';

export interface IOrderRepository {
  findById(id: string): Promise<Order | undefined>;
  findAll(limit?: number, offset?: number): Promise<Order[]>;
  findByPatientId(patientId: string): Promise<Order[]>;
  findByPharmacyId(pharmacyId: string): Promise<Order[]>;
  create(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>, items: Omit<OrderItem, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Order | undefined>;
  updateStatus(orderId: string, status: OrderStatusType): Promise<Order | undefined>;
  delete(orderId: string): Promise<boolean>;
}
