import styles from './features.module.css';
import { FaBoxOpen } from 'react-icons/fa';
import { RiMedicineBottleFill } from 'react-icons/ri';
import { FaChartBar } from 'react-icons/fa';
import { FaUserMd } from 'react-icons/fa';

export default function FeaturesSection() {
    return (
        <section id="features" className={styles.features}>
            <h2 className={styles.featuresTitle}>Key Features</h2>
            <div className={styles.featureGrid}>
                <div className={styles.featureCard}>
                    <div className={styles.featureIconWrapper}>
                        <FaBoxOpen className={styles.featureIconSvg} />
                    </div>
                    <h3 className={styles.featureCardTitle}>Inventory Management</h3>
                    <p className={styles.featureCardDescription}>Track stock levels, expiry dates, and get automatic reorder alerts.</p>
                </div>

                <div className={styles.featureCard}>
                    <div className={styles.featureIconWrapper}>
                        <RiMedicineBottleFill className={styles.featureIconSvg} />
                    </div>
                    <h3 className={styles.featureCardTitle}>Prescription Handling</h3>
                    <p className={styles.featureCardDescription}>Process prescriptions efficiently with built-in verification checks.</p>
                </div>

                <div className={styles.featureCard}>
                    <div className={styles.featureIconWrapper}>
                        <FaChartBar className={styles.featureIconSvg} />
                    </div>
                    <h3 className={styles.featureCardTitle}>Business Analytics</h3>
                    <p className={styles.featureCardDescription}>Gain insights with comprehensive reports and performance metrics.</p>
                </div>

                <div className={styles.featureCard}>
                    <div className={styles.featureIconWrapper}>
                        <FaUserMd className={styles.featureIconSvg} />
                    </div>
                    <h3 className={styles.featureCardTitle}>Patient Records</h3>
                    <p className={styles.featureCardDescription}>Maintain secure patient profiles with medication history and allergies.</p>
                </div>
            </div>
        </section>
    );
}
