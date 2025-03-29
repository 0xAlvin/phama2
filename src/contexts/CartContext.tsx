'use client';

import React, { createContext, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCartStore, CartItem } from '@/lib/stores/useCartStore';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getItemCount: () => number;
  isAddingToCart: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Get cart state and methods from Zustand store
  const store = useCartStore();
  const { cart, isAddingToCart } = store;
  
  // Hydrate the cart store on client-side
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);

  const addToCart = useCallback((product: any, quantity = 1) => {
    // Optional: Uncomment if you want to require authentication
    // if (status !== 'authenticated') {
    //   router.push('/signin');
    //   return;
    // }

    store.addItem({
      product,
      quantity,
    });
  }, [store]);

  const removeFromCart = useCallback((productId: string) => {
    store.removeItem(productId);
  }, [store]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    store.updateItemQuantity(productId, quantity);
  }, [store]);

  const clearCart = useCallback(() => {
    store.clearItems();
  }, [store]);

  const getCartTotal = useCallback(() => {
    return cart.reduce((total, item) => {
      return total + (item.product.price * item.quantity);
    }, 0);
  }, [cart]);

  const getItemCount = useCallback(() => {
    return cart.reduce((count, item) => {
      return count + item.quantity;
    }, 0);
  }, [cart]);

  const value = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getItemCount,
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
