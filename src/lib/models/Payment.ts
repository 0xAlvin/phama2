export const PaymentStatus = {
    PENDING: 'PENDING',
    SUCCESSFUL: 'SUCCESSFUL',
    FAILED: 'FAILED',
    REFUNDED: 'REFUNDED'
} as const;

export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export interface GatewayResponse {
    [key: string]: unknown;
}

export interface Payment {
    id: string;
    orderId: string;
    amount: number;
    paymentMethod: string;
    transactionId?: string;
    status: PaymentStatus;
    paymentDate?: Date;
    gatewayResponse?: GatewayResponse;
    receiptNumber?: string;
    refundAmount?: number;
    refundReason?: string;
    refundDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}
