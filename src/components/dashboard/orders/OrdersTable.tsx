import React, { useState } from 'react';
import styles from '@/styles/dashboard/orders/orders.module.css';
import { OrderType } from '@/types/orders';
import { formatDistanceToNow } from 'date-fns';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import OrderDetailsModal from './OrderDetailsModal';

interface OrdersTableProps {
    orders: OrderType[];
    isPharmacy?: boolean;
    isPatient?: boolean;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, isPharmacy = false, isPatient = false }) => {
    const [processingOrders, setProcessingOrders] = useState<Record<string, boolean>>({});
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    // Format date to relative time (e.g., "2 days ago")
    const formatDate = (dateString: string) => {
        try {
            const date = new Date(dateString);
            return formatDistanceToNow(date, { addSuffix: true });
        } catch (error) {
            return dateString;
        }
    };
    
    const getStatusClass = (status: string) => {
        const statusLower = status.toLowerCase();
        if (statusLower === 'pending') return styles.statusPending;
        if (statusLower === 'processing') return styles.statusProcessing;
        if (statusLower === 'shipped') return styles.statusShipped;
        if (statusLower === 'delivered' || statusLower === 'completed') return styles.statusDelivered;
        if (statusLower === 'cancelled') return styles.statusCancelled;
        return '';
    };
    
    const handleUpdateStatus = async (orderId: string, newStatus: string) => {
        // Set the order as processing
        setProcessingOrders(prev => ({ ...prev, [orderId]: true }));
        
        try {
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status: newStatus }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update order status');
            }
            
            toast({
                title: "Success",
                description: `Order status updated to ${newStatus}`,
                variant: "default"
            });
            
            // Refresh the page after a short delay
            setTimeout(() => {
                window.location.reload();
            }, 1500);
        } catch (error) {
            console.error('Error updating order status:', error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update order status. Please try again.",
                variant: "destructive"
            });
            // Clear processing state on error
            setProcessingOrders(prev => ({ ...prev, [orderId]: false }));
        }
    };

    const handleViewOrder = (orderId: string) => {
        setSelectedOrderId(orderId);
        setShowDetailsModal(true);
    };
    
    const handleCloseModal = () => {
        setShowDetailsModal(false);
        setSelectedOrderId(null);
    };
    
    return (
        <>
            <div className={styles.tableContainer}>
                {orders.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No orders found</p>
                    </div>
                ) : (
                    <table className={styles.ordersTable}>
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                {isPharmacy && <th>Patient</th>}
                                {isPatient && <th>Pharmacy</th>}
                                <th>Amount</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id}>
                                    <td className={styles.orderId}>
                                        <span onClick={() => handleViewOrder(order.id)} style={{ cursor: 'pointer', color: '#2563eb' }}>
                                            {order.id.substring(0, 8)}...
                                        </span>
                                    </td>
                                    
                                    {isPharmacy && (
                                        <td className={styles.patientName}>{order.patientName}</td>
                                    )}
                                    
                                    {isPatient && (
                                        <td className={styles.pharmacyName}>{order.pharmacyName}</td>
                                    )}
                                    
                                    <td className={styles.amount}>
                                        KES {order.totalAmount.toFixed(2)}
                                    </td>
                                    
                                    <td>
                                        <span className={`${styles.status} ${getStatusClass(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    
                                    <td className={styles.date}>
                                        {order.formattedDate || formatDate(order.createdAt)}
                                    </td>
                                    
                                    <td className={styles.actions}>
                                        <button 
                                            className={styles.button}
                                            onClick={() => handleViewOrder(order.id)}
                                        >
                                            View
                                        </button>
                                        
                                        {isPharmacy && order.isCompletable && !processingOrders[order.id] && (
                                            <button 
                                                className={`${styles.button} ${styles.completeButton}`}
                                                onClick={() => handleUpdateStatus(order.id, 'completed')}
                                            >
                                                Complete
                                            </button>
                                        )}
                                        
                                        {isPharmacy && order.status.toLowerCase() === 'pending' && !processingOrders[order.id] && (
                                            <button 
                                                className={`${styles.button} ${styles.processButton}`}
                                                onClick={() => handleUpdateStatus(order.id, 'processing')}
                                            >
                                                Process
                                            </button>
                                        )}
                                        
                                        {isPatient && order.isCancelable && !processingOrders[order.id] && (
                                            <button 
                                                className={`${styles.button} ${styles.cancelButton}`}
                                                onClick={() => handleUpdateStatus(order.id, 'cancelled')}
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        
                                        {processingOrders[order.id] && (
                                            <div className={styles.loadingButton}>
                                                <div className={styles.spinner}></div>
                                                Processing...
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
            
            {/* Order details modal */}
            {showDetailsModal && selectedOrderId && (
                <OrderDetailsModal 
                    orderId={selectedOrderId}
                    isOpen={showDetailsModal}
                    onClose={handleCloseModal}
                    isPharmacy={isPharmacy}
                />
            )}
        </>
    );
};

export default OrdersTable;
