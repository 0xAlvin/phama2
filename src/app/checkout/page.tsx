'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import CheckoutSummary from '@/components/checkout/CheckoutSummary';
import PaymentOptions from '@/components/checkout/PaymentOptions';
import { processStripePayment, processMpesaPayment } from '@/services/paymentService';
import styles from './checkout.module.css';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import { useSession } from 'next-auth/react';
import axios from 'axios';

export default function CheckoutPage() {
    const { cart, clearCart } = useCart();
    const { data: session } = useSession();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'mpesa' | null>(null);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'completed' | 'failed' | 'initiated'>('pending');
    const [message, setMessage] = useState('');

    // Calculate order total
    const calculateTotal = () => {
        return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0);
    };

    const handlePaymentMethodSelect = (method: 'stripe' | 'mpesa') => {
        setSelectedPaymentMethod(method);
        setError(null);
    };

    const handlePhoneNumberChange = (value: string) => {
        // Only allow digits, +, and spaces
        const sanitized = value.replace(/[^\d\s+]/g, '');
        setPhoneNumber(sanitized);
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            setError('');
            setMessage('');
            
            // Validate phone number if M-PESA is selected
            if (selectedPaymentMethod === 'mpesa') {
                if (!phoneNumber || phoneNumber.trim() === '') {
                    setError('Phone number is required for M-PESA payments');
                    return;
                }
            }
            
            const orderData = {
                items: cart.map(item => ({
                    medicationId: item.product.id,
                    quantity: item.quantity,
                    price: item.product.price,
                })),
                totalAmount: calculateTotal(),
                phoneNumber: selectedPaymentMethod === 'mpesa' ? phoneNumber : undefined,
                payment_method: selectedPaymentMethod,
            };
            
            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Failed to create order');
            }
            
            // Order created successfully
            if (selectedPaymentMethod === 'mpesa') {
                setPaymentStatus('initiated');
                setMessage('M-Pesa STK push has been sent to your phone. Please check your phone and enter your PIN to complete the transaction.');

                // Optional: Start a check for payment status
                // startPollingForPaymentStatus(result.transactionId);
                
                // Show payment instructions
                // NOTE: You might want to redirect to a payment status page here
            } else if (selectedPaymentMethod === 'cash') {
                // Redirect to success page for cash orders
                router.push(`/orders/${result.orderId}/success`);
            }
        } catch (err) {
            console.error('Payment submission error:', err);
            setPaymentStatus('error');
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        }
    };

    const handleMpesaPayment = async () => {
        try {
            setLoading(true);

            // Make sure we have all required data
            if (!cart || cart.length === 0) {
                setError('Missing required checkout information');
                setLoading(false);
                return;
            }

            // Format order items for the API
            const items = cart.map(item => ({
                medicationId: item.product.id,
                quantity: item.quantity,
                price: item.product.price
            }));

            // Send complete data to the API
            const response = await axios.post('/api/payments/mpesa', {
                amount: calculateTotal(),
                totalAmount: calculateTotal(),
                items: items,
                phoneNumber: phoneNumber,
                // We'll provide a pharmacy ID if available
                pharmacyId: router.query?.pharmacyId || localStorage.getItem('selectedPharmacyId') || undefined,
            });

            if (response.data.success) {
                // Handle successful payment
                router.push(`/orders/${response.data.data.orderId}?success=true`);
            } else {
                setError(response.data.message || 'Payment failed');
            }
        } catch (error) {
            console.error('Payment error:', error);
            setError('Payment processing failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckout = async () => {
        // Validate phone number only if MPesa is selected
        if (selectedPaymentMethod === 'mpesa') {
            if (!phoneNumber) {
                setError('Please enter your phone number');
                return;
            }
            // Validate phone number format
            const kenyanPhoneRegex = /^(?:\+?254|0)?[71]\d{8}$/;
            if (!kenyanPhoneRegex.test(phoneNumber.replace(/\s/g, ''))) {
                setError('Please enter a valid Kenyan phone number');
                return;
            }
        }
        setLoading(true);
        setPaymentStatus('processing');
        setError(null);
        try {
            // Format phone number consistently for M-Pesa
            let formattedPhone = phoneNumber;
            if (phoneNumber && phoneNumber.startsWith('0')) {
                formattedPhone = '254' + phoneNumber.substring(1);
            } else if (phoneNumber && !phoneNumber.startsWith('254')) {
                formattedPhone = '254' + phoneNumber;
            }
            
            const orderData = {
                items: cart.map(item => ({
                    medicationId: item.product.id,
                    quantity: item.quantity,
                    price: item.product.price,
                })),
                totalAmount: calculateTotal(),
                phoneNumber: selectedPaymentMethod === 'mpesa' ? formattedPhone : undefined,
                // We need to provide a pharmacy ID - for now, we'll pass a placeholder or query parameter
                pharmacyId: router.query?.pharmacyId || localStorage.getItem('selectedPharmacyId') || undefined,
            };
            console.log('Sending payment request with data:', JSON.stringify(orderData));
            let result;
            if (selectedPaymentMethod === 'stripe') {
                result = await processStripePayment(orderData);
            } else {
                result = await processMpesaPayment(orderData);
            }
            console.log('Payment result:', result);
            if (result.success && result.orderId) {
                setPaymentStatus('completed');
                clearCart();
                router.push(`/order/confirmation?orderId=${result.orderId}`);
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

                        {error && (
                            <div className="bg-red-50 p-4 rounded-md mb-4">
                                <p className="text-red-700">{error}</p>
                            </div>
                        )}

                        {paymentStatus === 'initiated' && (
                            <div className="bg-green-50 p-4 rounded-md mb-4">
                                <p className="text-green-700">{message}</p>
                                <p className="text-sm text-green-600">
                                    Please complete the payment on your phone. This page will update once payment is complete.
                                </p>
                            </div>
                        )}

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
