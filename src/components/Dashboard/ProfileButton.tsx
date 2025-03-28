'use client'
import React, { useState } from 'react';
import styles from './dashstyles/dashboardLayout.module.css';
import Link from 'next/link';
import Image from 'next/image';
import { User, Settings, Bell, HelpCircle, ChevronDown } from 'lucide-react';
import ClientAuthButton from '@/components/auth/ClientAuthButton';
import { useSession } from 'next-auth/react';

interface ProfileButtonProps {
    name: string;
    avatar?: string;
}

const ProfileButton: React.FC<ProfileButtonProps> = ({ name, avatar }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { data: session } = useSession();

    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const handleDropdownClose = () => {
        setIsOpen(false);
    };

    return (
        <div className={styles.profileContainer}>
            <button 
                className={styles.profileButton} 
                onClick={toggleDropdown}
                aria-label="User menu"
            >
                <div className={styles.profileAvatar}>
                    {avatar ? (
                        <Image 
                            src={avatar} 
                            alt={name} 
                            width={32} 
                            height={32}
                            className={styles.avatarImage}
                        />
                    ) : (
                        <div className={styles.avatarPlaceholder}>
                            {name ? name.charAt(0) : 'U'}
                        </div>
                    )}
                </div>
                <span className={styles.profileName}>{name}</span>
                <ChevronDown size={16} className={styles.dropdownIcon} />
            </button>
            
            {isOpen && (
                <div className={styles.profileDropdown}>
                    <div className={styles.profileHeader}>
                        <div className={styles.profileInfo}>
                            <span className={styles.userName}>{session?.user.name}</span>
                            <span className={styles.profileRole}>{session?.user.role?.toUpperCase()} profile</span>
                        </div>
                    </div>
                    <div className={styles.profileMenu}>
                        <Link href="/dashboard/profile" className={styles.profileMenuItem}>
                            <User size={16} className={styles.menuItemIcon} />
                            My Profile
                        </Link>
                        <Link href="/dashboard/notifications" className={styles.profileMenuItem}>
                            <Bell size={16} className={styles.menuItemIcon} />
                            Notifications
                        </Link>
                        <Link href="/dashboard/settings" className={styles.profileMenuItem}>
                            <Settings size={16} className={styles.menuItemIcon} />
                            Settings
                        </Link>
                        <Link href="/help" className={styles.profileMenuItem}>
                            <HelpCircle size={16} className={styles.menuItemIcon} />
                            Help & Support
                        </Link>
                        <div className={styles.divider}></div>
                        <div className={`${styles.profileMenuItem} ${styles.logoutItem}`}>
                            <ClientAuthButton 
                                isAuthenticated={!!session}
                                onClick={handleDropdownClose}
                                className={styles.authButtonReset}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfileButton;
