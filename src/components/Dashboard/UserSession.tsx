import React from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import styles from './dashstyles/dashboardLayout.module.css';
import { useUserRole } from '@/lib/hooks/use-user-role';

// Props remain optional since we'll get data from the session if not provided
interface UserSessionProps {
    name?: string;
    email?: string;
    avatar?: string;
    profileUrl?: string;
}

const UserSession: React.FC<UserSessionProps> = ({ 
    name: propName, 
    email: propEmail, 
    avatar: propAvatar,
    profileUrl: propProfileUrl="/dashboard/profile" 
}) => {
    // Get session data for the current user
    const { data: session, status } = useSession();
    const { role, profileImage } = useUserRole();
    
    // Use props if provided, otherwise use session data
    const name = propName || session?.user?.name || 'User';
    const email = propEmail || session?.user?.email || 'No email';
    // Try all possible image sources in order of precedence
    const avatar =session?.user?.image || 
                  '';
    const profileUrl = propProfileUrl || session?.user?.profileUrl || '';
    
    // Show loading state when session is loading
    if (status === 'loading') {
        return (
            <div className={styles.userSession}>
                <div className={styles.userAvatar}>
                    <div className={styles.avatarPlaceholder}>...</div>
                </div>
                <div className={styles.userInfo}>
                    <div className={styles.userName}>Loading...</div>
                    <div className={styles.userEmail}>Please wait</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.userSession}>
            <div className={styles.userAvatar}>
                {avatar ? (
                    <Image src={avatar} alt={name} width={40} height={40} />
                ) : (
                    <div className={styles.avatarPlaceholder}>
                        {name.charAt(0).toUpperCase()}
                    </div>
                )}
            </div>
            <div className={styles.userInfo}>
                <div className={styles.userName}>
                    {name}
                    {role && <span className={styles.userRole}>{role.toLowerCase()}</span>}
                </div>
                <div className={styles.userEmail}>{email}</div>
            </div>
        </div>
    );
};

export default UserSession;
