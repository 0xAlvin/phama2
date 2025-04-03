"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Create a context to manage popover state
const PopoverContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  open: false,
  setOpen: () => {},
});

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const Popover: React.FC<PopoverProps> = ({
  children,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
}) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  
  const isControlled = controlledOpen !== undefined;
  const openState = isControlled ? controlledOpen : uncontrolledOpen;

  const handleOpenChange = React.useCallback((newOpen: boolean) => {
    if (!isControlled) {
      setUncontrolledOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  }, [isControlled, onOpenChange]);

  // Create ref for detecting outside clicks
  const popoverRef = React.useRef<HTMLDivElement>(null);

  // Handle clicks outside of popover
  React.useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node) && openState) {
        handleOpenChange(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [openState, handleOpenChange]);

  return (
    <PopoverContext.Provider value={{ open: openState, setOpen: handleOpenChange }}>
      <div className="popover-container" ref={popoverRef}>
        {children}
      </div>
    </PopoverContext.Provider>
  );
};

interface PopoverTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

const PopoverTrigger: React.FC<PopoverTriggerProps> = ({
  children,
  asChild = false,
  className,
  ...props
}) => {
  const { open, setOpen } = React.useContext(PopoverContext);
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setOpen(!open);
  };

  if (asChild) {
    // Clone the child element and add our click handler
    const child = React.Children.only(children) as React.ReactElement;
    return React.cloneElement(child, {
      ...props,
      onClick: handleClick,
      "aria-expanded": open,
      className: cn(child.props.className, className),
    });
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn("popover-trigger", className)}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setOpen(!open);
        }
      }}
      aria-expanded={open}
      {...props}
    >
      {children}
    </div>
  );
};

interface PopoverContentProps {
  children: React.ReactNode;
  className?: string;
  align?: "center" | "start" | "end";
  sideOffset?: number;
}

const PopoverContent: React.FC<PopoverContentProps> = ({
  children,
  className,
  align = "center",
  sideOffset = 4,
  ...props
}) => {
  const { open } = React.useContext(PopoverContext);

  if (!open) return null;

  return (
    <div
      className={cn(
        "popover-content",
        `align-${align}`,
        className
      )}
      style={{ '--side-offset': `${sideOffset}px` } as React.CSSProperties}
      {...props}
    >
      {children}
    </div>
  );
};

// Add some default styling to make the popover work
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .popover-container {
      position: relative;
      display: inline-block;
    }
    
    .popover-trigger {
      cursor: pointer;
    }
    
    .popover-content {
      position: absolute;
      z-index: 50;
      min-width: 220px;
      background-color: white;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 0.375rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      animation: popoverAnimation 0.2s ease-out;
      top: calc(100% + var(--side-offset, 4px));
    }
    
    .popover-content.align-start {
      left: 0;
    }
    
    .popover-content.align-center {
      left: 50%;
      transform: translateX(-50%);
    }
    
    .popover-content.align-end {
      right: 0;
    }
    
    @keyframes popoverAnimation {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(-5px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
  `;
  document.head.appendChild(style);
}

export { Popover, PopoverTrigger, PopoverContent };
