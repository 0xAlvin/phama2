import React from 'react';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import styles from '../dashboard.module.css';
import { Bell, CheckCheck, Eye, Filter, MoreVertical, Trash2, Clock, User, Package, MessageSquare, Settings } from 'lucide-react';

// Mock data for notifications
const notificationData = [
  {
    id: 1,
    title: 'New User Registration',
    description: 'Jane Smith has registered a new account.',
    time: '10 minutes ago',
    type: 'user',
    read: false
  },
  {
    id: 2,
    title: 'System Update Scheduled',
    description: 'The system will undergo maintenance tonight at 2:00 AM UTC.',
    time: '2 hours ago',
    type: 'system',
    read: true
  },
  {
    id: 3,
    title: 'New Order Received',
    description: 'Order #12345 has been placed and is awaiting processing.',
    time: '5 hours ago',
    type: 'order',
    read: false
  },
  {
    id: 4,
    title: 'Payment Confirmed',
    description: 'Payment for invoice #INV-2023-067 has been confirmed.',
    time: '1 day ago',
    type: 'payment',
    read: true
  },
  {
    id: 5,
    title: 'Stock Alert: Low Inventory',
    description: 'Product "Acetaminophen 500mg" is running low on stock (5 units remaining).',
    time: '1 day ago',
    type: 'inventory',
    read: true
  },
  {
    id: 6,
    title: 'New Message Received',
    description: 'You have a new message from Dr. Michael Johnson regarding prescription refills.',
    time: '2 days ago',
    type: 'message',
    read: false
  },
  {
    id: 7,
    title: 'Account Settings Updated',
    description: 'Your account password was changed successfully.',
    time: '3 days ago',
    type: 'settings',
    read: true
  }
];

const NotificationsPage = () => {
  // Function to render appropriate icon based on notification type
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'user':
        return <User size={18} />;
      case 'order':
        return <Package size={18} />;
      case 'message':
        return <MessageSquare size={18} />;
      case 'settings':
        return <Settings size={18} />;
      default:
        return <Bell size={18} />;
    }
  };
  
  return (
    <DashboardLayout>
      <div className={styles.notificationsPage}>
        <header className={styles.pageHeader}>
          <div className={styles.pageHeaderContent}>
            <h1>Notifications</h1>
            <p>View and manage your notifications</p>
          </div>
          <div className={styles.pageActions}>
            <button className={styles.actionButton} title="Mark all as read">
              <CheckCheck size={16} /> Mark all as read
            </button>
            <button className={styles.iconButton} title="Filter notifications">
              <Filter size={16} />
            </button>
          </div>
        </header>
        
        <div className={styles.notificationsContainer}>
          <div className={styles.notificationsHeader}>
            <div className={styles.notificationsTabs}>
              <button className={`${styles.tabButton} ${styles.activeTab}`}>All (7)</button>
              <button className={styles.tabButton}>Unread (3)</button>
              <button className={styles.tabButton}>Read (4)</button>
            </div>
          </div>
          
          <div className={styles.notificationsList}>
            {notificationData.map((notification) => (
              <div 
                key={notification.id} 
                className={`${styles.notificationCard} ${!notification.read ? styles.unread : ''}`}
              >
                <div className={styles.notificationIcon}>
                  <div className={`${styles.iconWrapper} ${styles[notification.type]}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                </div>
                <div className={styles.notificationContent}>
                  <h3>{notification.title}</h3>
                  <p>{notification.description}</p>
                  <div className={styles.notificationMeta}>
                    <span className={styles.notificationTime}>
                      <Clock size={14} />
                      {notification.time}
                    </span>
                    {!notification.read && (
                      <span className={styles.unreadIndicator}>Unread</span>
                    )}
                  </div>
                </div>
                <div className={styles.notificationActions}>
                  <button className={styles.iconButton} title="Mark as read">
                    <Eye size={16} />
                  </button>
                  <button className={styles.iconButton} title="Delete notification">
                    <Trash2 size={16} />
                  </button>
                  <button className={styles.iconButton} title="More options">
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className={styles.notificationsPagination}>
            <span className={styles.paginationInfo}>Showing 1-7 of 7 notifications</span>
            <div className={styles.paginationControls}>
              <button className={`${styles.paginationButton} ${styles.disabled}`} disabled>
                Previous
              </button>
              <button className={`${styles.paginationButton} ${styles.disabled}`} disabled>
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NotificationsPage;
