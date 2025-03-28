'use client';

import React from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import styles from './DashboardHeader.module.css';
import CartIcon from './CartIcon';

export default function DashboardHeader() {
  const { data: session } = useSession();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <Link href="/dashboard">PhamApp</Link>
        </div>

        <nav className={styles.nav}>
          <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
          <Link href="/shop" className={styles.navLink}>Shop</Link>
          <Link href="/dashboard/prescriptions" className={styles.navLink}>Prescriptions</Link>
        </nav>

        <div className={styles.actions}>
          <CartIcon />
          
          <div className={styles.userMenu}>
            <button className={styles.profileButton}>
              {session?.user?.name?.charAt(0) || 'U'}
            </button>
            <div className={styles.dropdown}>
              <div className={styles.userName}>{session?.user?.name}</div>
              <div className={styles.userEmail}>{session?.user?.email}</div>
              <div className={styles.divider}></div>
              <Link href="/profile" className={styles.dropdownItem}>Profile</Link>
              <Link href="/settings" className={styles.dropdownItem}>Settings</Link>
              <button 
                className={styles.signOutButton} 
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
