"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import "./switch.css"

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
  checked?: boolean;
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, checked, id, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(checked || false);

    React.useEffect(() => {
      if (checked !== undefined) {
        setIsChecked(checked);
      }
    }, [checked]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = event.target.checked;
      
      if (checked === undefined) {
        setIsChecked(newChecked);
      }
      
      if (onCheckedChange) {
        onCheckedChange(newChecked);
      }
    };

    return (
      <div className={cn("switch-container", className)}>
        <input
          type="checkbox"
          id={id}
          className="switch-input"
          checked={isChecked}
          onChange={handleChange}
          ref={ref}
          {...props}
        />
        <label htmlFor={id} className="switch-label">
          <span className="switch-button" />
        </label>
      </div>
    );
  }
);

Switch.displayName = "Switch";

export { Switch };
