"use client"
import React from 'react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Contact() {
  return (
    <section className="contact-section" id="contact">
      <div className="container">
        <div className="contact-container">
          <div className="contact-content">
            <h2 className="contact-title">Get in Touch</h2>
            <p className="contact-description">
              Have questions about our services or need assistance with your medications? 
              Reach out to our friendly team through any of the channels below.
            </p>
            
            <div className="contact-info-list">
              <div className="contact-info-item">
                <div className="contact-info-icon">
                  <MapPin />
                </div>
                <div className="contact-info-content">
                  <h4>Our Location</h4>
                  <p>123 Health Avenue, Suite 101<br />New York, NY 10001</p>
                </div>
              </div>
              
              <div className="contact-info-item">
                <div className="contact-info-icon">
                  <Phone />
                </div>
                <div className="contact-info-content">
                  <h4>Call Us</h4>
                  <p>+1 (555) 123-4567<br />+1 (555) 987-6543</p>
                </div>
              </div>
              
              <div className="contact-info-item">
                <div className="contact-info-icon">
                  <Mail />
                </div>
                <div className="contact-info-content">
                  <h4>Email Us</h4>
                  <p>support@phamapp.com<br />info@phamapp.com</p>
                </div>
              </div>
              
              <div className="contact-info-item">
                <div className="contact-info-icon">
                  <Clock />
                </div>
                <div className="contact-info-content">
                  <h4>Working Hours</h4>
                  <p>Mon-Fri: 8:00 AM - 8:00 PM<br />Sat-Sun: 9:00 AM - 5:00 PM</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="contact-form-container">
            <h3 className="contact-form-title">Send Us a Message</h3>
            <form className="contact-form" onSubmit={(e) => e.preventDefault()}>
              <div className="contact-form-row">
                <div className="contact-form-group">
                  <label htmlFor="name">Full Name</label>
                  <input type="text" id="name" placeholder="John Doe" required />
                </div>
                <div className="contact-form-group">
                  <label htmlFor="email">Email Address</label>
                  <input type="email" id="email" placeholder="john@example.com" required />
                </div>
              </div>
              
              <div className="contact-form-group">
                <label htmlFor="subject">Subject</label>
                <input type="text" id="subject" placeholder="How can we help you?" required />
              </div>
              
              <div className="contact-form-group">
                <label htmlFor="message">Message</label>
                <textarea id="message" placeholder="Your message here..." rows={5} required></textarea>
              </div>
              
              <Button type="submit" className="contact-submit-btn">
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
