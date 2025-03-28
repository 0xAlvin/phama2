'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './navbar.module.css';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';

// Use dynamic import with SSR disabled for AuthButton
const AuthButton = dynamic(() => import('@/components/auth/AuthButton'), { ssr: false });

const Navigation = () => {
  const pathname = usePathname();
  const { status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    
    // Prevent body scroll when menu is open
    if (!isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  };

  useEffect(() => {
    function handleClickOutside(event: globalThis.MouseEvent) {
      if (
        menuRef.current &&
        buttonRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
        document.body.style.overflow = '';
      }
    }

    function handleEscKey(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        document.body.style.overflow = '';
      }
    }

    function handleResize() {
      if (window.innerWidth > 768 && isMenuOpen) {
        setIsMenuOpen(false);
        document.body.style.overflow = '';
      }
    }

    // Close menu when navigating to a new page
    setIsMenuOpen(false);
    document.body.style.overflow = '';

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscKey);
    window.addEventListener('resize', handleResize);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
      window.removeEventListener('resize', handleResize);
      document.body.style.overflow = '';
    };
  }, [pathname, isMenuOpen]);

  const isActive = (path: string) => {
    return pathname === path ? styles.active : '';
  };

  return (
    <nav className={styles.nav} role="navigation" aria-label="Main navigation">
      <div className={styles.container}>
        <Link href="/" className={styles.brand} aria-label="Foothills, go to home page">
          <span className={styles.brandText}>Foothills</span>
        </Link>

        <div className={styles.menu}>
          <Link href="/" className={`${styles.navLink} ${isActive('/')}`}>Home</Link>
          <Link href="#about" className={`${styles.navLink} ${isActive('#about')}`}>About us</Link>
          <Link href="#services" className={`${styles.navLink} ${isActive('#services')}`}>Services</Link>
          <Link href="#features" className={`${styles.navLink} ${isActive('#feasture')}`}>Features</Link>
        </div>

        <div className={styles.actions}>
          <Link href="/dashboard" className={styles.refillButton}>Dashboard</Link>
          <Link href="/signup" className={styles.becomePatientButton}>Register</Link>
          {status === 'authenticated' ? (
            <AuthButton />
          ) : (
            <Link href="/signin">Sign In</Link>
          )}
        </div>

        <div
          className={`${styles.mobileMenuButton} ${isMenuOpen ? styles.active : ''}`}
          onClick={toggleMenu}
          ref={buttonRef}
          role="button"
          tabIndex={0}
          aria-expanded={isMenuOpen}
          aria-label="Toggle navigation menu"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleMenu();
            }
          }}
        >
          <div className={styles.bar}></div>
          <div className={styles.bar}></div>
          <div className={styles.bar}></div>
        </div>
        
        {/* Menu overlay for better mobile experience */}
        <div 
          className={`${styles.menuOverlay} ${isMenuOpen ? styles.active : ''}`}
          onClick={() => {
            setIsMenuOpen(false);
            document.body.style.overflow = '';
          }}
          aria-hidden="true"
        />

        <div
          className={`${styles.mobileMenu} ${isMenuOpen ? styles.active : ''}`}
          ref={menuRef}
          aria-hidden={!isMenuOpen}
          role="menu"
        >
          <Link href="/" className={`${styles.mobileNavLink} ${isActive('/')}`} role="menuitem">Home</Link>
          <Link href="/about" className={`${styles.mobileNavLink} ${isActive('/about')}`} role="menuitem">About us</Link>
          <Link href="/services" className={`${styles.mobileNavLink} ${isActive('/services')}`} role="menuitem">Services</Link>
          <Link href="/mobile" className={`${styles.mobileNavLink} ${isActive('/mobile')}`} role="menuitem">Mobile</Link>
          <Link href="/resources" className={`${styles.mobileNavLink} ${isActive('/resources')}`} role="menuitem">Resources</Link>
          <Link href="/dashboard" className={styles.mobileRefillButton} role="menuitem">Dashboard</Link>
          <Link href="/become-patient" className={styles.mobileBecomePatientButton} role="menuitem">Become A Patient</Link>
          {status === 'authenticated' ? (
            <div className={styles.mobileAuthSection}>
              <Link href="/dashboard" className={`${styles.mobileNavLink} ${isActive('/dashboard')}`} role="menuitem">
                Dashboard
              </Link>
              <AuthButton className={styles.mobileAuthButton} />
            </div>
          ) : (
            <div className={styles.mobileAuthSection}>
              <Link href="/signin" className={`${styles.mobileNavLink} ${isActive('/signin')}`} role="menuitem">
                Sign In
              </Link>
              <Link href="/signup" className={styles.mobileSignUpButton} role="menuitem">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
