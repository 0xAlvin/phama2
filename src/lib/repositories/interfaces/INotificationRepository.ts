import { Notification } from '@/lib/models/Notification';

export interface INotificationRepository {
  findById(id: string): Promise<Notification | undefined>;
  findAllByUserId(userId: string, limit?: number, offset?: number): Promise<Notification[]>;
  findUnreadByUserId(userId: string): Promise<Notification[]>;
  create(notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification | undefined>;
  markAsRead(id: string): Promise<Notification | undefined>;
  markAllAsRead(userId: string): Promise<boolean>;
  delete(id: string): Promise<boolean>;
}
