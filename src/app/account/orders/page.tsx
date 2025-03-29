'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './orders.module.css';

interface Order {
  id: string;
  date: string;
  status: string;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string | null;
  pharmacy: {
    id: string;
    name: string;
  };
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch('/api/orders');
        
        if (!response.ok) {
          if (response.status === 401) {
            // If unauthorized, redirect to login
            router.push('/login');
            return;
          }
          throw new Error('Failed to fetch orders');
        }
        
        const data = await response.json();
        setOrders(data.orders);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [router]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h1>Error</h1>
        <p>{error}</p>
        <button 
          className={styles.button}
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.ordersPage}>
      <h1 className={styles.pageTitle}>My Orders</h1>
      
      {orders.length === 0 ? (
        <div className={styles.noOrders}>
          <p>You haven't placed any orders yet.</p>
          <Link href="/shop" className={styles.button}>
            Shop for Medications
          </Link>
        </div>
      ) : (
        <div className={styles.ordersList}>
          {orders.map((order) => (
            <div key={order.id} className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div className={styles.orderInfo}>
                  <h3>Order #{order.id.slice(-8)}</h3>
                  <span className={styles.orderDate}>
                    {new Date(order.date).toLocaleDateString()}
                  </span>
                </div>
                <div className={styles.orderStatus}>
                  <span className={`${styles.statusBadge} ${styles[order.status]}`}>
                    {order.status}
                  </span>
                </div>
              </div>
              
              <div className={styles.orderDetails}>
                <div className={styles.detailRow}>
                  <span className={styles.label}>Pharmacy:</span>
                  <span className={styles.value}>{order.pharmacy.name}</span>
                </div>
                
                <div className={styles.detailRow}>
                  <span className={styles.label}>Payment Method:</span>
                  <span className={styles.value}>{order.paymentMethod || 'N/A'}</span>
                </div>
                
                <div className={styles.detailRow}>
                  <span className={styles.label}>Payment Status:</span>
                  <span className={`${styles.value} ${styles.paymentStatus} ${styles[order.paymentStatus]}`}>
                    {order.paymentStatus}
                  </span>
                </div>
                
                <div className={styles.detailRow}>
                  <span className={styles.label}>Total Amount:</span>
                  <span className={styles.totalValue}>
                    KES {order.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
              
              <div className={styles.orderActions}>
                <Link href={`/order/confirmation?orderId=${order.id}`} className={styles.viewButton}>
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
