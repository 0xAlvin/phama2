import React from 'react';
import styles from '@/styles/dashboard/orders/orders.module.css';
import { Search, Plus } from 'lucide-react';

interface OrdersHeaderProps {
    onSearch: (term: string) => void;
    onStatusFilter: (status: string) => void;
    searchTerm: string;
    statusFilter: string;
    onCreateOrder?: () => void;
}

const OrdersHeader: React.FC<OrdersHeaderProps> = ({
    onSearch,
    onStatusFilter,
    searchTerm,
    statusFilter,
    onCreateOrder
}) => {
    return (
        <div className={styles.ordersHeader}>
            <div className={styles.searchContainer}>
                <div className={styles.searchInputWrapper}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search orders..."
                        className={styles.searchInput}
                        value={searchTerm}
                        onChange={(e) => onSearch(e.target.value)}
                    />
                </div>
            </div>
            
            <div className={styles.filterContainer}>
                <select
                    className={styles.filterSelect}
                    value={statusFilter}
                    onChange={(e) => onStatusFilter(e.target.value)}
                >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                </select>
            </div>
            
            {onCreateOrder && (
                <button 
                    className={styles.addOrderButton}
                    onClick={onCreateOrder}
                >
                    <Plus size={16} />
                    New Order
                </button>
            )}
        </div>
    );
};

export default OrdersHeader;
