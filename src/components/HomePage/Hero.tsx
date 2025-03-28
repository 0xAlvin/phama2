import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="hero-section">
      <div className="container">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              Your Health, <span className="hero-title-highlight">Simplified</span>
            </h1>
            <p className="hero-description">
              PhamApp brings pharmacy services to your fingertips. Order medications, 
              track prescriptions, and consult with healthcare professionals—all from 
              the comfort of your home.
            </p>
            <div className="hero-buttons">
              <Link href="/register" className="hero-button hero-button-primary">
                Get Started
              </Link>
              <Link href="/services" className="hero-button hero-button-secondary">
                Explore Services <ArrowRight className="hero-button-icon" />
              </Link>
            </div>
            <div className="hero-stats">
              <div className="hero-stat-item">
                <div className="hero-stat-value">500k+</div>
                <div className="hero-stat-label">Active Users</div>
              </div>
              <div className="hero-stat-item">
                <div className="hero-stat-value">50+</div>
                <div className="hero-stat-label">Partner Pharmacies</div>
              </div>
              <div className="hero-stat-item">
                <div className="hero-stat-value">98%</div>
                <div className="hero-stat-label">Customer Satisfaction</div>
              </div>
            </div>
          </div>
          <div className="hero-image-container">
            <Image
              src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              alt="Patient using PhamApp on mobile phone"
              fill
              className="hero-image"
              priority
            />
            <div className="hero-image-overlay"></div>
            <div className="hero-image-decoration"></div>
          </div>
        </div>
      </div>
      <div className="hero-shape">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0L48 8.875C96 17.75 192 35.5 288 44.375C384 53.25 480 53.25 576 40.8333C672 28.4167 768 4.41667 864 0.875C960 -2.66667 1056 13.25 1152 31.5C1248 49.75 1344 70.4167 1392 80.75L1440 91.0833V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0V0Z" fill="#F9FAFB"/>
        </svg>
      </div>
    </section>
  );
}
