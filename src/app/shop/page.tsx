'use client';

import React, { useState, useEffect } from 'react';
import ProductCard from '@/components/shop/ProductCard';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import styles from './Shop.module.css';
import DashboardHeader from '@/components/layout/DashboardHeader';
import { FaFilter, FaExclamationTriangle, FaSync } from 'react-icons/fa';
import { useProductStore } from '@/lib/stores/productStore';

export default function ShopPage() {
    // Local UI state
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedPharmacy, setSelectedPharmacy] = useState<string>('all');

    // Global product state from store
    const { 
        products, 
        categories, 
        pharmacies,
        isLoading, 
        error, 
        fetchProducts,
        clearError 
    } = useProductStore();

    useEffect(() => {
        // Fetch products when component mounts
        fetchProducts();
        
        // Optional: add a refresh interval for real-time updates
        const intervalId = setInterval(() => {
            fetchProducts();
        }, 5 * 60 * 1000); // Refresh every 5 minutes
        
        return () => clearInterval(intervalId);
    }, [fetchProducts]);

    // Apply all filters
    const filteredProducts = products.filter(
        (product) => {
            // Search query filter
            const matchesSearch = 
                product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                product.pharmacy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
            
            // Category filter
            const matchesCategory = 
                selectedCategory === 'all' || 
                product.category === selectedCategory;
            
            // Pharmacy filter
            const matchesPharmacy = 
                selectedPharmacy === 'all' || 
                product.pharmacy.name === selectedPharmacy;
            
            return matchesSearch && matchesCategory && matchesPharmacy;
        }
    );

    // Reset all filters
    const resetFilters = () => {
        setSearchQuery('');
        setSelectedCategory('all');
        setSelectedPharmacy('all');
    };

    // Retry loading products
    const handleRetry = () => {
        clearError();
        fetchProducts();
    };

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
            
            <div className={styles.actionsRow}>
                <div className={styles.filterContainer}>
                    <div className={styles.filterIcon}>
                        <FaFilter />
                        <span>Filters</span>
                    </div>
                    
                    <div className={styles.filterSelects}>
                        <select 
                            value={selectedCategory} 
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className={styles.filterSelect}
                            disabled={isLoading || products.length === 0}
                        >
                            <option value="all">All Categories</option>
                            {categories.map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                        
                        <select 
                            value={selectedPharmacy} 
                            onChange={(e) => setSelectedPharmacy(e.target.value)}
                            className={styles.filterSelect}
                            disabled={isLoading || products.length === 0}
                        >
                            <option value="all">All Pharmacies</option>
                            {pharmacies.map(pharmacy => (
                                <option key={pharmacy} value={pharmacy}>{pharmacy}</option>
                            ))}
                        </select>
                        
                        {(searchQuery || selectedCategory !== 'all' || selectedPharmacy !== 'all') && (
                            <button 
                                className={styles.resetButton}
                                onClick={resetFilters}
                            >
                                Reset Filters
                            </button>
                        )}
                    </div>
                </div>
                
                <button 
                    className={styles.refreshButton}
                    onClick={handleRetry}
                    disabled={isLoading}
                >
                    <FaSync className={isLoading ? styles.spinning : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            {isLoading ? (
                <div className={styles.productGrid}>
                    {Array.from(new Array(8)).map((_, index) => (
                        <LoadingSkeleton key={index} />
                    ))}
                </div>
            ) : error ? (
                <div className={styles.errorState}>
                    <FaExclamationTriangle size={32} />
                    <p>{error}</p>
                    <button 
                        className={styles.retryButton}
                        onClick={handleRetry}
                    >
                        Retry
                    </button>
                </div>
            ) : products.length === 0 ? (
                <div className={styles.errorState}>
                    <FaExclamationTriangle size={32} />
                    <p>No medications are currently available.</p>
                    <button 
                        className={styles.retryButton}
                        onClick={handleRetry}
                    >
                        Refresh
                    </button>
                </div>
            ) : filteredProducts.length > 0 ? (
                <>
                    <p className={styles.resultsCount}>
                        Showing {filteredProducts.length} of {products.length} {products.length === 1 ? 'medication' : 'medications'}
                    </p>
                    <div className={styles.productGrid}>
                        {filteredProducts.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                </>
            ) : (
                <div className={styles.emptyState}>
                    <p>No products found matching your criteria.</p>
                    {(searchQuery || selectedCategory !== 'all' || selectedPharmacy !== 'all') && (
                        <button 
                            className={styles.resetButton}
                            onClick={resetFilters}
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
