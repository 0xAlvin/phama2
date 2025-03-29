import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types/product';

interface ProductState {
  products: Product[];
  categories: string[];
  pharmacies: string[];
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null;
  
  // Actions
  fetchProducts: () => Promise<void>;
  getProductById: (id: string) => Product | undefined;
  clearError: () => void;
}

// Cache duration in milliseconds (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;

export const useProductStore = create<ProductState>()(
  persist(
    (set, get) => ({
      products: [],
      categories: [],
      pharmacies: [],
      isLoading: false,
      error: null,
      lastFetched: null,

      fetchProducts: async () => {
        const { lastFetched } = get();
        const now = Date.now();

        // Use cached data if available and fresh
        if (lastFetched && now - lastFetched < CACHE_DURATION && get().products.length > 0) {
          console.log('Using cached product data');
          return;
        }

        set({ isLoading: true, error: null });
        
        try {
          console.log('Fetching fresh product data from API');
          
          // Add cache-busting parameter to avoid browser caching
          const response = await fetch(`/api/products?t=${now}`, {
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            },
            // Use a longer timeout to prevent quick failures
            signal: AbortSignal.timeout(10000) // 10 seconds timeout
          });
          
          // Log response details for debugging
          console.log(`API Response: status=${response.status}, ok=${response.ok}`);
          
          // Parse the JSON response safely
          let data;
          try {
            data = await response.json();
          } catch (parseError) {
            console.error('Failed to parse response as JSON:', parseError);
            // If we get here, the response wasn't valid JSON
            // Return early with a useful error message instead of throwing
            set({ 
              isLoading: false,
              error: `Invalid API response format (${response.status})`
            });
            return;
          }
          
          // Handle error responses without throwing
          if (data && typeof data === 'object' && data.error) {
            console.error('API returned error:', data.error);
            set({ 
              isLoading: false,
              error: typeof data.error === 'string' 
                ? data.error 
                : 'The server returned an error'
            });
            return;
          }
          
          // Check if data is an array (for safety)
          if (!Array.isArray(data)) {
            console.error('Unexpected data format:', data);
            set({ 
              isLoading: false,
              error: 'Invalid API response format: expected an array of products'
            });
            return;
          }
          
          console.log(`Received ${data.length} products from API`);
          
          // Filter valid products with inventory > 0
          const availableProducts = data.filter((product: Product) => 
            product && 
            typeof product === 'object' &&
            product.inventory > 0 && 
            product.name && 
            product.pharmacy?.name
          );
          
          console.log(`Found ${availableProducts.length} available products after filtering`);
          
          // Extract unique categories
          const uniqueCategories = [...new Set(
            availableProducts.map(p => p.category).filter(Boolean)
          )].sort();
          
          // Extract unique pharmacies
          const uniquePharmacies = [...new Set(
            availableProducts.map(p => p.pharmacy.name).filter(Boolean)
          )].sort();
          
          set({ 
            products: availableProducts,
            categories: uniqueCategories,
            pharmacies: uniquePharmacies,
            lastFetched: Date.now(),
            isLoading: false,
            error: availableProducts.length === 0 ? "No medications currently available." : null
          });
        } catch (error) {
          console.error('Error in product store:', error);
          
          // Use a friendlier error message and keep any cached data
          set(state => ({ 
            error: error instanceof Error 
              ? `Error fetching products: ${error.message}` 
              : 'Failed to load products. Please try again.',
            isLoading: false,
            // Keep previous products if available to maintain UI usability
            products: state.products.length > 0 ? state.products : [],
            categories: state.categories.length > 0 ? state.categories : [],
            pharmacies: state.pharmacies.length > 0 ? state.pharmacies : []
          }));
        }
      },
      
      getProductById: (id: string) => {
        return get().products.find(product => product.id === id);
      },
      
      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'product-store',
      // Only persist the products and related metadata, not loading states
      partialize: (state) => ({ 
        products: state.products, 
        categories: state.categories,
        pharmacies: state.pharmacies,
        lastFetched: state.lastFetched
      }),
    }
  )
);
