import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '@/styles/dashboard/overview.module.css';
import { 
    FaCalendarAlt, FaClipboardList, FaPills, 
    FaNotesMedical, FaUserMd, FaPhoneAlt, FaFilePrescription 
} from 'react-icons/fa';
import { Session } from 'next-auth';
import { getPatientPrescriptions } from '@/services/prescriptionService';
import { getPatientOrders } from '@/services/orderService';
import { getPatientNotifications } from '@/services/notificationService';
import { useToast } from '@/components/ui/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner';

interface PatientDashboardProps {
    session: Session;
}

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

const PatientDashboard: React.FC<PatientDashboardProps> = ({ session }) => {
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState<boolean>(true);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [orders, setOrders] = useState<OrderWithItems[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPatientData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                // Check if we have a valid user ID in the session
                if (!session?.user?.id) {
                    toast({
                        title: "Authentication required",
                        description: "Please sign in to view your dashboard.",
                        variant: "destructive",
                    });
                    router.push('/signin');
                    return;
                }

                const userId = session.user.id;
                console.log('Fetching data for user ID:', userId);
                
                // Fetch prescriptions with medications
                const prescriptionsResponse = await getPatientPrescriptions(userId);
                if (prescriptionsResponse.success && prescriptionsResponse.data) {
                    setPrescriptions(prescriptionsResponse.data);
                } else {
                    if (prescriptionsResponse.error?.type === 'UNAUTHORIZED') {
                        toast({
                            title: "Session expired",
                            description: "Please sign in again to view your dashboard.",
                            variant: "destructive",
                        });
                        router.push('/signin');
                        return;
                    } else {
                        toast({
                            title: "Error",
                            description: prescriptionsResponse.error?.message || "Failed to load prescriptions data.",
                            variant: "destructive",
                        });
                    }
                    setPrescriptions([]);
                }
                
                // Fetch orders with items
                const ordersData = await getPatientOrders(userId);
                setOrders(ordersData);
                
                // Fetch notifications
                const notificationsData = await getPatientNotifications(userId);
                setNotifications(notificationsData);
                
            } catch (error) {
                console.log('Error fetching patient data:', error);
                toast({
                    title: "Error",
                    description: "Failed to load dashboard data. Please try again later.",
                    variant: "destructive",
                });
                setError('Failed to load dashboard data. Please try again later.');
                setPrescriptions([]);
                setOrders([]);
                setNotifications([]);
            } finally {
                setLoading(false);
            }
        };
        
        fetchPatientData();
    }, [session, toast, router]);
    
    // Get active prescriptions (status === 'active')
    const activePrescriptions = prescriptions.filter(p => p.status === 'active');
    
    // Get all medications from active prescriptions
    const activeMedications = activePrescriptions.flatMap(p => p.items);
    
    // Get pending orders
    const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing');
    
    // Get unread notifications count
    const unreadNotifications = notifications.filter(n => !n.isRead).length;

    // Navigate handlers
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
        <>
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
            </section>
            
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
                                        <span className={`${styles.badge} ${styles.badgeActive}`}>Active</span>
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
        </>
    );
};

export default PatientDashboard;
