/**
 * Service for handling notification-related API calls
 */

import { ApiError } from '@/types/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

/**
 * Fetches notifications for a specific user
 */
export async function getPatientNotifications(patientId: string) {
  try {
    const response = await fetch(`/api/patient/notifications?patientId=${patientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || 'Failed to fetch notifications';
      // Log the error but don't use console.error directly
      if (process.env.NODE_ENV !== 'production') {
        console.log(`API Error: ${errorMessage}`);
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    // Let the calling component handle the error
    console.log('Error in getPatientNotifications service:', error);
    throw error;
  }
}

/**
 * Marks a notification as read
 */
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
    
    return response.ok;
  } catch (error) {
    console.error(`Error marking notification ${notificationId} as read:`, error);
    return false;
  }
};

/**
 * Marks all notifications for a user as read
 */
export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/users/${userId}/notifications/read-all`, {
      method: 'PUT',
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};
