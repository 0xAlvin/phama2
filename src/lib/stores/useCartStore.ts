import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types/product';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isAddingToCart: boolean;
  addToCart: (product: Product, quantity?: number) => Promise<boolean>;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getCartByPharmacy: () => Record<string, CartItem[]>;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isAddingToCart: false,

      addToCart: async (product, quantity = 1) => {
        set({ isAddingToCart: true });
        
        try {
          set((state) => {
            const existingItem = state.items.find(item => item.product.id === product.id);
            
            if (existingItem) {
              return {
                items: state.items.map(item => 
                  item.product.id === product.id 
                    ? { ...item, quantity: item.quantity + quantity } 
                    : item
                )
              };
            } else {
              return {
                items: [...state.items, { product, quantity }]
              };
            }
          });
          
          set({ isAddingToCart: false });
          return true;
        } catch (error) {
          console.error('Error adding to cart:', error);
          set({ isAddingToCart: false });
          return false;
        }
      },
      
      removeFromCart: (productId) => {
        set((state) => ({
          items: state.items.filter(item => item.product.id !== productId)
        }));
      },
      
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        
        set((state) => ({
          items: state.items.map(item => 
            item.product.id === productId 
              ? { ...item, quantity } 
              : item
          )
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
      
      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      getTotalPrice: () => {
        return get().items.reduce(
          (sum, item) => sum + (item.product.price * item.quantity),
          0
        );
      },
      
      getCartByPharmacy: () => {
        return get().items.reduce((grouped, item) => {
          const pharmacyId = item.product.pharmacy.id;
          if (!grouped[pharmacyId]) {
            grouped[pharmacyId] = [];
          }
          grouped[pharmacyId].push(item);
          return grouped;
        }, {} as Record<string, CartItem[]>);
      }
    }),
    {
      name: 'phamapp-cart',
      partialize: (state) => ({ items: state.items })
    }
  )
);
