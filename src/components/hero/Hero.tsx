'use client';
import styles from "./hero.module.css";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LazyImage } from '@/components/ui/imageLoader/LazyImage';
import heroimg from "../../../public/images/image5.jpg";

export default function HeroSection() {
    const [isScrolled, setIsScrolled] = useState(false);
    
    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            if (scrollPosition > 20) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };
        
        window.addEventListener('scroll', handleScroll);
        
        // Clean up the event listener
        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    return(
        <section className={`${styles.hero} ${isScrolled ? styles.heroScrolled : ''}`}>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>
              Modern Pharmaceutical Management <span className={styles.primaryText}>Simplified</span>
            </h1>
            <p className={styles.heroDescription}>
              Streamline your pharmacy operations with our comprehensive management system.
              Designed for pharmacists, by healthcare professionals.
            </p>
            <div className={styles.buttonGroup}>
              <Link href="/signin" className={styles.primaryButton}>
                Get Started
              </Link>
              <Link href="#features" className={styles.outlineButton}>
                Learn More
              </Link>
            </div>
          </div>
          <div className={`${styles.heroImage} ${isScrolled ? '' : styles.heroImageScrolled}`}>
            <LazyImage 
              src={heroimg}
              alt="Pharmacy Management" 
              priority={true}
              quality={90}
            />
          </div>
        </section>
    )
}

