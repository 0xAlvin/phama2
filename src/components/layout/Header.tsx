'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import styles from './Header.module.css';

export default function Header() {
  const { getItemCount } = useCart();
  const [mounted, setMounted] = useState(false);
  const cartItemCount = getItemCount();
  
  // Only show cart count after hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          PharmApp
        </Link>
        
        <nav className={styles.nav}>
          <Link href="/shop" className={styles.navLink}>Shop</Link>
          <Link href="/prescriptions" className={styles.navLink}>Prescriptions</Link>
          <Link href="/account" className={styles.navLink}>Account</Link>
          <Link href="/cart" className={styles.cartLink}>
            <div className={styles.cartIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              {mounted && cartItemCount > 0 && (
                <span className={styles.cartBadge}>{cartItemCount}</span>
              )}
            </div>
          </Link>
        </nav>
      </div>
    </header>
  );
}
