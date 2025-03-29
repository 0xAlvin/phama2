'use client';

import React from 'react';
import Image from 'next/image';
import styles from './PaymentOptions.module.css';

interface PaymentOptionsProps {
  selectedMethod: 'stripe' | 'mpesa' | null;
  onSelectMethod: (method: 'stripe' | 'mpesa') => void;
  phoneNumber: string;
  onPhoneNumberChange: (value: string) => void;
}

const PaymentOptions: React.FC<PaymentOptionsProps> = ({ 
  selectedMethod, 
  onSelectMethod,
  phoneNumber,
  onPhoneNumberChange
}) => {
  return (
    <div className={styles.paymentOptions}>
      <h2 className={styles.sectionTitle}>Payment Method</h2>
      
      <div className={styles.paymentMethods}>
        <div 
          className={`${styles.paymentMethod} ${selectedMethod === 'stripe' ? styles.selected : ''}`}
          onClick={() => onSelectMethod('stripe')}
        >
          <div className={styles.paymentMethodIcon}>
            <div className={styles.stripeLogo}>
              <span>Stripe</span>
            </div>
          </div>
          <div className={styles.paymentMethodInfo}>
            <h3>Credit / Debit Card</h3>
            <p>Pay securely with your card via Stripe</p>
          </div>
          <div className={styles.selectIndicator}></div>
        </div>

        <div 
          className={`${styles.paymentMethod} ${selectedMethod === 'mpesa' ? styles.selected : ''}`}
          onClick={() => onSelectMethod('mpesa')}
        >
          <div className={styles.paymentMethodIcon}>
            <div className={styles.mpesaLogo}>
              <span>M-Pesa</span>
            </div>
          </div>
          <div className={styles.paymentMethodInfo}>
            <h3>M-Pesa</h3>
            <p>Pay using your M-Pesa mobile money account</p>
          </div>
          <div className={styles.selectIndicator}></div>
        </div>
      </div>

      {selectedMethod === 'stripe' && (
        <div className={styles.paymentDetails}>
          <p className={styles.paymentNote}>
            You will be redirected to Stripe's secure payment page to complete your payment.
          </p>
        </div>
      )}

      {selectedMethod === 'mpesa' && (
        <div className={styles.paymentDetails}>
          <p className={styles.paymentNote}>
            You will receive an STK push notification on your phone to authorize the payment.
          </p>
          <div className={styles.mpesaPhoneInput}>
            <label htmlFor="phone">Phone Number (Include country code)</label>
            <input 
              type="tel" 
              id="phone" 
              value={phoneNumber}
              onChange={(e) => onPhoneNumberChange(e.target.value)}
              placeholder="e.g. +254712345678" 
              className={styles.input}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentOptions;
