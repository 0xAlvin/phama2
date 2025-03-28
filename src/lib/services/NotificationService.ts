import { NotificationRepository } from '../repositories/NotificationRepository';
import { NotificationType, NotificationChannel } from '@/lib/models/Notification';

export class NotificationService {
  private notificationRepository: NotificationRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
  }

  async getNotifications(userId: string, limit = 50, offset = 0) {
    return this.notificationRepository.findAllByUserId(userId, limit, offset);
  }

  async getUnreadNotifications(userId: string) {
    return this.notificationRepository.findUnreadByUserId(userId);
  }

  async sendNotification(
    userId: string,
    title: string,
    message: string,
    type: NotificationType,
    relatedEntityId?: string,
    relatedEntityType?: string
  ) {
    return this.notificationRepository.create({
      userId,
      title,
      message,
      type,
      relatedEntityId: relatedEntityId || null,
      relatedEntityType: relatedEntityType || null,
      isRead: false,
      channel: 'APP',
      sentAt: new Date(),
      readAt: null
    });
  }

  async markAsRead(id: string) {
    return this.notificationRepository.markAsRead(id);
  }

  async markAllAsRead(userId: string) {
    return this.notificationRepository.markAllAsRead(userId);
  }

  async deleteNotification(id: string) {
    return this.notificationRepository.delete(id);
  }

  // Helper methods for specific notification types
  async sendOrderNotification(userId: string, orderId: string, orderNumber: string, status: string) {
    let title, message;

    switch (status) {
      case 'CONFIRMED':
        title = 'Order Confirmed';
        message = `Your order #${orderNumber} has been confirmed and is being processed.`;
        break;
      case 'PROCESSING':
        title = 'Order Processing';
        message = `Your order #${orderNumber} is now being prepared.`;
        break;
      case 'READY':
        title = 'Order Ready';
        message = `Your order #${orderNumber} is ready for pickup or delivery.`;
        break;
      case 'DELIVERED':
        title = 'Order Delivered';
        message = `Your order #${orderNumber} has been delivered.`;
        break;
      case 'CANCELLED':
        title = 'Order Cancelled';
        message = `Your order #${orderNumber} has been cancelled.`;
        break;
      default:
        title = 'Order Update';
        message = `Your order #${orderNumber} status has been updated to ${status}.`;
    }

    return this.sendNotification(userId, title, message, 'ORDER_UPDATE', orderId, 'order');
  }

  async sendPaymentNotification(userId: string, orderId: string, orderNumber: string, status: string, amount: number) {
    let title, message;

    switch (status) {
      case 'SUCCESSFUL':
        title = 'Payment Successful';
        message = `Your payment of $${amount.toFixed(2)} for order #${orderNumber} has been processed successfully.`;
        break;
      case 'FAILED':
        title = 'Payment Failed';
        message = `Your payment for order #${orderNumber} was not successful. Please try again.`;
        break;
      case 'REFUNDED':
        title = 'Payment Refunded';
        message = `Your payment of $${amount.toFixed(2)} for order #${orderNumber} has been refunded.`;
        break;
      default:
        title = 'Payment Update';
        message = `Your payment status for order #${orderNumber} has been updated to ${status}.`;
    }

    return this.sendNotification(userId, title, message, 'PAYMENT', orderId, 'payment');
  }
}
