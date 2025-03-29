import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { notifications } from '@/lib/schema';

export async function GET(request: Request) {
  try {
    // Get patient ID from the URL
    const url = new URL(request.url);
    const patientId = url.searchParams.get('patientId');
    
    // Verify authentication
    const session = await auth();
    if (!session || !session.user || (session.user.id !== patientId && session.user.role !== 'ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }
    
    // Fetch notifications for this patient using Drizzle
    const notificationsData = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, patientId))
      .orderBy(desc(notifications.createdAt));
    
    // Format the data for frontend consumption
    const formattedNotifications = notificationsData.map(notification => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
    }));
    
    return NextResponse.json(formattedNotifications);
  } catch (error) {
    console.error('Error fetching patient notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
