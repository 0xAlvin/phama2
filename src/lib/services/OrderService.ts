import { OrderRepository } from '../repositories/OrderRepository';
import { InventoryRepository } from '../repositories/InventoryRepository';
import { NotificationRepository } from '../repositories/NotificationRepository';
import { Order, OrderStatusType } from '../models/Order';
import { OrderItem } from '../models/OrderItem';
import { NotificationTypes } from '../models/Notification';

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
    // Enhanced validation for required fields
    if (!orderData.patientId) {
      throw new Error('Patient ID is required');
    }
    
    if (!orderData.pharmacyId) {
      throw new Error('Pharmacy ID is required');
    }
    
    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      throw new Error('At least one order item is required');
    }
    
    // Calculate total amount if not provided
    let totalAmount = orderData.totalAmount;
    if (!totalAmount) {
      totalAmount = orderItems.reduce((sum, item) => 
        sum + (Number(item.price) * Number(item.quantity)), 0);
    }
    
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
    
    // Create order with all required fields
    const order = await this.orderRepository.create({
      patientId: orderData.patientId,
      pharmacyId: orderData.pharmacyId,
      totalAmount: totalAmount,
      status: orderData.status || 'pending',
      prescriptionId: orderData.prescriptionId || null
    }, orderItems);
    
    // Update inventory quantities
    for (const item of orderItems) {
      await this.inventoryRepository.decreaseQuantity(
        orderData.pharmacyId,
        item.medicationId,
        item.quantity
      );
    }
    
    // Notify pharmacy about new order
    await this.notificationRepository.create({
      userId: orderData.pharmacyId,
      title: 'New Order Received',
      message: `You have received a new order (#${order?.id.substring(0, 8)}).`,
      type: NotificationTypes.ORDER_NEW,
      relatedEntityId: order?.id || '',
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
