export const OrderStatus = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    PROCESSING: 'PROCESSING',
    READY: 'READY',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    CANCELLED: 'CANCELLED'
} as const;

export const PaymentStatus = {
    PENDING: 'PENDING',
    PAID: 'PAID',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED'
} as const;

export const RecurringInterval = {
    WEEKLY: 'WEEKLY',
    BIWEEKLY: 'BIWEEKLY',
    MONTHLY: 'MONTHLY'
} as const;

export type OrderStatusType = typeof OrderStatus[keyof typeof OrderStatus];
export type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus];
export type RecurringIntervalType = typeof RecurringInterval[keyof typeof RecurringInterval];

export interface Order {
    id: string;
    orderNumber: string;
    patientId: string;
    pharmacyId: string;
    prescriptionId: string | null;
    status: OrderStatusType;
    subtotal: number;
    deliveryFee: number;
    taxAmount: number;
    discountAmount: number;
    totalAmount: number;
    paymentMethod: string;
    paymentStatus: PaymentStatusType;
    paymentReference: string | null;
    deliveryAddress: string;
    deliveryNotes: string | null;
    deliverySchedule: Date;
    isRecurring: boolean;
    recurringInterval: RecurringIntervalType | null;
    createdAt: Date;
    updatedAt: Date;
}
