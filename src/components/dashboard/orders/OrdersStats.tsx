import React from 'react';
import styles from '@/styles/dashboard/orders/orders.module.css';
import { 
    ShoppingCart, Clock, PackageCheck, PackageX, TruckIcon, CheckCircle
} from 'lucide-react';

interface OrdersStatsProps {
    stats: {
        total: number;
        pending: number;
        processing: number;
        shipped: number;
        delivered: number;
        cancelled: number;
        revenue: number;
    };
    isPharmacy?: boolean;
}

const OrdersStats: React.FC<OrdersStatsProps> = ({ stats, isPharmacy = false }) => {
    return (
        <div className={styles.statsContainer}>
            <div className={styles.statCard}>
                <div className={styles.statIcon}>
                    <ShoppingCart />
                </div>
                <div className={styles.statInfo}>
                    <h3>Total Orders</h3>
                    <p>{stats.total}</p>
                </div>
            </div>
            
            <div className={styles.statCard}>
                <div className={styles.statIcon}>
                    <Clock />
                </div>
                <div className={styles.statInfo}>
                    <h3>Pending</h3>
                    <p>{stats.pending}</p>
                </div>
            </div>
            
            <div className={styles.statCard}>
                <div className={styles.statIcon}>
                    <PackageCheck />
                </div>
                <div className={styles.statInfo}>
                    <h3>Processing</h3>
                    <p>{stats.processing}</p>
                </div>
            </div>
            
            <div className={styles.statCard}>
                <div className={styles.statIcon}>
                    <TruckIcon />
                </div>
                <div className={styles.statInfo}>
                    <h3>Shipped</h3>
                    <p>{stats.shipped}</p>
                </div>
            </div>
            
            <div className={styles.statCard}>
                <div className={styles.statIcon}>
                    <CheckCircle />
                </div>
                <div className={styles.statInfo}>
                    <h3>Delivered</h3>
                    <p>{stats.delivered}</p>
                </div>
            </div>
            
            <div className={styles.statCard}>
                <div className={styles.statIcon}>
                    <PackageX />
                </div>
                <div className={styles.statInfo}>
                    <h3>Cancelled</h3>
                    <p>{stats.cancelled}</p>
                </div>
            </div>
            
            {isPharmacy && (
                <div className={`${styles.statCard} ${styles.revenueCard}`}>
                    <div className={styles.statIcon}>
                        <span className={styles.currencySymbol}>KES</span>
                    </div>
                    <div className={styles.statInfo}>
                        <h3>Revenue</h3>
                        <p>{stats.revenue.toFixed(2)}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrdersStats;
