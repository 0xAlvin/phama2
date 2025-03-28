import React from 'react';
import styles from './LoadingSkeleton.module.css';

const LoadingSkeleton: React.FC = () => {
  return (
    <div className={styles.skeleton}>
      <div className={styles.image}></div>
      <div className={styles.content}>
        <div className={styles.title}></div>
        <div className={styles.details}>
          <div className={styles.dosage}></div>
          <div className={styles.price}></div>
        </div>
        <div className={styles.pharmacy}></div>
        <div className={styles.button}></div>
      </div>
    </div>
  );
};

export default LoadingSkeleton;
