"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";

interface CollapsibleProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

const Collapsible = ({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  className,
  ...props
}: CollapsibleProps & React.HTMLAttributes<HTMLDivElement>) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  
  const isOpen = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen;
  
  return (
    <div className={cn("collapsible", className)} {...props}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === CollapsibleTrigger) {
          return React.cloneElement(child as React.ReactElement<any>, {
            isOpen,
            onClick: () => {
              const newState = !isOpen;
              setUncontrolledOpen(newState);
              onOpenChange?.(newState);
            },
          });
        }
        
        if (React.isValidElement(child) && child.type === CollapsibleContent) {
          return React.cloneElement(child as React.ReactElement<any>, {
            isOpen,
          });
        }
        
        return child;
      })}
    </div>
  );
};

interface CollapsibleTriggerProps {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
  onClick?: () => void;
}

const CollapsibleTrigger = ({
  children,
  className,
  isOpen,
  onClick,
  ...props
}: CollapsibleTriggerProps & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <button
      type="button"
      className={cn("collapsible-trigger", className)}
      onClick={onClick}
      aria-expanded={isOpen}
      {...props}
    >
      {children}
    </button>
  );
};

interface CollapsibleContentProps {
  children: React.ReactNode;
  className?: string;
  isOpen?: boolean;
}

const CollapsibleContent = ({
  children,
  className,
  isOpen,
  ...props
}: CollapsibleContentProps & React.HTMLAttributes<HTMLDivElement>) => {
  return isOpen ? (
    <div
      className={cn(
        "collapsible-content",
        {
          "collapsible-content-open": isOpen,
          "collapsible-content-closed": !isOpen,
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  ) : null;
};

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
