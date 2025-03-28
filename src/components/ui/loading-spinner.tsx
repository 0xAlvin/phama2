import { Loader2 } from "lucide-react";
import '../../styles/components.css';

interface LoadingSpinnerProps {
  size?: "sm" | "default" | "lg";
  className?: string;
}

export default function LoadingSpinner({ size = "default", className }: LoadingSpinnerProps) {
  const sizeStyles = {
    sm: { height: '16px', width: '16px' },
    default: { height: '32px', width: '32px' },
    lg: { height: '48px', width: '48px' },
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
      <Loader2 
        className={`animate-spin ${className || ''}`} 
        style={{ 
          color: '#0070f3',
          ...sizeStyles[size],
          animation: 'spin 1s linear infinite'
        }} 
      />
    </div>
  );
}
