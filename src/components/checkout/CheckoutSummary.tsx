'use client';

import React from 'react';
import Image from 'next/image';
import { CartItem } from '@/lib/stores/useCartStore';
import styles from './CheckoutSummary.module.css';

interface CheckoutSummaryProps {
  items: CartItem[];
  total: number;
}

const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({ items, total }) => {
  return (
    <div className={styles.summary}>
      <h2 className={styles.summaryTitle}>Order Summary</h2>
      
      <div className={styles.itemsList}>
        {items.map((item) => (
          <div key={item.product.id} className={styles.item}>
            <div className={styles.itemImage}>
              <Image
                src={item.product.imageUrl || '/images/placeholder-medicine.jpg'}
                alt={item.product.name}
                width={50}
                height={50}
                className={styles.image}
              />
            </div>
            
            <div className={styles.itemDetails}>
              <h3 className={styles.itemName}>{item.product.name}</h3>
              <span className={styles.itemMeta}>
                {item.product.dosage} {item.product.prescription && '• Prescription'}
              </span>
            </div>
            
            <div className={styles.itemQuantity}>
              {item.quantity} × KES {item.product.price.toFixed(2)}
            </div>
            
            <div className={styles.itemPrice}>
              KES {(item.product.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.totals}>
        <div className={styles.totalRow}>
          <span>Subtotal</span>
          <span>KES {total.toFixed(2)}</span>
        </div>
        
        <div className={styles.totalRow}>
          <span>Delivery</span>
          <span>KES 0.00</span>
        </div>
        
        <div className={styles.finalTotal}>
          <span>Total</span>
          <span>KES {total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSummary;
