'use client';

import React from 'react';
import './SimpleDateInput.css';

interface SimpleDateInputProps {
  label: string;
  value: { day: string; month: string; year: string };
  onChange: (value: { day: string; month: string; year: string }) => void;
  error?: string;
  required?: boolean;
}

export default function SimpleDateInput({
  label,
  value,
  onChange,
  error,
  required = false,
}: SimpleDateInputProps) {
  const handleInputChange = (field: 'day' | 'month' | 'year', newValue: string) => {
    onChange({ ...value, [field]: newValue });
  };

  return (
    <div className="simple-date-input">
      <label className="date-input-label">
        {label}
        {required && <span className="required">*</span>}
      </label>
      <div className="date-input-fields">
        <input
          type="text"
          className={`date-input-field ${error ? 'error' : ''}`}
          placeholder="DD"
          maxLength={2}
          value={value.day}
          onChange={(e) => handleInputChange('day', e.target.value)}
        />
        <input
          type="text"
          className={`date-input-field ${error ? 'error' : ''}`}
          placeholder="MM"
          maxLength={2}
          value={value.month}
          onChange={(e) => handleInputChange('month', e.target.value)}
        />
        <input
          type="text"
          className={`date-input-field ${error ? 'error' : ''}`}
          placeholder="YYYY"
          maxLength={4}
          value={value.year}
          onChange={(e) => handleInputChange('year', e.target.value)}
        />
      </div>
      {error && <div className="date-input-error">{error}</div>}
    </div>
  );
}
