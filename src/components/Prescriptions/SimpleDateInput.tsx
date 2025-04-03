"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SimpleDateInputProps {
  date: Date | null;
  onDateChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function SimpleDateInput({
  date,
  onDateChange,
  placeholder = "Select date",
  className,
  disabled = false
}: SimpleDateInputProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div 
          className={cn(
            "date-input-field",
            disabled && "disabled",
            className
          )}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-haspopup="dialog"
        >
          <span className={cn(
            "date-input-value",
            !date && "placeholder"
          )}>
            <CalendarIcon className="date-icon" />
            {date ? format(date, "PPP") : placeholder}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="date-popover" align="start">
        <Calendar
          mode="single"
          selected={date || undefined}
          onSelect={onDateChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

// Add styles for the date input
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .date-input-field {
      display: flex;
      height: 2.5rem;
      width: 100%;
      align-items: center;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      background-color: white;
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      cursor: pointer;
      transition: border-color 0.15s, box-shadow 0.15s;
    }
    
    .date-input-field:hover:not(.disabled) {
      border-color: #a1a1aa;
    }
    
    .date-input-field:focus-visible {
      outline: 2px solid #3b82f6;
      outline-offset: 2px;
    }
    
    .date-input-field.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background-color: #f3f4f6;
    }
    
    .date-input-value {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      text-align: left;
    }
    
    .date-input-value.placeholder {
      color: #6b7280;
    }
    
    .date-icon {
      width: 1rem;
      height: 1rem;
      color: #6b7280;
    }
    
    .date-popover {
      width: auto;
      padding: 0;
    }
  `;
  document.head.appendChild(style);
}
