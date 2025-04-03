"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import "./select.css";

interface SelectProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  placeholder?: string;
}

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  position?: "popper" | "item-aligned";
  align?: "center" | "start" | "end";
}

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
  disabled?: boolean;
  children: React.ReactNode;
}

const SelectContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  value: string | undefined;
  onValueChange: ((value: string) => void) | undefined;
  disabled: boolean;
  triggerRef: React.RefObject<HTMLButtonElement>;
}>({
  open: false,
  setOpen: () => {},
  value: undefined,
  onValueChange: undefined,
  disabled: false,
  triggerRef: { current: null }
});

const Select: React.FC<SelectProps> = ({ 
  children, 
  defaultValue, 
  value, 
  onValueChange,
  disabled = false,
  ...props 
}) => {
  const [open, setOpen] = React.useState(false);
  const [internalValue, setInternalValue] = React.useState(defaultValue || "");
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  
  const actualValue = value !== undefined ? value : internalValue;
  
  const handleValueChange = React.useCallback((value: string) => {
    if (onValueChange) {
      onValueChange(value);
    } else {
      setInternalValue(value);
    }
  }, [onValueChange]);

  // Handle outside clicks to close the dropdown
  React.useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (open && triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [open]);

  // Update trigger width for popover positioning
  React.useEffect(() => {
    if (open && triggerRef.current) {
      const width = triggerRef.current.getBoundingClientRect().width;
      document.documentElement.style.setProperty('--select-trigger-width', `${width}px`);
    }
  }, [open]);

  return (
    <SelectContext.Provider value={{ 
      open, 
      setOpen, 
      value: actualValue, 
      onValueChange: handleValueChange,
      disabled,
      triggerRef
    }}>
      <div className="select-root" {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
};

const SelectTrigger: React.FC<SelectTriggerProps> = ({ className, children, ...props }) => {
  const { open, setOpen, disabled, triggerRef } = React.useContext(SelectContext);
  
  return (
    <button
      type="button"
      ref={triggerRef}
      onClick={() => !disabled && setOpen(!open)}
      className={cn("select-trigger", disabled && "disabled", className)}
      aria-expanded={open}
      disabled={disabled}
      {...props}
    >
      {children}
      <ChevronDown className={cn("select-icon", open && "rotate-180")} />
    </button>
  );
};

const SelectValue: React.FC<SelectValueProps> = ({ className, placeholder, ...props }) => {
  const { value } = React.useContext(SelectContext);
  const [displayValue, setDisplayValue] = React.useState<string | null>(null);
  
  // Find the actual display value from items
  React.useEffect(() => {
    const findDisplayValue = () => {
      if (!value) return null;
      
      // Find in document the select item with this value
      const selectItem = document.querySelector(`[data-select-value="${value}"]`);
      if (selectItem) {
        return selectItem.textContent;
      }
      return value;
    };
    
    setDisplayValue(findDisplayValue());
    
  }, [value]);
  
  return (
    <span className={cn("select-value", !value && "placeholder", className)} {...props}>
      {displayValue || placeholder || "Select an option"}
    </span>
  );
};

const SelectContent: React.FC<SelectContentProps> = ({ 
  className, 
  children,
  position = "popper",
  align = "center",
  ...props 
}) => {
  const { open } = React.useContext(SelectContext);
  
  if (!open) return null;
  
  return (
    <div 
      className={cn("select-content", `position-${position}`, `align-${align}`, className)} 
      {...props}
    >
      <div className="select-viewport">
        {children}
      </div>
    </div>
  );
};

const SelectItem: React.FC<SelectItemProps> = ({ 
  className, 
  value,
  disabled = false,
  children,
  ...props 
}) => {
  const { onValueChange, setOpen } = React.useContext(SelectContext);
  
  const handleSelect = () => {
    if (disabled) return;
    
    if (onValueChange) {
      onValueChange(value);
    }
    setOpen(false);
  };
  
  return (
    <div
      className={cn(
        "select-item", 
        disabled && "disabled",
        className
      )}
      onClick={handleSelect}
      data-select-value={value}
      role="option"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      {...props}
    >
      {children}
    </div>
  );
};

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
};
