import React from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function About() {
  return (
    <section className="about-section" id="about">
      <div className="about-background"></div>
      <div className="container">
        <div className="about-container">
          <div className="about-content">
            <p className="about-subtitle">About PhamApp</p>
            <h2 className="about-title">Your Digital Health Companion</h2>
            <p className="about-description">
              PhamApp is revolutionizing the way you manage your health by bringing the pharmacy to your fingertips. Our mission is to make healthcare more accessible, convenient, and personalized for everyone through innovative technology and exceptional service.
            </p>
            
            <div className="about-features">
              <div className="about-feature">
                <Check className="feature-icon" />
                <p className="feature-text">Licensed Professionals</p>
              </div>
              <div className="about-feature">
                <Check className="feature-icon" />
                <p className="feature-text">Secure & Confidential</p>
              </div>
              <div className="about-feature">
                <Check className="feature-icon" />
                <p className="feature-text">Fast Medication Delivery</p>
              </div>
              <div className="about-feature">
                <Check className="feature-icon" />
                <p className="feature-text">Insurance Accepted</p>
              </div>
            </div>
            
            <div style={{ marginTop: '32px' }}>
              <Button className="btn btn-default">Learn More About Us</Button>
            </div>
          </div>
          
          <div className="about-image-container">
            <Image
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"
              alt="Healthcare professionals using PhamApp"
              fill
              className="about-image"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
