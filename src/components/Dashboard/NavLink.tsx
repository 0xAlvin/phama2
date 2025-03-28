'use client'
import React, { ReactElement } from 'react';
import Link from 'next/link';
import styles from './dashstyles/dashboardLayout.module.css';
import { usePathname } from 'next/navigation';

interface NavLinkProps {
    href: string;
    title: string;
    icon: ReactElement<{ className?: string }>;
    iconSecondary?: ReactElement<{ className?: string }>;
    onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ href, title, icon, iconSecondary, onClick }) => {
    const pathname = usePathname();
    const isActive = pathname === href;
    
    return (
        <li>
            <Link 
                href={href} 
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                onClick={onClick}
            >
                {React.cloneElement(icon, { className: styles.navIcon })}
                <span>{title}</span>
                {iconSecondary && React.cloneElement(iconSecondary, { className: styles.navIconSecondary })}
            </Link>
        </li>
    );
};

export default NavLink;
