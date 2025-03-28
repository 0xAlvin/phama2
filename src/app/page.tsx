import React from 'react';
import Hero from '@/components/hero/Hero';
import Services from '@/components/HomePage/Services';
import About from '@/components/HomePage/About';
import Contact from '@/components/HomePage/Contact';
import Footer from '@/components/footer/Footer';
import styles from '@/app/page.module.css';
import Navbar from '@/components/navbar/Navbar';
import Features from '@/components/features/Features';
export default function Home() {
  return (
    <div>
      <LandingPage/>
    </div>
  );
}

function LandingPage() {
  return (
    <div className={styles.container}>
      <Navbar/>
      <Hero />
      <Features />
      <Services />
      <About />
      <Contact />
      <Footer />
    </div>
  );
}
