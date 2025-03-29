import React from 'react';
import styles from '@/styles/dashboard/overview.module.css';
import { 
    FaClipboardCheck, FaUsers, FaPills, FaBoxes, 
    FaFileInvoiceDollar, FaShippingFast, FaBell, FaChartLine 
} from 'react-icons/fa';
import { Session } from 'next-auth';

interface PharmacyDashboardProps {
    session: Session;
}

const PharmacyDashboard: React.FC<PharmacyDashboardProps> = ({ session }) => {
    // Sample pharmacy data
    const pendingPrescriptions = [
        {
            id: 1,
            patient: "John Smith",
            medication: "Amoxicillin 500mg",
            requestDate: "May 12, 2023",
            status: "Pending"
        },
        {
            id: 2,
            patient: "Emma Thompson",
            medication: "Lisinopril 10mg",
            requestDate: "May 13, 2023",
            status: "Processing"
        },
        {
            id: 3,
            patient: "Michael Wilson",
            medication: "Metformin 500mg",
            requestDate: "May 13, 2023",
            status: "Ready for Pickup"
        }
    ];
    
    const lowStockItems = [
        {
            id: 1,
            name: "Amoxicillin 500mg",
            currentStock: 15,
            reorderLevel: 20,
            supplier: "MedSupply Inc."
        },
        {
            id: 2,
            name: "Atorvastatin 20mg",
            currentStock: 8,
            reorderLevel: 15,
            supplier: "PharmaCorp"
        }
    ];

    // Analytics data
    const dailySalesAmount = 1243.75;
    const dailyOrders = 28;
    const activeCustomers = 125;
    const pendingRefills = 8;

    return (
        <>
            <section className={styles.welcomeSection}>
                <div className={styles.welcomeBubbles}></div>
                <div className={styles.welcomeContent}>
                    <h1 className={styles.welcomeHeading}>Welcome back, {session.user.name}</h1>
                    <p className={styles.welcomeSubheading}>
                        Here's your pharmacy dashboard summary
                    </p>
                    
                    <div className={styles.quickStats}>
                        <div className={styles.statItem}>
                            <div className={styles.statLabel}>Today's Sales</div>
                            <div className={styles.statValue}>${dailySalesAmount}</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statLabel}>Today's Orders</div>
                            <div className={styles.statValue}>{dailyOrders}</div>
                        </div>
                        <div className={styles.statItem}>
                            <div className={styles.statLabel}>Active Customers</div>
                            <div className={styles.statValue}>{activeCustomers}</div>
                        </div>
                    </div>
                </div>
            </section>
            
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <FaClipboardCheck /> Prescription Requests
                        </h2>
                        <a href="/dashboard/prescriptions" className={styles.cardAction}>View All</a>
                    </div>
                    
                    <div className={styles.appointmentList}>
                        {pendingPrescriptions.map(prescription => (
                            <div key={prescription.id} className={styles.listItem}>
                                <div className={styles.iconWrapper}>
                                    <FaPills />
                                </div>
                                <div className={styles.itemDetails}>
                                    <div className={styles.itemTitle}>
                                        {prescription.medication}
                                    </div>
                                    <div className={styles.itemSubtitle}>
                                        {prescription.patient} • Requested on {prescription.requestDate}
                                    </div>
                                </div>
                                <span className={`${styles.badge} ${
                                    prescription.status === "Pending" ? styles.badgeUpcoming : 
                                    prescription.status === "Ready for Pickup" ? styles.badgeActive : 
                                    styles.badgeUpcoming
                                }`}>
                                    {prescription.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <FaBoxes /> Inventory Alerts
                        </h2>
                        <a href="/dashboard/inventory" className={styles.cardAction}>Manage Inventory</a>
                    </div>
                    
                    <div className={styles.medicationList}>
                        {lowStockItems.map(item => (
                            <div key={item.id} className={styles.listItem}>
                                <div className={styles.iconWrapper}>
                                    <FaBell />
                                </div>
                                <div className={styles.itemDetails}>
                                    <div className={styles.itemTitle}>
                                        {item.name}
                                    </div>
                                    <div className={styles.itemSubtitle}>
                                        Current Stock: {item.currentStock} • Reorder Level: {item.reorderLevel}
                                    </div>
                                </div>
                                <span className={`${styles.badge} ${styles.badgeUpcoming}`}>
                                    Low Stock
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <FaChartLine /> Performance Summary
                        </h2>
                        <a href="/dashboard/analytics" className={styles.cardAction}>View Analytics</a>
                    </div>
                    
                    <div className={styles.metricsGrid}>
                        <div className={styles.metricItem}>
                            <div className={styles.metricValue}>${dailySalesAmount}</div>
                            <div className={styles.metricLabel}>Today's Sales</div>
                        </div>
                        <div className={styles.metricItem}>
                            <div className={styles.metricValue}>{dailyOrders}</div>
                            <div className={styles.metricLabel}>Today's Orders</div>
                        </div>
                        <div className={styles.metricItem}>
                            <div className={styles.metricValue}>{pendingRefills}</div>
                            <div className={styles.metricLabel}>Pending Refills</div>
                        </div>
                        <div className={styles.metricItem}>
                            <div className={styles.metricValue}>24</div>
                            <div className={styles.metricLabel}>New Customers</div>
                        </div>
                    </div>
                </div>
                
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Quick Actions</h2>
                    </div>
                    
                    <div className={styles.quickActions}>
                        <button className={styles.actionButton}>
                            <FaPills className={styles.actionIcon} />
                            <span className={styles.actionText}>Process Prescriptions</span>
                        </button>
                        <button className={styles.actionButton}>
                            <FaUsers className={styles.actionIcon} />
                            <span className={styles.actionText}>Manage Customers</span>
                        </button>
                        <button className={styles.actionButton}>
                            <FaFileInvoiceDollar className={styles.actionIcon} />
                            <span className={styles.actionText}>Billing & Invoices</span>
                        </button>
                        <button className={styles.actionButton}>
                            <FaShippingFast className={styles.actionIcon} />
                            <span className={styles.actionText}>Delivery Status</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PharmacyDashboard;
