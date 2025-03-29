import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleOpen = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (value: string) => {
    onValueChange(value);
    setIsOpen(false);
  };

  return (
    <div 
      className={`custom-select ${className}`} 
      ref={selectRef}
    >
      <div 
        className={`custom-select-trigger ${disabled ? 'disabled' : ''}`} 
        onClick={toggleOpen}
      >
        {value ? 
          React.Children.toArray(children).find(
            (child) => React.isValidElement<React.ComponentProps<typeof SelectItem>>(child) && 'value' in child.props && child.props.value === value
          ) || placeholder
          : 
          placeholder
        }
        <ChevronDown className="custom-select-icon" />
      </div>
      
      {isOpen && (
        <div className="custom-select-dropdown">
          {React.Children.map(children, (child) => {
            if (React.isValidElement<SelectItemProps>(child)) {
              return React.cloneElement(child, {
                onSelect: () => handleSelect(child.props.value),
              });
            }
            return child;
          })}
        </div>
      )}
    </div>
  );
};

interface SelectItemProps {
  value: string;
  onSelect?: () => void;
  children?: React.ReactNode;
}

export const SelectItem: React.FC<SelectItemProps> = ({
  value,
  onSelect,
  children
}) => {
  return (
    <div className="custom-select-item" onClick={onSelect}>
      {children}
    </div>
  );
};

// For compatibility with the import pattern
export const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SelectTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SelectValue = ({ placeholder }: { placeholder?: string }) => <>{placeholder}</>;
export const SelectGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SelectLabel = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const SelectSeparator = () => <div className="custom-select-separator"></div>;
export const SelectScrollUpButton = () => null;
export const SelectScrollDownButton = () => null;
