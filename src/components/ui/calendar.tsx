"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  addDays, 
  addMonths, 
  format, 
  getDaysInMonth, 
  isSameDay, 
  isSameMonth,
  isToday,
  startOfMonth, 
  subMonths 
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type CalendarProps = {
  mode?: "single" | "range" | "multiple";
  selected?: Date | Date[] | { from: Date; to: Date };
  onSelect?: (date: Date | null) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
  initialFocus?: boolean;
};

export function Calendar({
  mode = "single",
  selected,
  onSelect,
  disabled,
  className,
}: CalendarProps) {
  const [month, setMonth] = React.useState(new Date());

  // Get day names for header
  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  // Function to check if a date is selected
  const isSelectedDate = (date: Date): boolean => {
    if (!selected) return false;
    
    if (selected instanceof Date) {
      return isSameDay(date, selected);
    } else if (Array.isArray(selected)) {
      return selected.some(selectedDate => isSameDay(date, selectedDate));
    } else {
      // Range selection
      const { from, to } = selected;
      if (from && to) {
        return date >= from && date <= to;
      } else if (from) {
        return isSameDay(date, from);
      }
      return false;
    }
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    if (disabled?.(date)) return;
    onSelect?.(date);
  };

  // Generate days for current month view
  const renderDays = () => {
    const days = [];
    const monthStart = startOfMonth(month);
    const daysInMonth = getDaysInMonth(month);
    
    // First day of month (0 = Sunday, 1 = Monday, etc.)
    const firstDayOfMonth = monthStart.getDay();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      const isSelected = isSelectedDate(date);
      const isDisabled = disabled?.(date) || false;
      const isTodayDate = isToday(date);
      
      days.push(
        <button
          key={day}
          type="button"
          className={cn(
            "calendar-day",
            isTodayDate && "today",
            isSelected && "selected",
            isDisabled && "disabled",
            !isSameMonth(date, month) && "outside-month"
          )}
          disabled={isDisabled}
          onClick={() => handleDateSelect(date)}
        >
          {day}
        </button>
      );
    }
    
    return days;
  };

  return (
    <div className={cn("calendar", className)}>
      <div className="calendar-header">
        <button 
          type="button"
          className="month-nav prev" 
          onClick={() => setMonth(subMonths(month, 1))}
        >
          <ChevronLeft size={18} />
        </button>
        <div className="current-month">
          {format(month, "MMMM yyyy")}
        </div>
        <button 
          type="button"
          className="month-nav next" 
          onClick={() => setMonth(addMonths(month, 1))}
        >
          <ChevronRight size={18} />
        </button>
      </div>
      
      <div className="calendar-weekdays">
        {weekDays.map(day => (
          <div key={day} className="weekday">{day}</div>
        ))}
      </div>
      
      <div className="calendar-grid">
        {renderDays()}
      </div>
    </div>
  );
}

// Add calendar styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .calendar {
      width: 300px;
      border: 1px solid rgba(0, 0, 0, 0.1);
      border-radius: 0.5rem;
      background-color: white;
      padding: 1rem;
      font-family: system-ui, -apple-system, sans-serif;
    }
    
    .calendar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .month-nav {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 0.25rem;
    }
    
    .month-nav:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    .current-month {
      font-weight: 500;
    }
    
    .calendar-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.25rem;
      margin-bottom: 0.5rem;
    }
    
    .weekday {
      text-align: center;
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: 500;
    }
    
    .calendar-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 0.25rem;
    }
    
    .calendar-day {
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      border-radius: 0.25rem;
      border: none;
      background: transparent;
      cursor: pointer;
    }
    
    .calendar-day:hover:not(.empty):not(.disabled) {
      background-color: rgba(0, 0, 0, 0.05);
    }
    
    .calendar-day.today {
      border: 1px solid #3b82f6;
    }
    
    .calendar-day.selected {
      background-color: #3b82f6;
      color: white;
    }
    
    .calendar-day.disabled {
      opacity: 0.4;
      cursor: default;
    }
    
    .calendar-day.empty {
      background: transparent;
    }
    
    .calendar-day.outside-month {
      color: #9ca3af;
    }
  `;
  document.head.appendChild(style);
}