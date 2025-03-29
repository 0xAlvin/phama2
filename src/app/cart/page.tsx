'use client';

import React, { useEffect } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './Cart.module.css';
import Link from 'next/link';
import DashboardHeader from '@/components/layout/DashboardHeader';
import CartItemCard from '@/components/cart/CartItemCard';
import RouteGuard from '@/components/Auth/RouteGuard';

export default function CartPage() {
  const { items, totalItems, totalPrice, cartByPharmacy } = useCart();
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  const handleCheckout = () => {
    router.push('/checkout');
  };

  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <DashboardHeader />
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <span>Loading cart...</span>
        </div>
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className={styles.container}>
        <DashboardHeader />
        <div className={styles.emptyCart}>
          <div className={styles.emptyCartIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
          </div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any medications to your cart yet.</p>
          <Link href="/shop" className={styles.shopButton}>
            Browse Medications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <RouteGuard>
      <div className={styles.container}>
        <DashboardHeader />
        <div className={styles.header}>
          <h1>Your Cart</h1>
          <span className={styles.itemCount}>({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
        </div>

        <div className={styles.cartContent}>
          <div className={styles.cartItems}>
            {Object.entries(cartByPharmacy).map(([pharmacyId, pharmacyItems]) => (
              <div key={pharmacyId} className={styles.pharmacyGroup}>
                <div className={styles.pharmacyHeader}>
                  <h2>{pharmacyItems[0].product.pharmacy.name}</h2>
                  <div className={styles.pharmacyInfo}>
                    <span>{pharmacyItems[0].product.pharmacy.address}</span>
                    <span>{pharmacyItems[0].product.pharmacy.city}, {pharmacyItems[0].product.pharmacy.state} {pharmacyItems[0].product.pharmacy.zipCode}</span>
                  </div>
                </div>
                
                {pharmacyItems.map(item => (
                  <CartItemCard key={item.product.id} item={item} />
                ))}
              </div>
            ))}
          </div>

          <div className={styles.orderSummary}>
            <div className={styles.orderSummaryCard}>
              <h2>Order Summary</h2>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>KES {totalPrice.toFixed(2)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Shipping</span>
                <span>KES 599.00</span>
              </div>
              <div className={styles.summaryDivider}></div>
              <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
                <span>Total</span>
                <span>KES {(totalPrice + 599).toFixed(2)}</span>
              </div>
              <button className={styles.checkoutButton} onClick={handleCheckout}>
                Proceed to Checkout
              </button>
              <Link href="/shop" className={styles.continueShoppingLink}>
                Continue Shopping
              </Link>
            </div>

            <div className={styles.promoCard}>
              <h3>Promo Code</h3>
              <div className={styles.promoForm}>
                <input type="text" placeholder="Enter promo code" />
                <button>Apply</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </RouteGuard>
  );
}
