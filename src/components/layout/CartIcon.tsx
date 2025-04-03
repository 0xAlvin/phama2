'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import styles from './CartIcon.module.css';

export default function CartIcon() {
  const { cart, getItemCount } = useCart();
  const [mounted, setMounted] = useState(false);

  // Only show badge after component has mounted on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  const cartItemCount = getItemCount();

  return (
    <Link href="/cart" className={styles.cartLink}>
      <div className={styles.cartIcon}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"></circle>
          <circle cx="20" cy="21" r="1"></circle>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
        </svg>
        
        {mounted && cartItemCount > 0 && (
          <span className={styles.cartCount}>{cartItemCount > 99 ? '99+' : cartItemCount}</span>
        )}
      </div>
    </Link>
  );
}
