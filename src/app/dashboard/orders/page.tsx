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
import { useUserRole } from '@/lib/hooks/use-user-role';

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
    const { isPatient, isPharmacy, role } = useUserRole();
    
    // Use correct role constants for consistent comparison
    const isPharmacyStaff = role === UserRoles.PHARMACY_STAFF;
    const isAdmin = role === UserRoles.ADMIN;
    const canManageOrders = isPharmacy || isPharmacyStaff || isAdmin;

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
                    console.log("Fetching patient orders...");
                    orderData = await fetchPatientOrders();
                    console.log("Patient orders received:", orderData);
                } else if (canManageOrders) {
                    console.log("Fetching pharmacy orders...");
                    orderData = await fetchPharmacyOrders();
                    console.log("Pharmacy orders received:", orderData);
                } else {
                    console.warn("User role doesn't have permission to fetch orders");
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
    }, [status, isPatient, canManageOrders, router, session]); // Added session dependency

    // Function to fetch orders for patients
    const fetchPatientOrders = async (): Promise<OrderType[]> => {
        try {
            console.log("Making API request to /api/patient/orders");
            const response = await fetch('/api/patient/orders', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Ensure cache isn't hiding new data
                cache: 'no-store',
            }).catch(error => {
                console.error("Network error during fetch:", error);
                throw new Error("Network connection issue: Unable to reach server");
            });
            
            if (!response) {
                console.error("No response received from fetch");
                throw new Error("No response from server");
            }
            
            console.log("Response status:", response.status, response.statusText);
            
            if (!response.ok) {
                console.warn(`Error fetching patient orders: ${response.statusText}`);
                if (response.status === 404) {
                    setError("No patient record found. Please complete your patient profile.");
                } else if (response.status === 401) {
                    setError("You're not authorized to view patient orders.");
                    router.push('/signin');
                } else {
                    // For other error codes
                    setError(`Server error: ${response.status} ${response.statusText}`);
                }
                return [];
            }
            
            const data = await response.json();
            console.log("Raw API response:", data);
            
            // Handle all possible response formats gracefully
            if (!data) {
                console.warn("Empty response from API");
                return [];
            }
            
            // If response indicates success but has no data, return empty array
            if (data.success === false || !data.data) {
                if (data.error && data.error.includes('patient record')) {
                    setError("No patient record found. Please contact support to set up your patient profile.");
                } else if (data.error) {
                    setError(data.error);
                }
                console.warn("API reported an error:", data.error || "Unknown error");
                return [];
            }
            
            // If data.data is empty, it's a valid response with no orders
            if (!Array.isArray(data.data) || data.data.length === 0) {
                console.log("Valid response but no orders found");
                return [];
            }
            
            // Process and structure the data
            const processedOrders = data.data.map((order: any) => ({
                id: order.id || `temp-${Date.now()}`,
                patientName: session?.user?.name || 'You',
                pharmacyName: order.pharmacy?.name || 'Unknown Pharmacy',
                totalAmount: order.totalAmount || 0,
                status: order.status || 'unknown',
                hasPrescription: !!order.prescriptionId,
                createdAt: order.createdAt || new Date().toISOString(),
                formattedDate: order.formattedDate || new Date(order.createdAt).toLocaleDateString(),
                isCompletable: order.isCompletable || false,
                isCancelable: order.isCancelable || false,
            }));
            
            console.log("Processed orders:", processedOrders);
            return processedOrders;
        } catch (error) {
            console.error('Error in fetchPatientOrders:', error);
            setError(`Failed to load orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return []; // Return empty array on error
        }
    };

    // Function to fetch orders for pharmacies - Fixed based on API response format
    const fetchPharmacyOrders = async (): Promise<OrderType[]> => {
        try {
            console.log("Making API request to /api/pharmacy/orders");
            const response = await fetch('/api/pharmacy/orders', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                // Ensure cache isn't hiding new data
                cache: 'no-store',
            }).catch(error => {
                console.error("Network error during fetch:", error);
                throw new Error("Network connection issue: Unable to reach server");
            });
            
            if (!response) {
                console.error("No response received from fetch");
                throw new Error("No response from server");
            }
            
            console.log("Response status:", response.status, response.statusText);
            
            if (!response.ok && response.status !== 200) {
                // Explicit check for HTTP errors that aren't 200
                console.warn(`Error fetching pharmacy orders: ${response.statusText}`);
                if (response.status === 404) {
                    setError("No pharmacy record found. Please contact support.");
                } else if (response.status === 401) {
                    setError("You're not authorized to view pharmacy orders.");
                    router.push('/signin');
                } else if (response.status === 501) {
                    setError("Admin view of orders is not yet implemented.");
                } else {
                    // For other error codes
                    setError(`Server error: ${response.status} ${response.statusText}`);
                }
                return [];
            }
            
            const data = await response.json();
            console.log("Raw Pharmacy API response:", data);
            
            // Handle explicit success: false in the response
            if (data.success === false) {
                const errorMsg = data.error || "Unknown error occurred";
                console.warn("API reported an error:", errorMsg);
                setError(errorMsg);
                return [];
            }
            
            // If no data or data is not an array, return empty array
            if (!data || !data.data || !Array.isArray(data.data)) {
                console.warn("Invalid or empty data structure in response");
                return [];
            }
            
            // Process and structure the data based on exact API response structure
            const processedOrders = data.data.map((order: any) => ({
                id: order.id || `temp-${Date.now()}`,
                patientId: order.patientId,
                patientName: order.patientName || 'Unknown Patient',
                pharmacyId: order.pharmacyId,
                pharmacyName: order.pharmacyName || 'Your Pharmacy',
                totalAmount: typeof order.totalAmount === 'number' ? order.totalAmount : 
                             parseFloat(order.totalAmount) || 0,
                status: order.status || 'unknown',
                hasPrescription: !!order.prescriptionId,
                createdAt: order.createdAt || new Date().toISOString(),
                formattedDate: order.formattedDate || 'Unknown date',
                // Only allow actions if user has appropriate role
                isCompletable: (isPharmacy || isPharmacyStaff || isAdmin) ? 
                              (order.isCompletable === true) : false,
                isCancelable: (isPharmacy || isPharmacyStaff || isAdmin) ? 
                            (order.isCancelable === true) : false,
                isDeliverable: (isPharmacy || isPharmacyStaff || isAdmin) ? 
                             (order.isDeliverable === true) : false,
                // Include order items if present
                items: Array.isArray(order.items) ? order.items.map((item: any) => ({
                    id: item.id,
                    medicationId: item.medicationId,
                    medicationName: item.medicationName || 'Unknown Medication',
                    quantity: item.quantity || 0,
                    price: typeof item.price === 'number' ? item.price : 
                           parseFloat(item.price) || 0
                })) : []
            }));
            
            console.log("Processed pharmacy orders:", processedOrders);
            return processedOrders;
        } catch (error) {
            console.error('Error in fetchPharmacyOrders:', error);
            setError(`Failed to load orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
            } else if (canManageOrders) {
                orderData = await fetchPharmacyOrders();
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

    const handleRetryFetch = async () => {
        setIsLoading(true);
        setError(null);
        try {
            let orderData: OrderType[] = [];
            if (isPatient) {
                orderData = await fetchPatientOrders();
            } else if (canManageOrders) {
                orderData = await fetchPharmacyOrders();
            }
            setOrders(orderData);
            setFilteredOrders(orderData);
        } catch (err) {
            console.error('Error retrying order fetch:', err);
            setError("Failed to load orders. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className={styles.ordersPage}>
                <h1 className={styles.pageTitle}>
                    {isPatient ? 'My Orders' : 
                     isPharmacy ? 'Pharmacy Orders' : 
                     isPharmacyStaff ? 'Orders Management' : 
                     'All Orders'}
                </h1>

                <OrdersStats stats={orderStats} isPharmacy={canManageOrders} />

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
                            {!error.includes("No patient record") && !error.includes("not authorized") ? (
                                <button
                                    className={styles.retryButton}
                                    onClick={handleRetryFetch}
                                >
                                    Retry
                                </button>
                            ) : error.includes("No patient record") ? (
                                <button
                                    className={styles.retryButton}
                                    onClick={() => router.push('/dashboard/profile')}
                                >
                                    Go to Profile
                                </button>
                            ) : null}
                        </div>
                    ) : filteredOrders.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>{canManageOrders ? 'No orders to display' : 'You have no orders yet'}</p>
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
                            isPharmacyStaff={isPharmacyStaff}
                            isAdmin={isAdmin}
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
