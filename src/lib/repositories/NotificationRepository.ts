import { db } from '@/lib/db';
import { notifications } from '@/lib/schema';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { Notification, NotificationType, NotificationChannel } from '@/lib/models/Notification';
import { INotificationRepository } from './interfaces/INotificationRepository';

export class NotificationRepository implements INotificationRepository {
  async findById(id: string): Promise<Notification | undefined> {
    return db.query.notifications.findFirst({
      where: eq(notifications.id, id)
    }) as unknown as Promise<Notification | undefined>;
  }

  async findAllByUserId(userId: string, limit = 50, offset = 0): Promise<Notification[]> {
    return db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      limit,
      offset,
      orderBy: [desc(notifications.createdAt)]
    }) as unknown as Promise<Notification[]>;
  }

  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    return db.query.notifications.findMany({
      where: and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ),
      orderBy: [desc(notifications.createdAt)]
    }) as unknown as Promise<Notification[]>;
  }

  async create(notificationData: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification | undefined> {
    const id = uuidv4();
    
    await db.insert(notifications).values({
      ...notificationData,
      id,
      createdAt: new Date()
    });
    
    return this.findById(id);
  }

  async markAsRead(id: string): Promise<Notification | undefined> {
    const now = new Date();
    
    await db.update(notifications)
      .set({ 
        isRead: true,
        readAt: now
      })
      .where(eq(notifications.id, id));
      
    return this.findById(id);
  }

  async markAllAsRead(userId: string): Promise<boolean> {
    const now = new Date();
    
    await db.update(notifications)
      .set({ 
        isRead: true,
        readAt: now
      })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
      
    return true;
  }

  async delete(id: string): Promise<boolean> {
    await db.delete(notifications)
      .where(eq(notifications.id, id));
    
    return true;
  }
}
