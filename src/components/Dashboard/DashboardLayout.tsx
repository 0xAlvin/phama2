'use client'
import React, { useState, useEffect } from 'react';
import styles from './dashstyles/dashboardLayout.module.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import NavLink from './NavLink';
import NavDivider from './NavDivider';
import UserSession from './UserSession';
import SearchBar from './SearchBar';
import NotificationsButton from './NotificationsButton';
import { useUserRole } from '@/lib/hooks/use-user-role';
import ClientAuthButton from '@/components/auth/ClientAuthButton';
import { useSession } from 'next-auth/react';

import { 
    Home, 
    Users, 
    BarChart2, 
    Settings, 
    User, 
    LogOut, 
    Menu, 
    X,
    FileText,
    ShoppingCart,
    Package,
    MessageSquare,
    Pill,
    Clipboard,
    Store,
    ShoppingBag
} from 'lucide-react';
import ProfileButton from './ProfileButton';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children}) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const { isPharmacy, isPatient, role } = useUserRole();
    const { data: session } = useSession();
    
    // Control body overflow when sidebar is open on mobile
    useEffect(() => {
        if (isSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        
        return () => {
            document.body.style.overflow = '';
        };
    }, [isSidebarOpen]);
    
    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };
    
    const closeSidebar = () => {
        setIsSidebarOpen(false);
    };

    // Default avatar if none provided in session
    const defaultAvatar = '/avatar.jpg';

    return (
        <div className={styles.dashboardContainer}>
            <aside className={`${styles.sidebar} ${isSidebarOpen ? styles.open : ''}`}>
                <div className={styles.sidebarHeader}>
                    <Link href="/" className={styles.logo}>
                        Phama
                    </Link>
                    <button className={styles.closeButton} onClick={closeSidebar}>
                        <X className={styles.closeIcon} />
                    </button>
                </div>
                
                <UserSession 
                    name={session?.user?.name || "Guest User"}
                    email={session?.user?.email || "No email provided"}
                    avatar={session?.user?.image || defaultAvatar}
                />
                
                <nav className={styles.nav}>
                    <NavDivider title="Main" />
                    <ul>
                        {/* Common routes for both roles */}
                        
                        {/* Pharmacy-specific routes */}
                        {isPharmacy && (
                            <>
                                <NavLink 
                                    href="/dashboard/users" 
                                    title="Customers"
                                    icon={<Users size={18} />}
                                />
                                <NavLink 
                                    href="/dashboard/products" 
                                    title="Products"
                                    icon={<Package size={18} />}
                                />
                                <NavLink 
                                    href="/dashboard/orders" 
                                    title="Orders"
                                    icon={<ShoppingCart size={18} />}
                                />
                                <NavLink 
                                    href="/dashboard/prescriptions" 
                                    title="Prescriptions"
                                    icon={<Clipboard size={18} />}
                                />
                            </>
                        )}
                        
                        {/* Patient-specific routes */}
                        {isPatient && (
                            <>
                                <NavLink 
                                    href="/shop" 
                                    title="Shop"
                                    icon={<Store size={18} />}
                                />
                                <NavLink 
                                    href="/dashboard/orders" 
                                    title="My Orders"
                                    icon={<ShoppingBag size={18} />}
                                />
                                <NavLink 
                                    href="/dashboard/prescriptions" 
                                    title="My Prescriptions"
                                    icon={<Pill size={18} />}
                                />
                            </>
                        )}
                        
                        {/* Common for both roles */}
                    
                    </ul>
                    
                    {/* Analytics section - only visible to pharmacies */}
                    {isPharmacy && (
                        <>
                            <NavDivider title="Analytics" />
                            <ul>
                                <NavLink 
                                    href="/dashboard/reports" 
                                    title="Reports"
                                    icon={<FileText size={18} />}
                                />
                                <NavLink 
                                    href="/dashboard/stats" 
                                    title="Statistics"
                                    icon={<BarChart2 size={18} />}
                                />
                            </ul>
                        </>
                    )}
                    
                    <div className={styles.sidebarFooter}>
                        <NavDivider title="Account" />
                        <ul>
                            <NavLink 
                                href="/dashboard/settings" 
                                title="Settings"
                                icon={<Settings size={18} />}
                            />
                            <NavLink 
                                href="/dashboard/profile" 
                                title="Profile"
                                icon={<User size={18} />}
                            />
                            <li className={styles.navItem}>
                                <div className={styles.navLink}>
                                    <LogOut size={18} className={styles.navIcon} />
                                    <ClientAuthButton 
                                        isAuthenticated={!!session}
                                        onClick={closeSidebar}
                                        className={styles.logoutButton}
                                    />
                                </div>
                            </li>
                        </ul>
                    </div>
                </nav>
            </aside>
            
            <div className={styles.sidebarOverlay} onClick={closeSidebar}></div>

            <div className={styles.mainContent}>
                <header className={styles.header}>
                    <button className={styles.menuButton} onClick={toggleSidebar}>
                        <Menu className={styles.menuIcon} />
                    </button>
                    <div className={styles.headerActions}>
                        <SearchBar />
                        <NotificationsButton count={3} />
                        <ProfileButton
                            name={session?.user?.role || ""}
                        />
                    </div>
                </header>
                <main className={styles.main}>{children}</main>
            </div>
        </div>
    );
};

export default DashboardLayout;
