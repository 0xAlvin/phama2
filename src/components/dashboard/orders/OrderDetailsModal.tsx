import React, { useState, useEffect } from 'react';
import styles from '@/styles/dashboard/orders/orderDetailsModal.module.css';
import { Loader2, X, CheckCircle, Receipt, CalendarClock, FileText } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface OrderDetails {
  id: string;
  patientName?: string;
  pharmacyName: string;
  totalAmount: number;
  status: string;
  statusClass?: string;
  createdAt: string;
  formattedDate?: string;
  updatedAt?: string;
  medications: OrderItem[];
  prescriptionId?: string;
}

interface OrderDetailsModalProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  isPharmacy?: boolean;
}

const OrderDetailsModal: React.FC<OrderDetailsModalProps> = ({
  orderId,
  isOpen,
  onClose,
  isPharmacy = false
}) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch order details: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.success || !data.order) {
        throw new Error(data.error || 'Failed to fetch order details');
      }

      setOrderDetails(data.order);
    } catch (err) {
      console.error('Error fetching order details:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        title: 'Error',
        description: 'Failed to load order details',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'pending') return '#f59e0b';
    if (statusLower === 'processing') return '#3b82f6';
    if (statusLower === 'shipped') return '#06b6d4';
    if (statusLower === 'delivered' || statusLower === 'completed') return '#10b981';
    if (statusLower === 'cancelled') return '#ef4444';
    return '#6b7280';
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Order Details</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          {isLoading ? (
            <div className={styles.loadingState}>
              <Loader2 className={styles.spinner} size={36} />
              <p>Loading order details...</p>
            </div>
          ) : error ? (
            <div className={styles.errorState}>
              <p className={styles.errorMessage}>{error}</p>
              <button 
                className={styles.retryButton}
                onClick={fetchOrderDetails}
              >
                Retry
              </button>
            </div>
          ) : orderDetails ? (
            <>
              <div className={styles.orderHeader}>
                <div className={styles.orderInfo}>
                  <h3>Order #{orderDetails.id.substring(0, 8)}</h3>
                  <div 
                    className={styles.orderStatus}
                    style={{ backgroundColor: `${getStatusColor(orderDetails.status)}20`, color: getStatusColor(orderDetails.status) }}
                  >
                    {orderDetails.status}
                  </div>
                </div>
                <div className={styles.orderMeta}>
                  <div className={styles.metaItem}>
                    <CalendarClock size={18} />
                    <span>{orderDetails.formattedDate || new Date(orderDetails.createdAt).toLocaleDateString()}</span>
                  </div>
                  {orderDetails.prescriptionId && (
                    <div className={styles.metaItem}>
                      <FileText size={18} />
                      <span>Has Prescription</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Details</h4>
                <div className={styles.detailsGrid}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>
                      {isPharmacy ? 'Patient' : 'Pharmacy'}
                    </span>
                    <span className={styles.detailValue}>
                      {isPharmacy ? orderDetails.patientName : orderDetails.pharmacyName}
                    </span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Order ID</span>
                    <span className={styles.detailValue}>
                      {orderDetails.id}
                    </span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Date</span>
                    <span className={styles.detailValue}>
                      {orderDetails.formattedDate || new Date(orderDetails.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Status</span>
                    <span className={styles.detailValue}>
                      {orderDetails.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className={styles.section}>
                <h4 className={styles.sectionTitle}>Medications</h4>
                <div className={styles.medicationsList}>
                  {orderDetails.medications.map((medication, index) => (
                    <div key={index} className={styles.medicationItem}>
                      <div className={styles.medicationInfo}>
                        <span className={styles.medicationName}>{medication.name}</span>
                        <span className={styles.medicationQuantity}>Qty: {medication.quantity}</span>
                      </div>
                      <div className={styles.medicationPrice}>
                        KES {medication.price.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className={styles.orderSummary}>
                <div className={styles.summaryItem}>
                  <span>Subtotal</span>
                  <span>KES {orderDetails.totalAmount.toFixed(2)}</span>
                </div>
                <div className={styles.summaryTotal}>
                  <span>Total</span>
                  <span>KES {orderDetails.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <p>No order details found</p>
            </div>
          )}
        </div>
        
        <div className={styles.modalFooter}>
          <button className={styles.closeBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
