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
  pharmacyId?: string; // Add pharmacyId field
}

interface PaymentResult {
  success: boolean;
  orderId?: string;
  message?: string;
  transactionId?: string;
}

interface B2CPaymentData {
  amount: number;
  phoneNumber: string;
  remarks?: string;
  occasion?: string;
  referenceId?: string;
}

interface B2CPaymentResult {
  success: boolean;
  message?: string;
  transactionId?: string;
  paymentId?: string;
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
    // Basic validation
    if (!orderData.phoneNumber) {
      return {
        success: false,
        message: 'Phone number is required for M-Pesa payment',
      };
    }
    console.log('Initiating M-Pesa payment with data:', {
      ...orderData,
      phoneNumber: orderData.phoneNumber // Log the phone number for debugging
    });
    
    // Call the API to initiate MPesa payment
    const response = await fetch('/api/payments/mpesa', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    
    const data = await response.json();
    console.log('M-Pesa API response:', data);
    
    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'Failed to initiate M-Pesa payment',
      };
    }
    
    // Return successful response with M-Pesa transaction details
    return {
      success: true,
      orderId: data.orderId,
      transactionId: data.transactionId,
      message: 'M-Pesa payment initiated. Please check your phone to complete the transaction.',
    };
  } catch (error) {
    console.error('M-Pesa payment error:', error);
    return {
      success: false,
      message: 'An error occurred while processing your payment',
    };
  }
}

/**
 * Process B2C payment (send money to customer)
 */
export async function processB2CPayment(paymentData: B2CPaymentData): Promise<B2CPaymentResult> {
  try {
    // Basic validation
    if (!paymentData.phoneNumber || !paymentData.amount) {
      return {
        success: false,
        message: 'Phone number and amount are required for B2C payment',
      };
    }

    // Call the API to initiate B2C payment
    const response = await fetch('/api/payments/mpesa/b2c', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });
    
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'Failed to initiate B2C payment',
      };
    }

    // Return successful response with B2C transaction details
    return {
      success: true,
      transactionId: data.transactionId,
      paymentId: data.paymentId,
      message: data.message || 'B2C payment initiated successfully',
    };
  } catch (error) {
    console.error('B2C payment error:', error);
    return {
      success: false,
      message: 'An error occurred while processing the B2C payment',
    };
  }
}
