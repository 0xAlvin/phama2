'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import Link from 'next/link';
import styles from '@/styles/components/AuthButton.module.css';

interface AuthButtonProps {
  className?: string;
  onClick?: () => void;
}

// Changed from async to regular synchronous component
export default function AuthButton({ className = '', onClick }: AuthButtonProps) {
  const { data: session, status } = useSession();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Handle sign out with state management
  const handleSignOut = () => {
    setIsLoggingOut(true);
    signOut({ callbackUrl: '/' })
      .catch(err => {
        console.error('Sign out error:', err);
        setIsLoggingOut(false);
      });
      
    // Call additional onClick handler if provided
    if (onClick) onClick();
  };
  
  // For unauthenticated users, show sign in link
  if (status === 'unauthenticated') {
    return (
      <Link href="/signin" className={`${styles.authButton} ${styles.signIn} ${className}`}>
        Sign In
      </Link>
    );
  }
  
  // For loading state
  if (status === 'loading' || !session) {
    return (
      <button className={`${styles.authButton} ${styles.loading} ${className}`} disabled>
        <span className={styles.loadingDot}></span>
        <span className={styles.loadingDot}></span>
        <span className={styles.loadingDot}></span>
      </button>
    );
  }
  
  // For authenticated users, show sign out button
  return (
    <button 
      onClick={handleSignOut}
      className={`${styles.authButton} ${styles.signOut} ${className}`}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? 'Signing out...' : 'Sign Out'}
    </button>
  );
}
