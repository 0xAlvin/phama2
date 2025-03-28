'use client'
import React, { useState } from 'react';
import styles from './dashstyles/dashboardLayout.module.css';
import Link from 'next/link';
import { Bell, Check, Clock } from 'lucide-react';

interface NotificationsButtonProps {
    count?: number;
}

const NotificationsButton: React.FC<NotificationsButtonProps> = ({ count = 0 }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div className={styles.notificationsContainer}>
            <button 
                className={styles.notificationButton} 
                onClick={toggleDropdown}
                aria-label="Notifications"
            >
                <Bell size={20} className={styles.notificationIcon} />
                {count > 0 && <span className={styles.notificationBadge}>{count}</span>}
            </button>
            
            {isOpen && (
                <div className={styles.notificationDropdown}>
                    <div className={styles.notificationHeader}>
                        <h3>Notifications</h3>
                        <button className={styles.markAllReadButton}>
                            <Check size={16} style={{ marginRight: '4px' }} />
                            Mark all as read
                        </button>
                    </div>
                    
                    <div className={styles.notificationList}>
                        <div className={`${styles.notificationItem} ${styles.unread}`}>
                            <div className={styles.notificationContent}>
                                <h4>New User Registration</h4>
                                <p>Jane Smith has registered a new account</p>
                                <span className={styles.notificationTime}>
                                    <Clock size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                    2 minutes ago
                                </span>
                            </div>
                        </div>
                        <div className={styles.notificationItem}>
                            <div className={styles.notificationContent}>
                                <h4>System Update</h4>
                                <p>System will undergo maintenance tonight</p>
                                <span className={styles.notificationTime}>
                                    <Clock size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                    2 hours ago
                                </span>
                            </div>
                        </div>
                        <div className={`${styles.notificationItem} ${styles.unread}`}>
                            <div className={styles.notificationContent}>
                                <h4>New Order Received</h4>
                                <p>You have received a new order (#12345)</p>
                                <span className={styles.notificationTime}>
                                    <Clock size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                    5 hours ago
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className={styles.notificationFooter}>
                        <Link href="/dashboard/notifications" className={styles.viewAllLink}>
                            View All Notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationsButton;
