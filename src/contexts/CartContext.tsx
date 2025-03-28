'use client';

import { Product } from '@/types/product';
import React, { createContext, useContext, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCartStore, CartItem as StoreCartItem } from '@/lib/stores/useCartStore';

// Re-export the CartItem type
export type CartItem = StoreCartItem;

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => Promise<boolean>;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  cartByPharmacy: Record<string, CartItem[]>;
  isAddingToCart: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isAuthenticated = status === 'authenticated';
  
  // Get cart state and methods from Zustand store
  const items = useCartStore(state => state.items);
  const isAddingToCart = useCartStore(state => state.isAddingToCart);
  const storeAddToCart = useCartStore(state => state.addToCart);
  const removeFromCart = useCartStore(state => state.removeFromCart);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const clearCart = useCartStore(state => state.clearCart);
  const getTotalItems = useCartStore(state => state.getTotalItems);
  const getTotalPrice = useCartStore(state => state.getTotalPrice);
  const getCartByPharmacy = useCartStore(state => state.getCartByPharmacy);

  // Wrap addToCart to add authentication check
  const addToCart = async (product: Product, quantity = 1): Promise<boolean> => {
    if (!isAuthenticated) {
      // Redirect to login if user is not authenticated
      router.push('/login');
      return false;
    }

    return await storeAddToCart(product, quantity);
  };

  const value = {
    items,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems: getTotalItems(),
    totalPrice: getTotalPrice(),
    cartByPharmacy: getCartByPharmacy(),
    isAddingToCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  return context;
}
