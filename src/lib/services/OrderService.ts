import { OrderRepository } from '@/lib/repositories/OrderRepository';
import { InventoryRepository } from '@/lib/repositories/InventoryRepository';
import { NotificationRepository } from '@/lib/repositories/NotificationRepository';
import { NotificationTypes } from '@/lib/models/Notification';
import { OrderStatusType } from '@/lib/models/Order';

export class OrderService {
  private orderRepository: OrderRepository;
  private inventoryRepository: InventoryRepository;
  private notificationRepository: NotificationRepository;

  constructor() {
    this.orderRepository = new OrderRepository();
    this.inventoryRepository = new InventoryRepository();
    this.notificationRepository = new NotificationRepository();
  }

  async getOrderById(id: string) {
    return this.orderRepository.findById(id);
  }

  async getOrdersByPatient(patientId: string) {
    return this.orderRepository.findByPatientId(patientId);
  }

  async getOrdersByPharmacy(pharmacyId: string) {
    return this.orderRepository.findByPharmacyId(pharmacyId);
  }

  async createOrder(orderData: any, orderItems: any[]) {
    // Check inventory availability
    for (const item of orderItems) {
      const inventoryItems = await this.inventoryRepository.findByMedicationId(
        item.medicationId, 
        orderData.pharmacyId
      );
      
      const totalAvailable = inventoryItems.reduce((sum, inv) => sum + inv.quantity, 0);
      
      if (totalAvailable < item.quantity) {
        throw new Error(`Not enough stock available for medication ID ${item.medicationId}`);
      }
    }
    
    // Create order
    const order = await this.orderRepository.create(orderData, orderItems);
    
    // Update inventory
    for (const item of orderItems) {
      const inventoryItems = await this.inventoryRepository.findByMedicationId(
        item.medicationId, 
        orderData.pharmacyId
      );
      
      let remainingQtyToDeduct = item.quantity;
      
      // Deduct from inventory (FIFO - First In First Out)
      for (const inv of inventoryItems) {
        if (remainingQtyToDeduct <= 0) break;
        
        const qtyToDeduct = Math.min(inv.quantity, remainingQtyToDeduct);
        await this.inventoryRepository.updateQuantity(inv.id, inv.quantity - qtyToDeduct);
        
        remainingQtyToDeduct -= qtyToDeduct;
      }
    }
    
    // Send notification to pharmacy
    await this.notificationRepository.create({
      userId: orderData.pharmacyId, // Assuming pharmacy ID is also a user ID
      title: 'New Order Received',
      message: `A new order (#${order.id.substring(0, 8)}) has been placed.`,
      type: NotificationTypes.ORDER_UPDATE,
      relatedEntityId: order.id,
      relatedEntityType: 'order',
      isRead: false,
      channel: 'APP',
      sentAt: new Date(),
      readAt: null
    });
    
    return order;
  }

  async updateOrderStatus(id: string, status: OrderStatusType, userId: string) {
    const order = await this.orderRepository.updateStatus(id, status);
    
    if (!order) {
      throw new Error(`Order with ID ${id} not found`);
    }
    
    // Notify patient about order status update
    await this.notificationRepository.create({
      userId: order.patientId,
      title: 'Order Status Updated',
      message: `Your order (#${order.id.substring(0, 8)}) status has been updated to ${status}.`,
      type: NotificationTypes.ORDER_UPDATE,
      relatedEntityId: order.id,
      relatedEntityType: 'order',
      isRead: false,
      channel: 'APP',
      sentAt: new Date(),
      readAt: null
    });
    
    return order;
  }

  async cancelOrder(id: string) {
    const order = await this.orderRepository.findById(id);
    
    if (!order) {
      throw new Error(`Order with ID ${id} not found`);
    }
    
    if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
      throw new Error(`Cannot cancel order that is already ${order.status}`);
    }
    
    await this.orderRepository.updateStatus(id, 'CANCELLED');
    
    // Return items back to inventory if order was confirmed
    if (order.status === 'CONFIRMED') {
      for (const item of order.items) {
        const inventoryItem = await this.inventoryRepository.findByMedicationId(
          item.medicationId,
          order.pharmacyId
        );
        
        if (inventoryItem.length > 0) {
          await this.inventoryRepository.updateQuantity(
            inventoryItem[0].id, 
            inventoryItem[0].quantity + item.quantity
          );
        }
      }
    }
    
    // Notify both patient and pharmacy
    await this.notificationRepository.create({
      userId: order.patientId,
      title: 'Order Cancelled',
      message: `Your order (#${order.id.substring(0, 8)}) has been cancelled.`,
      type: NotificationTypes.ORDER_UPDATE,
      relatedEntityId: order.id,
      relatedEntityType: 'order',
      isRead: false,
      channel: 'APP',
      sentAt: new Date(),
      readAt: null
    });
    
    await this.notificationRepository.create({
      userId: order.pharmacyId,
      title: 'Order Cancelled',
      message: `Order (#${order.id.substring(0, 8)}) has been cancelled.`,
      type: NotificationTypes.ORDER_UPDATE,
      relatedEntityId: order.id,
      relatedEntityType: 'order',
      isRead: false,
      channel: 'APP',
      sentAt: new Date(),
      readAt: null
    });
    
    return true;
  }
}
