"use client";

import React, { useState, useEffect } from 'react';
import OrdersTable from '@/components/dashboard/orders/OrdersTable';
import OrdersHeader from '@/components/dashboard/orders/OrdersHeader';
import OrdersStats from '@/components/dashboard/orders/OrdersStats';
import styles from '@/styles/dashboard/orders/orders.module.css';
import { OrderType } from '@/types/orders';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserRoles } from '@/lib/models/User';
import CreateOrderModal from '@/components/dashboard/orders/CreateOrderModal';

export default function OrdersPage() {
    const [orders, setOrders] = useState<OrderType[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<OrderType[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const { data: session, status } = useSession();
    const router = useRouter();

    // Detect if user is a patient or pharmacy
    const isPatient = session?.user?.role === UserRoles.PATIENT;
    const isPharmacy = session?.user?.role === UserRoles.PHARMACY || session?.user?.role === 'PHARMACY_STAFF';
    const isAdmin = session?.user?.role === 'ADMIN';

    useEffect(() => {
        // Redirect if not authenticated
        if (status === 'unauthenticated') {
            router.push('/signin');
            return;
        }

        // Don't fetch until we have session info
        if (status !== 'authenticated') return;

        const fetchOrdersData = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                let orderData: OrderType[] = [];
                
                if (isPatient) {
                    orderData = await fetchPatientOrders();
                } else if (isPharmacy || isAdmin) {
                    orderData = await fetchPharmacyOrders();
                }
                
                setOrders(orderData);
                setFilteredOrders(orderData);
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError("Failed to load orders. Please try again later.");
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchOrdersData();
    }, [status, isPatient, isPharmacy, isAdmin, router]);

    // Function to fetch orders for patients
    const fetchPatientOrders = async (): Promise<OrderType[]> => {
        try {
            const response = await fetch('/api/patient/orders');
            
            // Even if response is not OK, don't throw error
            // Just log it and return empty array
            if (!response.ok) {
                console.warn(`Error fetching patient orders: ${response.statusText}`);
                return [];
            }
            
            const data = await response.json();
            
            // If no data or data is not an array, return empty array
            if (!data || !data.data || !Array.isArray(data.data)) {
                return [];
            }
            
            return data.data.map((order: any) => ({
                id: order.id || `temp-${Date.now()}`,
                patientName: session?.user?.name || 'You',
                pharmacyName: order.pharmacyName || 'Unknown Pharmacy',
                totalAmount: order.totalAmount || 0,
                status: order.status || 'unknown',
                hasPrescription: !!order.prescriptionId,
                createdAt: order.createdAt || new Date().toISOString(),
                formattedDate: order.formattedDate || 'Unknown date',
                isCompletable: order.isCompletable || false,
                isCancelable: order.isCancelable || false,
            }));
        } catch (error) {
            console.error('Error in fetchPatientOrders:', error);
            return []; // Return empty array on error
        }
    };

    // Function to fetch orders for pharmacies
    const fetchPharmacyOrders = async (): Promise<OrderType[]> => {
        try {
            const response = await fetch('/api/pharmacy/orders');
            
            // Even if response is not OK, don't throw error
            // Just log it and return empty array
            if (!response.ok) {
                console.warn(`Error fetching pharmacy orders: ${response.statusText}`);
                return [];
            }
            
            const data = await response.json();
            
            // If no data or data is not an array, return empty array
            if (!data || !data.data || !Array.isArray(data.data)) {
                return [];
            }
            
            return data.data.map((order: any) => ({
                id: order.id || `temp-${Date.now()}`,
                patientName: order.patientName || 'Unknown Patient',
                pharmacyName: order.pharmacyName || 'Your Pharmacy',
                totalAmount: order.totalAmount || 0,
                status: order.status || 'unknown',
                hasPrescription: !!order.prescriptionId,
                createdAt: order.createdAt || new Date().toISOString(),
                formattedDate: order.formattedDate || 'Unknown date',
                isCompletable: order.isCompletable || false,
                isCancelable: order.isCancelable || false,
                isDeliverable: order.isDeliverable || false,
            }));
        } catch (error) {
            console.error('Error in fetchPharmacyOrders:', error);
            return []; // Return empty array on error
        }
    };

    useEffect(() => {
        // Filter orders based on search term and status
        const result = orders.filter(order => {
            const matchesSearch =
                order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.pharmacyName.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === "all" || order.status.toLowerCase() === statusFilter.toLowerCase();

            return matchesSearch && matchesStatus;
        });

        setFilteredOrders(result);
    }, [searchTerm, statusFilter, orders]);

    const handleSearch = (term: string) => {
        setSearchTerm(term);
    };

    const handleStatusFilter = (status: string) => {
        setStatusFilter(status);
    };

    const handleCreateOrder = () => {
        setShowCreateModal(true);
    };

    const closeCreateModal = () => {
        setShowCreateModal(false);
    };

    const handleOrderCreated = async () => {
        // Refresh orders after a new one is created
        closeCreateModal();
        setIsLoading(true);
        
        try {
            let orderData: OrderType[] = [];
            if (isPatient) {
                orderData = await fetchPatientOrders();
            }
            setOrders(orderData);
            setFilteredOrders(orderData);
        } catch (err) {
            console.error('Error refreshing orders:', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate statistics for the stats cards
    const orderStats = {
        total: orders.length,
        pending: orders.filter(order => order.status.toLowerCase() === "pending").length,
        processing: orders.filter(order => order.status.toLowerCase() === "processing").length,
        shipped: orders.filter(order => order.status.toLowerCase() === "shipped").length,
        delivered: orders.filter(order => order.status.toLowerCase() === "delivered" || order.status.toLowerCase() === "completed").length,
        cancelled: orders.filter(order => order.status.toLowerCase() === "cancelled").length,
        revenue: orders.reduce((sum, order) => sum + order.totalAmount, 0)
    };

    return (
        <DashboardLayout>
            <div className={styles.ordersPage}>
                <h1 className={styles.pageTitle}>Orders Management</h1>

                <OrdersStats stats={orderStats} isPharmacy={isPharmacy} />

                <div className={styles.ordersContainer}>
                    <OrdersHeader
                        onSearch={handleSearch}
                        onStatusFilter={handleStatusFilter}
                        searchTerm={searchTerm}
                        statusFilter={statusFilter}
                        onCreateOrder={isPatient ? handleCreateOrder : undefined}
                    />

                    {isLoading ? (
                        <div className={styles.loadingContainer}>
                            <div className={styles.spinner}></div>
                            <p>Loading orders...</p>
                        </div>
                    ) : error ? (
                        <div className={styles.errorContainer}>
                            <p className={styles.errorMessage}>{error}</p>
                            <button
                                className={styles.retryButton}
                                onClick={() => {
                                    setIsLoading(true);
                                    setError(null);
                                    if (isPatient) {
                                        fetchPatientOrders()
                                            .then(data => {
                                                setOrders(data);
                                                setFilteredOrders(data);
                                                setIsLoading(false);
                                            })
                                            .catch(err => {
                                                console.error(err);
                                                setError("Failed to load orders. Please try again later.");
                                                setIsLoading(false);
                                            });
                                    } else if (isPharmacy) {
                                        fetchPharmacyOrders()
                                            .then(data => {
                                                setOrders(data);
                                                setFilteredOrders(data);
                                                setIsLoading(false);
                                            })
                                            .catch(err => {
                                                console.error(err);
                                                setError("Failed to load orders. Please try again later.");
                                                setIsLoading(false);
                                            });
                                    }
                                }}
                            >
                                Retry
                            </button>
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No orders found</p>
                            {isPatient && (
                                <button 
                                    className={styles.createOrderBtn}
                                    onClick={handleCreateOrder}
                                >
                                    Create Your First Order
                                </button>
                            )}
                        </div>
                    ) : (
                        <OrdersTable 
                            orders={filteredOrders} 
                            isPharmacy={isPharmacy} 
                            isPatient={isPatient}
                        />
                    )}
                </div>
            </div>
            
            {/* Create Order Modal for Patients */}
            {isPatient && showCreateModal && (
                <CreateOrderModal 
                    onClose={closeCreateModal} 
                    onOrderCreated={handleOrderCreated}
                />
            )}
        </DashboardLayout>
    );
}
