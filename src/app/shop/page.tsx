'use client';

import React, { useState, useEffect } from 'react';
import ProductCard from '@/components/shop/ProductCard';
import { Product } from '@/types/product';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import styles from './Shop.module.css';
import DashboardHeader from '@/components/layout/DashboardHeader';

export default function ShopPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('/api/products');
                if (!response.ok) throw new Error('Failed to fetch products');
                const data = await response.json();

                // Filter only products with inventory > 0
                const availableProducts = data.filter((product: Product) => product.inventory > 0);
                setProducts(availableProducts);
                setIsLoading(false);
            } catch (error) {
                console.error('Error fetching products:', error);
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const filteredProducts = products.filter(
        (product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className={styles.container}>
            <DashboardHeader />
            <div className={styles.header}>
                <h1 className={styles.title}>Available Medications</h1>
                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search for medications or pharmacies..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <div className={styles.searchIcon}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className={styles.productGrid}>
                    {Array.from(new Array(8)).map((_, index) => (
                        <LoadingSkeleton key={index} />
                    ))}
                </div>
            ) : filteredProducts.length > 0 ? (
                <div className={styles.productGrid}>
                    {filteredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <p>No products found matching your search.</p>
                </div>
            )}
        </div>
    );
}
