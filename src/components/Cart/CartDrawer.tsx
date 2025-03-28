import React from 'react';
import { useCart } from '@/contexts/CartContext';
import { X, Trash2, MinusCircle, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './CartDrawer.module.css';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { items, removeFromCart, updateQuantity, subtotal, totalItems } = useCart();

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.backdrop} onClick={onClose} />
      
      <div className={styles.drawer}>
        <div className={styles.header}>
          <h2 className={styles.title}>Your Cart ({totalItems} items)</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {items.length === 0 ? (
          <div className={styles.emptyCart}>
            <p className={styles.emptyMessage}>Your cart is empty</p>
            <Link 
              href="/dashboard/medications" 
              className={styles.browseButton}
              onClick={onClose}
            >
              Browse Medications
            </Link>
          </div>
        ) : (
          <>
            <div className={styles.itemsContainer}>
              {items.map((item) => (
                <div key={item.id} className={styles.item}>
                  <div className={styles.itemImage}>
                    {item.image ? (
                      <Image 
                        src={item.image} 
                        alt={item.name} 
                        fill 
                        className="object-cover rounded-md"
                      />
                    ) : (
                      <div className={styles.imagePlaceholder}>
                        <span className={styles.imagePlaceholderText}>No image</span>
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.itemContent}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <p className={styles.itemPrice}>${item.price.toFixed(2)}</p>
                    
                    <div className={styles.quantityControls}>
                      <button 
                        onClick={() => item.quantity > 1 && updateQuantity(item.medicationId, item.quantity - 1)}
                        className={styles.quantityButton}
                        disabled={item.quantity <= 1}
                      >
                        <MinusCircle className="w-4 h-4" />
                      </button>
                      <span className={styles.quantityValue}>{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.medicationId, item.quantity + 1)}
                        className={styles.quantityButton}
                      >
                        <PlusCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className={styles.itemActions}>
                    <p className={styles.itemTotal}>${(item.price * item.quantity).toFixed(2)}</p>
                    <button 
                      onClick={() => removeFromCart(item.medicationId)}
                      className={styles.removeButton}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className={styles.footer}>
              <div className={styles.subtotalRow}>
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              
              <Link 
                href="/dashboard/checkout" 
                className={styles.checkoutButton}
                onClick={onClose}
              >
                Proceed to Checkout
              </Link>
              
              <button 
                className={styles.continueButton}
                onClick={onClose}
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
