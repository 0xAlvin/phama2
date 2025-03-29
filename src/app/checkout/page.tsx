'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import CheckoutSummary from '@/components/checkout/CheckoutSummary';
import PaymentOptions from '@/components/checkout/PaymentOptions';
import { processStripePayment, processMpesaPayment } from '@/services/paymentService';
import styles from './checkout.module.css';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';

export default function CheckoutPage() {
    const { cart, clearCart } = useCart();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'mpesa' | null>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'failed'>('pending');

    // Calculate order total
    const calculateTotal = () => {
        return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    };

    const handlePaymentMethodSelect = (method: 'stripe' | 'mpesa') => {
        setSelectedPaymentMethod(method);
        setError(null);
    };

    const handlePhoneNumberChange = (value: string) => {
        setPhoneNumber(value);
    };

    const handlePaymentSubmit = async () => {
        if (!selectedPaymentMethod) {
            setError('Please select a payment method');
            return;
        }

        // Validate phone number for MPesa
        if (selectedPaymentMethod === 'mpesa') {
            if (!phoneNumber) {
                setError('Phone number is required for M-Pesa payment');
                return;
            }

            // Simple validation - you might want to enhance this
            if (!phoneNumber.match(/^\+?\d{10,15}$/)) {
                setError('Please enter a valid phone number');
                return;
            }
        }

        setLoading(true);
        setPaymentStatus('processing');
        setError(null);

        try {
            // Prepare order data
            const orderData = {
                items: cart.map(item => ({
                    medicationId: item.product.id,
                    quantity: item.quantity,
                    price: item.product.price
                })),
                totalAmount: calculateTotal(),
                phoneNumber: selectedPaymentMethod === 'mpesa' ? phoneNumber : undefined
            };

            let result;
            if (selectedPaymentMethod === 'stripe') {
                result = await processStripePayment(orderData);
            } else {
                result = await processMpesaPayment(orderData);
            }

            if (result.success) {
                setPaymentStatus('completed');
                clearCart();
                // Redirect to success page after short delay
                setTimeout(() => {
                    router.push(`/order/confirmation?orderId=${result.orderId}`);
                }, 1500);
            } else {
                setPaymentStatus('failed');
                setError(result.message || 'Payment failed. Please try again.');
            }
        } catch (err) {
            setPaymentStatus('failed');
            setError('An unexpected error occurred. Please try again.');
            console.error('Payment error:', err);
        } finally {
            setLoading(false);
        }
    };

    // Redirect if cart is empty
    useEffect(() => {
        if (cart.length === 0) {
            router.push('/cart');
        }
    }, [cart, router]);

    if (cart.length === 0) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <DashboardLayout>
            <div className={styles.checkoutPage}>
                <h1 className={styles.pageTitle}>Checkout</h1>

                <div className={styles.checkoutContainer}>
                    <div className={styles.checkoutContent}>
                        <CheckoutSummary
                            items={cart}
                            total={calculateTotal()}
                        />

                        <PaymentOptions
                            selectedMethod={selectedPaymentMethod}
                            onSelectMethod={handlePaymentMethodSelect}
                            phoneNumber={phoneNumber}
                            onPhoneNumberChange={handlePhoneNumberChange}
                        />

                        {error && <div className={styles.error}>{error}</div>}

                        <button
                            className={styles.payButton}
                            onClick={handlePaymentSubmit}
                            disabled={loading || !selectedPaymentMethod || paymentStatus === 'completed'}
                        >
                            {loading ? 'Processing...' : `Pay ${calculateTotal().toFixed(2)} KES`}
                        </button>

                        {paymentStatus === 'completed' && (
                            <div className={styles.successMessage}>
                                Payment successful! Redirecting to order confirmation...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
