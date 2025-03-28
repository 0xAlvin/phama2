import React from 'react';
import styles from './dashstyles/dashboardLayout.module.css';

interface NavDividerProps {
    title: string;
}

const NavDivider: React.FC<NavDividerProps> = ({ title }) => {
    return (
        <div className={styles.navDivider}>
            <span className={styles.dividerTitle}>{title}</span>
        </div>
    );
};

export default NavDivider;
