import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartProduct {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  inventory: number;
  dosage?: string;
  prescription?: boolean;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartState {
  cart: CartItem[];
  isAddingToCart: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateItemQuantity: (productId: string, quantity: number) => void;
  clearItems: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: [],
      isAddingToCart: false,
      
      addItem: (item) => {
        set({ isAddingToCart: true });
        
        set((state) => {
          const existingItem = state.cart.find(
            (cartItem) => cartItem.product.id === item.product.id
          );
          
          if (existingItem) {
            return {
              cart: state.cart.map((cartItem) => 
                cartItem.product.id === item.product.id
                  ? { ...cartItem, quantity: cartItem.quantity + item.quantity }
                  : cartItem
              ),
              isAddingToCart: false,
            };
          }
          
          return { 
            cart: [...state.cart, item],
            isAddingToCart: false,
          };
        });
      },
      
      removeItem: (productId) => set((state) => ({
        cart: state.cart.filter((item) => item.product.id !== productId),
      })),
      
      updateItemQuantity: (productId, quantity) => set((state) => ({
        cart: state.cart.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        ),
      })),
      
      clearItems: () => set({ cart: [] }),
    }),
    {
      name: 'cart-storage',
      skipHydration: true,
    }
  )
);
