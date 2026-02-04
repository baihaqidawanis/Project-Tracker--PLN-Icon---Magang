'use client';

import React, { useState, ClipboardEvent } from 'react';
import { formatDateShort } from '../../../utils/date-utils';

interface DateDisplayInputProps {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onPaste?: (e: ClipboardEvent) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * DateDisplayInput - shows "dd MMM" when not focused, date picker when focused
 */
export default function DateDisplayInput({ 
  value, 
  onChange, 
  onFocus, 
  onPaste, 
  className, 
  style 
}: DateDisplayInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  if (isFocused) {
    return (
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleBlur}
        onPaste={onPaste}
        className={className}
        style={style}
        autoFocus
      />
    );
  }

  return (
    <div
      onClick={handleFocus}
      className={className}
      style={{ ...style, cursor: 'pointer' }}
    >
      {value ? formatDateShort(value) : '-'}
    </div>
  );
}
