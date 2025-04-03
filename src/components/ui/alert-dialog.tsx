"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import "./alert-dialog.css"

interface AlertDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface AlertDialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface AlertDialogHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface AlertDialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface AlertDialogTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

interface AlertDialogDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

interface AlertDialogActionProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

interface AlertDialogCancelProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick?: () => void;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  open,
  onOpenChange,
  children
}) => {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);
  
  if (!open) return null;
  
  return (
    <div className="alert-dialog-root">
      {children}
    </div>
  );
};

const AlertDialogContent: React.FC<AlertDialogContentProps> = ({ 
  className,
  children,
  ...props
}) => {
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Find and click the cancel button if it exists
        const cancelBtn = document.querySelector('.alert-dialog-cancel') as HTMLButtonElement;
        if (cancelBtn) cancelBtn.click();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);
  
  return (
    <React.Fragment>
      <div className="alert-dialog-overlay" />
      <div className={cn("alert-dialog-content", className)} {...props}>
        {children}
      </div>
    </React.Fragment>
  );
};

const AlertDialogHeader: React.FC<AlertDialogHeaderProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn("alert-dialog-header", className)} {...props}>
      {children}
    </div>
  );
};

const AlertDialogFooter: React.FC<AlertDialogFooterProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div className={cn("alert-dialog-footer", className)} {...props}>
      {children}
    </div>
  );
};

const AlertDialogTitle: React.FC<AlertDialogTitleProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <h2 className={cn("alert-dialog-title", className)} {...props}>
      {children}
    </h2>
  );
};

const AlertDialogDescription: React.FC<AlertDialogDescriptionProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <p className={cn("alert-dialog-description", className)} {...props}>
      {children}
    </p>
  );
};

const AlertDialogAction: React.FC<AlertDialogActionProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <Button 
      className={cn("alert-dialog-action", className)}
      {...props}
    >
      {children}
    </Button>
  );
};

const AlertDialogCancel: React.FC<AlertDialogCancelProps> = ({
  className,
  children,
  onClick,
  ...props
}) => {
  return (
    <Button
      variant="outline"
      className={cn("alert-dialog-cancel", className)}
      onClick={onClick}
      {...props}
    >
      {children}
    </Button>
  );
};

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
};
