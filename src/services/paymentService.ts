import { CartItem } from '@/lib/stores/useCartStore';

// Define types for payment processing
interface OrderData {
  items: {
    medicationId: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  phoneNumber?: string;
}

interface PaymentResult {
  success: boolean;
  orderId?: string;
  message?: string;
  transactionId?: string;
}

/**
 * Process payment through Stripe
 */
export async function processStripePayment(orderData: OrderData): Promise<PaymentResult> {
  try {
    // Call the API to create a Stripe checkout session
    const response = await fetch('/api/payments/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to process Stripe payment',
      };
    }

    // If Stripe returns a checkout URL, redirect the user
    if (data.url) {
      window.location.href = data.url;
      // This will be reached only if the redirect fails
      return {
        success: true,
        orderId: data.orderId,
        transactionId: data.transactionId,
      };
    }

    return {
      success: true,
      orderId: data.orderId,
      transactionId: data.transactionId,
    };
  } catch (error) {
    console.error('Stripe payment error:', error);
    return {
      success: false,
      message: 'An error occurred while processing your payment',
    };
  }
}

/**
 * Process payment through MPesa
 */
export async function processMpesaPayment(orderData: OrderData): Promise<PaymentResult> {
  try {
    // Call the API to initiate MPesa payment
    const response = await fetch('/api/payments/mpesa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || 'Failed to process M-Pesa payment',
      };
    }

    return {
      success: true,
      orderId: data.orderId,
      transactionId: data.transactionId,
      message: 'M-Pesa payment initiated. Please check your phone.',
    };
  } catch (error) {
    console.error('M-Pesa payment error:', error);
    return {
      success: false,
      message: 'An error occurred while processing your payment',
    };
  }
}
