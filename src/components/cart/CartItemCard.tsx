'use client';

import React from 'react';
import Image from 'next/image';
import { useCart } from '@/contexts/CartContext';
import { CartItem } from '@/lib/stores/useCartStore'; // This import will now work correctly
import styles from './CartItemCard.module.css';

interface CartItemCardProps {
  item: CartItem;
}

const CartItemCard: React.FC<CartItemCardProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const { product, quantity } = item;

  const handleIncrement = () => {
    if (quantity < product.inventory) {
      updateQuantity(product.id, quantity + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      updateQuantity(product.id, quantity - 1);
    }
  };

  const handleRemove = () => {
    removeFromCart(product.id);
  };

  return (
    <div className={styles.cartItem}>
      <div className={styles.productImage}>
        <Image
          src={product.imageUrl || '/images/placeholder-medicine.jpg'}
          alt={product.name}
          fill
          sizes="120px"
          className={styles.image}
        />
      </div>
      
      <div className={styles.productInfo}>
        <div className={styles.nameAndRemove}>
          <h3>{product.name}</h3>
          <button 
            className={styles.removeButton}
            onClick={handleRemove}
            aria-label="Remove item"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div className={styles.productMeta}>
          <span className={styles.dosage}>{product.dosage}</span>
          {product.prescription && (
            <span className={styles.prescription}>Prescription</span>
          )}
        </div>
        
        <div className={styles.actionsRow}>
          <div className={styles.quantityControl}>
            <button 
              className={styles.quantityButton}
              onClick={handleDecrement}
              disabled={quantity <= 1}
            >
              -
            </button>
            <span className={styles.quantity}>{quantity}</span>
            <button 
              className={styles.quantityButton}
              onClick={handleIncrement}
              disabled={quantity >= product.inventory}
            >
              +
            </button>
          </div>
          
          <div className={styles.price}>
            <span className={styles.itemPrice}>${product.price.toFixed(2)}</span>
            {quantity > 1 && (
              <span className={styles.totalPrice}>
                ${(product.price * quantity).toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItemCard;
