'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Product } from '@/types/product';
import Image from 'next/image';
import styles from './ProductModal.module.css';
import { useCart } from '@/contexts/CartContext';
import { useSession } from 'next-auth/react';

interface ProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [quantity, setQuantity] = useState(1);
  const { addToCart, isAddingToCart } = useCart();
  const { status } = useSession();
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    // Prevent scrolling when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  const handleAddToCart = async () => {
    const success = await addToCart(product, quantity);
    if (success) {
      setSuccessMessage('Added to cart successfully!');
      // Clear the success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    }
  };

  const incrementQuantity = () => {
    if (quantity < product.inventory) {
      setQuantity(q => q + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} ref={modalRef}>
        <button className={styles.closeButton} onClick={onClose} aria-label="Close">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className={styles.modalContent}>
          <div className={styles.imageContainer}>
            <Image
              src={product.imageUrl || '/images/placeholder-medicine.jpg'}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className={styles.image}
            />
            {product.prescription && (
              <div className={styles.badge}>Prescription Required</div>
            )}
          </div>

          <div className={styles.details}>
            <h2 className={styles.title}>{product.name}</h2>
            <div className={styles.meta}>
              <span className={styles.dosage}>{product.dosage}</span>
              <span className={styles.price}>${product.price.toFixed(2)}</span>
            </div>
            
            <div className={styles.pharmacy}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              <span>{product.pharmacy.name}</span>
            </div>
            
            <div className={styles.category}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
              <span>{product.category}</span>
            </div>

            <div className={styles.stockInfo}>
              <span className={product.inventory > 10 ? styles.inStock : styles.lowStock}>
                {product.inventory > 10 
                  ? 'In Stock' 
                  : `Low Stock (${product.inventory} left)`}
              </span>
            </div>

            <div className={styles.description}>
              <h3>Description</h3>
              <p>{product.description}</p>
            </div>
            
            <div className={styles.pharmacyInfo}>
              <h3>Pharmacy Information</h3>
              <p>{product.pharmacy.address}</p>
              <p>{product.pharmacy.city}, {product.pharmacy.state} {product.pharmacy.zipCode}</p>
              <p>Phone: {product.pharmacy.phone}</p>
            </div>

            {successMessage && (
              <div className={styles.successMessage}>
                {successMessage}
              </div>
            )}

            <div className={styles.actions}>
              <div className={styles.quantitySelector}>
                <button 
                  className={styles.quantityButton} 
                  onClick={decrementQuantity} 
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span className={styles.quantityValue}>{quantity}</span>
                <button 
                  className={styles.quantityButton} 
                  onClick={incrementQuantity} 
                  disabled={quantity >= product.inventory}
                >
                  +
                </button>
              </div>
              
              <button 
                className={styles.addToCartButton} 
                onClick={handleAddToCart}
                disabled={isAddingToCart || status !== 'authenticated'}
              >
                {status !== 'authenticated' ? 'Sign in to Add to Cart' : 
                 isAddingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
