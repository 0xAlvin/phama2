import { db } from '@/db';
import { orders, orderItems } from '@/db/schema';
import { eq, and, desc } from 'drizzle-orm';
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
    // Validate required fields
    if (!orderData.patientId) {
      throw new Error('Patient ID is required for creating an order');
    }
    
    if (!orderData.pharmacyId) {
      throw new Error('Pharmacy ID is required for creating an order');
    }
    
    if (!orderData.totalAmount) {
      throw new Error('Total amount is required for creating an order');
    }
    
    const orderId = uuidv4();
    
    await db.transaction(async (tx) => {
      // Insert order with explicit values for all required fields
      await tx.insert(orders).values({
        id: orderId,
        patientId: orderData.patientId,
        pharmacyId: orderData.pharmacyId,
        totalAmount: orderData.totalAmount,
        status: orderData.status || 'pending',
        prescriptionId: orderData.prescriptionId || null
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
