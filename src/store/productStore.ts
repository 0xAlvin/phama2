import { create } from 'zustand';

interface Product {
    id: string;
    medicationName: string;
    pharmacyName: string;
    price: number;
    quantity: number;
    medicationDescription: string;
    requiresPrescription: boolean;
    imageUrl: string; // Include imageUrl in the product state
}

interface ProductStore {
    products: Product[];
    isLoading: boolean;
    fetchProducts: (page: number, limit: number) => Promise<void>;
    cache: { [key: string]: Product[] }; // Cache to avoid unnecessary DB hits
}

export const useProductStore = create<ProductStore>((set, get) => ({
    products: [],
    isLoading: false,
    cache: {}, // Cache to avoid unnecessary DB hits
    fetchProducts: async (page, itemsPerPage) => {
        const cacheKey = `${page}-${itemsPerPage}`;
        const { cache } = get();

        if (cache[cacheKey]) {
            set({ products: cache[cacheKey], isLoading: false });
            return;
        }

        set({ isLoading: true });
        try {
            const response = await fetch(`/api/inventory?page=${page}&limit=${itemsPerPage}`);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to fetch products:', response.status, errorText);
                throw new Error(`API Error: ${response.status}`);
            }
            const data = await response.json();
            set((state) => ({
                products: data.products,
                cache: { ...state.cache, [cacheKey]: data.products },
                isLoading: false,
            }));
        } catch (error) {
            console.error('Failed to fetch products:', error);
            set({ isLoading: false });
        }
    },
}));
