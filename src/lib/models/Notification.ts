// Define constant objects for Notification Types and Channels
export const NotificationTypes = {
    ORDER_UPDATE: 'ORDER_UPDATE',
    PRESCRIPTION: 'PRESCRIPTION',
    PAYMENT: 'PAYMENT',
    SYSTEM: 'SYSTEM',
    REMINDER: 'REMINDER'
} as const;

export const NotificationChannels = {
    APP: 'APP',
    EMAIL: 'EMAIL',
    SMS: 'SMS'
} as const;

// Derive the types from the constant objects
export type NotificationType = typeof NotificationTypes[keyof typeof NotificationTypes];
export type NotificationChannel = typeof NotificationChannels[keyof typeof NotificationChannels];

// Notification Interface
export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: NotificationType;
    relatedEntityId: string | null;
    relatedEntityType: string | null;
    isRead: boolean;
    channel: NotificationChannel;
    sentAt: Date;
    readAt: Date | null;
    createdAt: Date;
}

