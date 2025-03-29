'use client';

import React, { useState } from 'react';
import { Product } from '@/types/product';
import Image from 'next/image';
import styles from './ProductCard.module.css';
import ProductModal from './ProductModal';
import { useCart } from '@/contexts/CartContext';
import { useSession } from 'next-auth/react';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToCart, isAddingToCart } = useCart();
  const { status } = useSession();
  const [imageError, setImageError] = useState(false);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await addToCart(product, 1);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const getProductImageSrc = () => {
    // First check if we already have an error
    if (imageError) {
      return '/images/placeholder.png';
    }
    
    // First check for inventory_image
    if (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.trim() !== '') {
      return product.imageUrl;
    }
    
    // Then check for imageUrl 
    if (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.trim() !== '') {
      return product.imageUrl;
    }
    
    // Check for image property
    if (product.imageUrl && typeof product.imageUrl=== 'string' && product.imageUrl.trim() !== '') {
      return product.imageUrl;
    }
    
    // Try product-specific path
    if (product.id) {
      return `/images/inventory/${product.id}.jpg`;
    }
    
    // Default fallback
    return '/images/placeholder-medicine.jpg';
  };

  return (
    <>
      <div className={styles.card}>
        <div className={styles.imageContainer} onClick={openModal}>
          <Image
            src={getProductImageSrc()}
            alt={product.name}
            fill
            sizes="120px"
            className={styles.image}
            priority={true}
            quality={80}
            onError={() => setImageError(true)}
          />
          {product.prescription && (
            <div className={styles.badge}>Prescription</div>
          )}
        </div>
        <div className={styles.content}>
          <h3 className={styles.productName} onClick={openModal}>{product.name}</h3>
          <div className={styles.details}>
            <span className={styles.dosage}>{product.dosage}</span>
            <span className={styles.price}>Kes {product.price.toFixed(2)}</span>
          </div>
          <div className={styles.pharmacy}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.pharmacyIcon}>
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>{product.pharmacy.name}</span>
          </div>
          <div className={styles.actions}>
            <button className={styles.viewButton} onClick={openModal}>View Details</button>
            <button 
              className={styles.addButton} 
              onClick={handleQuickAdd}
              disabled={isAddingToCart || status !== 'authenticated'}
              title={status !== 'authenticated' ? 'Sign in to add to cart' : ''}
            >
              {isAddingToCart ? '...' : '+'}
            </button>
          </div>
        </div>
      </div>

      <ProductModal 
        product={product} 
        isOpen={isModalOpen} 
        onClose={closeModal} 
      />
    </>
  );
};

export default ProductCard;
