"use client"

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/dashboard/overview.module.css';
import { 
    FaCalendarAlt, FaClipboardList, FaPills, 
    FaNotesMedical, FaUserMd, FaPhoneAlt, FaFilePrescription 
} from 'react-icons/fa';
import { useSession } from 'next-auth/react';
import { usePrescriptionStore } from '@/store/prescriptionStore';
import { getPatientNotifications } from '@/services/notificationService';
import LoadingSpinner from '@/components/ui/loading-spinner';


interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    expiryDate?: string;
}

interface Prescription {
    id: string;
    doctorName: string;
    issueDate: string;
    expiryDate: string;
    status: string;
    items: Medication[];
}

interface OrderWithItems {
    id: string;
    pharmacyName: string;
    totalAmount: number;
    status: string;
    createdAt: string;
    medications: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
}

interface Notification {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
}

const PatientDashboard: React.FC = () => {
    const router = useRouter();
    const { data: session } = useSession();
    const { fetchPrescriptions } = usePrescriptionStore();
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
    const [activePrescriptions, setActivePrescriptions] = useState<Prescription[]>([]);
    const [activeMedications, setActiveMedications] = useState<Medication[]>([]);
    const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

    useEffect(() => {
        // Only fetch data if we have a session
        if (session?.user?.id) {
            fetchPatientData();
        }
    }, [session]);

    const fetchPatientData = async () => {
        if (!session?.user?.id) return;
        
        setLoading(true);
        setError(null);

        try {
            // Fetch prescriptions
            let prescriptionsData: Prescription[] = [];
            try {
                prescriptionsData = await fetchPrescriptions(session.user.id);
            } catch (prescriptionError) {
                console.error('Error fetching prescriptions:', prescriptionError);
                // Continue with other data fetches even if prescriptions fails
                setError(prescriptionError instanceof Error ? 
                    prescriptionError.message : 
                    'Failed to load prescriptions');
            }

            // Filter active prescriptions
            const active = prescriptionsData.filter(p => 
                p.status.toUpperCase() === 'ACTIVE' || p.status.toUpperCase() === 'PENDING');
            setActivePrescriptions(active);

            // Extract medications from prescriptions
            const medications: Medication[] = [];
            prescriptionsData.forEach(prescription => {
                if (prescription.items) {
                    prescription.items.forEach(item => {
                        medications.push({
                            id: item.id,
                            name: item.name,
                            dosage: item.dosage,
                            frequency: item.frequency,
                            duration: item.duration,
                            expiryDate: prescription.expiryDate
                        });
                    });
                }
            });
            setActiveMedications(medications);

            // Fetch notifications (and continue even if this fails)
            try {
                const notificationsResponse = await getPatientNotifications(session.user.id);
                const unreadCount = notificationsResponse.filter(n => !n.isRead).length;
                setUnreadNotifications(unreadCount);
            } catch (notificationError) {
                console.error('Error fetching notifications:', notificationError);
                // Don't set overall error for just notification issues
            }

            // More data fetches can go here...
            
        } catch (error) {
            console.error('Error fetching patient data:', error);
            setError(error instanceof Error ? error.message : 'Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (path: string) => {
        router.push(path);
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (!session?.user) {
        return (
            <div className="p-6 text-center">
                <div className="text-red-500 mb-4">Authentication required</div>
                <button 
                    onClick={() => router.push('/signin')}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Sign In
                </button>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <div className="text-red-500 mb-4">{error}</div>
                <button 
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <section className={styles.welcomeSection}>
            <div className={styles.welcomeBubbles}></div>
            <div className={styles.welcomeContent}>
                <h1 className={styles.welcomeHeading}>Welcome back, {session.user.name}</h1>
                <p className={styles.welcomeSubheading}>
                    Here's your health summary and upcoming activities
                </p>
                
                <div className={styles.quickStats}>
                    <div className={styles.statItem}>
                        <div className={styles.statLabel}>Prescriptions</div>
                        <div className={styles.statValue}>
                            {loading ? '...' : activePrescriptions.length}
                        </div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={styles.statLabel}>Medications</div>
                        <div className={styles.statValue}>
                            {loading ? '...' : activeMedications.length}
                        </div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={styles.statLabel}>Notifications</div>
                        <div className={styles.statValue}>
                            {loading ? '...' : unreadNotifications}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <FaFilePrescription /> Active Prescriptions
                        </h2>
                        <button 
                            onClick={() => handleNavigate('/dashboard/prescriptions')} 
                            className={styles.cardAction}
                        >
                            View All
                        </button>
                    </div>
                    
                    {loading ? (
                        <div className={styles.loadingState}>Loading prescriptions...</div>
                    ) : (
                        <div className={styles.prescriptionList}>
                            {activePrescriptions.length > 0 ? (
                                activePrescriptions.slice(0, 2).map(prescription => (
                                    <div key={prescription.id} className={styles.listItem}>
                                        <div className={styles.iconWrapper}>
                                            <FaFilePrescription />
                                        </div>
                                        <div className={styles.itemDetails}>
                                            <div className={styles.itemTitle}>
                                                Prescription by {prescription.doctorName || 'Unknown Doctor'}
                                            </div>
                                            <div className={styles.itemSubtitle}>
                                                Issued: {prescription.issueDate} • 
                                                {prescription.expiryDate ? ` Expires: ${prescription.expiryDate}` : ' No expiration date'}
                                            </div>
                                        </div>
                                        {/* Add status badge */}
                                        <span className={`${styles.badge} ${
                                            prescription.status.toUpperCase() === 'ACTIVE' ? styles.badgeActive : 
                                            prescription.status.toUpperCase() === 'PENDING' ? styles.badgeUpcoming :
                                            prescription.status.toUpperCase() === 'FILLED' ? styles.badgeCompleted :
                                            prescription.status.toUpperCase() === 'EXPIRED' ? styles.badgeExpired :
                                            styles.badgeDefault
                                        }`}>
                                            {prescription.status}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-4 text-gray-500">No active prescriptions</p>
                            )}
                            
                            {activePrescriptions.length > 2 && (
                                <p className="text-center text-sm text-blue-600 mt-2">
                                    +{activePrescriptions.length - 2} more prescriptions
                                </p>
                            )}
                        </div>
                    )}
                </div>
                
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <FaPills /> Current Medications
                        </h2>
                        <button 
                            onClick={() => handleNavigate('/dashboard/medications')} 
                            className={styles.cardAction}
                        >
                            View All
                        </button>
                    </div>
                    
                    {loading ? (
                        <div className={styles.loadingState}>Loading medications...</div>
                    ) : (
                        <div className={styles.medicationList}>
                            {activeMedications.length > 0 ? (
                                <>
                                    {activeMedications.slice(0, 2).map((medication, index) => (
                                        <div key={`${medication.id}-${index}`} className={styles.listItem}>
                                            <div className={styles.iconWrapper}>
                                                <FaPills />
                                            </div>
                                            <div className={styles.itemDetails}>
                                                <div className={styles.itemTitle}>
                                                    {medication.name} ({medication.dosage || 'No dosage specified'})
                                                </div>
                                                <div className={styles.itemSubtitle}>
                                                    {medication.frequency || 'No frequency specified'} • 
                                                    Duration: {medication.duration || 'Ongoing'}
                                                </div>
                                            </div>
                                            <span className={`${styles.badge} ${styles.badgeActive}`}>Active</span>
                                        </div>
                                    ))}
                                    
                                    {activeMedications.length > 2 && (
                                        <p className="text-center text-sm text-blue-600 mt-2">
                                            +{activeMedications.length - 2} more medications
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-center py-4 text-gray-500">No active medications</p>
                            )}
                        </div>
                    )}
                </div>
                
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>
                            <FaCalendarAlt /> Recent Orders
                        </h2>
                        <button 
                            onClick={() => handleNavigate('/dashboard/orders')} 
                            className={styles.cardAction}
                        >
                            View All
                        </button>
                    </div>
                    
                    {loading ? (
                        <div className={styles.loadingState}>Loading orders...</div>
                    ) : (
                        <div className={styles.orderList}>
                            {pendingOrders.length > 0 ? (
                                pendingOrders.slice(0, 2).map(order => (
                                    <div key={order.id} className={styles.listItem}>
                                        <div className={styles.iconWrapper}>
                                            <FaCalendarAlt />
                                        </div>
                                        <div className={styles.itemDetails}>
                                            <div className={styles.itemTitle}>
                                                Order from {order.pharmacyName || 'Unknown Pharmacy'}
                                            </div>
                                            <div className={styles.itemSubtitle}>
                                                ${order.totalAmount.toFixed(2)} • {new Date(order.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <span className={`${styles.badge} ${styles.badgePending}`}>{order.status}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center py-4 text-gray-500">No pending orders</p>
                            )}
                            
                            {pendingOrders.length > 2 && (
                                <p className="text-center text-sm text-blue-600 mt-2">
                                    +{pendingOrders.length - 2} more orders
                                </p>
                            )}
                        </div>
                    )}
                </div>
                
                <div className={styles.card}>
                    <div className={styles.cardHeader}>
                        <h2 className={styles.cardTitle}>Quick Actions</h2>
                    </div>
                    
                    <div className={styles.quickActions}>
                        <button className={styles.actionButton} onClick={() => handleNavigate('/dashboard/prescriptions/request')}>
                            <FaNotesMedical className={styles.actionIcon} />
                            <span className={styles.actionText}>Request Prescription</span>
                        </button>
                        <button className={styles.actionButton} onClick={() => handleNavigate('/dashboard/orders/new')}>
                            <FaClipboardList className={styles.actionIcon} />
                            <span className={styles.actionText}>Order Medication</span>
                        </button>
                        <button className={styles.actionButton} onClick={() => handleNavigate('/dashboard/support')}>
                            <FaPhoneAlt className={styles.actionIcon} />
                            <span className={styles.actionText}>Contact Support</span>
                        </button>
                        <button className={styles.actionButton} onClick={() => handleNavigate('/dashboard/pharmacies')}>
                            <FaUserMd className={styles.actionIcon} />
                            <span className={styles.actionText}>Find Pharmacy</span>
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

async function fetchOrders(userId: string) {
  try {
    const response = await fetch('/api/db-operations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        operation: 'getOrders',
        params: { userId },
      }),
    });
    
    const result = await response.json();
    if (result.success) {
      return result.data;
    } else {
      console.error('Error fetching orders:', result.error);
      return [];
    }
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return [];
  }
}

export default PatientDashboard;
