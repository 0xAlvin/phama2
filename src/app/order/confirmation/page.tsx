'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './confirmation.module.css';

interface OrderDetails {
  id: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: {
    name: string;
    quantity: number;
    price: number;
  }[];
}

export default function OrderConfirmationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // If there's no orderId, redirect to dashboard/orders after showing an error briefly
    if (!orderId) {
      setError('No order ID provided. Redirecting to orders page...');
      setLoading(false);
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push('/dashboard/orders');
      }, 3000);
      return;
    }
    
    async function fetchOrderDetails() {
      try {
        // Check for string 'undefined' which can happen when the param exists but has no value
        if (orderId === 'undefined') {
          throw new Error('Invalid order ID. Redirecting to orders page...');
        }
        
        const response = await fetch(`/api/orders/${orderId}`, {
          // Add cache: 'no-store' to prevent caching issues
          cache: 'no-store'
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch order details');
        }
        
        const data = await response.json();
        
        if (!data.order) {
          throw new Error('Order not found');
        }
        
        setOrder(data.order);
      } catch (err) {
        console.error('Error fetching order:', err);
        setError(err instanceof Error ? err.message : 'Failed to load order details');
        
        // If there's an error with the order ID itself, redirect after a short delay
        if (err instanceof Error && 
            (err.message.includes('Invalid order ID') || 
             err.message === 'Order not found')) {
          setTimeout(() => {
            router.push('/dashboard/orders');
          }, 3000);
        }
      } finally {
        setLoading(false);
      }
    }
    
    fetchOrderDetails();
  }, [orderId, router]);
  
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className={styles.errorContainer}>
        <h1>Error</h1>
        <p>{error || 'Failed to load order details'}</p>
        <Link href="/cart" className={styles.button}>Return to Cart</Link>
      </div>
    );
  }

  // Format the totalAmount properly, ensuring it's a number before using toFixed
  const formatCurrency = (amount: any): string => {
    // Convert to number if it's a string
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Check if it's a valid number
    return !isNaN(numericAmount) ? numericAmount.toFixed(2) : '0.00';
  };

  return (
    <div className={styles.confirmationPage}>
      <div className={styles.confirmationCard}>
        <div className={styles.header}>
          <div className={styles.checkmark}>
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h1>Order Confirmed!</h1>
          <p>Thank you for your purchase</p>
        </div>
        
        <div className={styles.orderInfo}>
          <div className={styles.infoRow}>
            <span className={styles.label}>Order Number:</span>
            <span className={styles.value}>{order.id}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Date:</span>
            <span className={styles.value}>
              {new Date(order.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Status:</span>
            <span className={`${styles.value} ${styles.status} ${styles[order.status]}`}>
              {order.status.toUpperCase()}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.label}>Total Amount:</span>
            <span className={styles.value}>
              KES {formatCurrency(order.totalAmount)}
            </span>
          </div>
        </div>
        
        <div className={styles.actions}>
          <Link href="/shop" className={styles.button}>
            Continue Shopping
          </Link>
          <Link href="/dashboard/orders" className={styles.outlineButton}>
            View All Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
