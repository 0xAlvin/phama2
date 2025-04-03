import React from 'react';
import { Loader2 } from 'lucide-react';
import './loading-spinner.css';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 24, 
  className = '' 
}) => {
  return (
    <Loader2 
      size={size} 
      className={`animate-spin ${className}`} 
    />
  );
};

export default LoadingSpinner;
