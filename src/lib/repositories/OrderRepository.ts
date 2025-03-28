import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { Order, OrderStatusType } from '@/lib/models/Order';
import { IOrderRepository } from './interfaces/IOrderRepository';
import { OrderItem } from '@/lib/models/OrderItem';

export class OrderRepository implements IOrderRepository {
  async findById(id: string): Promise<Order | undefined> {
    return db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        items: true
      }
    }) as unknown as Promise<Order | undefined>;
  }

  async findAll(limit = 50, offset = 0): Promise<Order[]> {
    return db.query.orders.findMany({
      limit,
      offset,
      orderBy: (orders, { desc }) => [desc(orders.createdAt)],
      with: {
        items: true
      }
    }) as unknown as Promise<Order[]>;
  }

  async findByPatientId(patientId: string): Promise<Order[]> {
    return db.query.orders.findMany({
      where: eq(orders.patientId, patientId),
      with: {
        items: true
      }
    }) as unknown as Promise<Order[]>;
  }

  async findByPharmacyId(pharmacyId: string): Promise<Order[]> {
    return db.query.orders.findMany({
      where: eq(orders.pharmacyId, pharmacyId),
      with: {
        items: true
      }
    }) as unknown as Promise<Order[]>;
  }

  async create(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>, 
               items: Omit<OrderItem, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<Order | undefined> {
    const orderId = uuidv4();
    
    await db.transaction(async (tx) => {
      // Insert order
      await tx.insert(orders).values({
        ...orderData,
        id: orderId
      });
      
      // Insert order items
      for (const item of items) {
        await tx.insert(orderItems).values({
          ...item,
          id: uuidv4(),
          orderId
        });
      }
    });
    
    return this.findById(orderId);
  }

  async updateStatus(orderId: string, status: OrderStatusType): Promise<Order | undefined> {
    await db.update(orders)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(orders.id, orderId));
      
    return this.findById(orderId);
  }

  async delete(orderId: string): Promise<boolean> {
    await db.transaction(async (tx) => {
      // Delete all order items first
      await tx.delete(orderItems)
        .where(eq(orderItems.orderId, orderId));
      
      // Delete the order
      await tx.delete(orders)
        .where(eq(orders.id, orderId));
    });
    
    return true;
  }
}
