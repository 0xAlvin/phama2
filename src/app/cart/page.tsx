'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import CartItemCard from '@/components/cart/CartItemCard';
import { useRouter } from 'next/navigation';
import styles from './cart.module.css';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';

export default function CartPage() {
  const { cart, getCartTotal } = useCart();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Ensure we're mounted before rendering cart contents
  // This is important for hydration with Zustand persist
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCheckout = () => {
    router.push('/checkout');
  };

  // Show loading state until client-side hydration is complete
  if (!mounted) {
    return <div className={styles.loading}>Loading your cart...</div>;
  }

  if (cart.length === 0) {
    return (
      <div className={styles.emptyCartContainer}>
        <h1 className={styles.pageTitle}>Your Cart</h1>
        <div className={styles.emptyCart}>
          <svg className={styles.emptyCartIcon} xmlns="http://www.w3.org/2000/svg" width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any medications to your cart yet.</p>
          <Link href="/shop" className={styles.shopButton}>
            Shop for Medications
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className={styles.cartPage}>
        <h1 className={styles.pageTitle}>Your Cart</h1>

        <div className={styles.cartContainer}>
          <div className={styles.cartItems}>
            {cart.map((item) => (
              <CartItemCard key={item.product.id} item={item} />
            ))}
          </div>

          <div className={styles.cartSummary}>
            <h2 className={styles.summaryTitle}>Order Summary</h2>

            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>Kes {getCartTotal().toFixed(2)}</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span>Kes 0.00</span>
            </div>

            <div className={styles.divider}></div>

            <div className={styles.summaryTotal}>
              <span>Total</span>
              <span>Kes {getCartTotal().toFixed(2)}</span>
            </div>

            <button
              className={styles.checkoutButton}
              onClick={handleCheckout}
            >
              Proceed to Checkout
            </button>

            <Link href="/shop" className={styles.continueShoppingLink}>
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
