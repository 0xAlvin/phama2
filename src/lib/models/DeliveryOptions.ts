export const DeliveryOptions = {
    PICKUP: 'PICKUP',
    DELIVERY: 'DELIVERY',
    BOTH: 'BOTH'
} as const;

export type DeliveryOption = typeof DeliveryOptions[keyof typeof DeliveryOptions];