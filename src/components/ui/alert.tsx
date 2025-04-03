import React, { ReactNode } from 'react';
import '@/styles/alert.css';

interface AlertProps {
  variant?: 'default' | 'destructive' | 'warning' | 'success';
  className?: string;
  children: ReactNode;
}

export function Alert({ 
  variant = 'default', 
  className = '', 
  children 
}: AlertProps) {
  return (
    <div className={`alert-container ${variant} ${className}`}>
      {children}
    </div>
  );
}

interface AlertTitleProps {
  className?: string;
  children: ReactNode;
}

export function AlertTitle({ 
  className = '', 
  children 
}: AlertTitleProps) {
  return (
    <h5 className={`alert-title ${className}`}>
      {children}
    </h5>
  );
}

interface AlertDescriptionProps {
  className?: string;
  children: ReactNode;
}

export function AlertDescription({ 
  className = '', 
  children 
}: AlertDescriptionProps) {
  return (
    <div className={`alert-description ${className}`}>
      {children}
    </div>
  );
}
