'use client';

/**
 * Quantity Selector - Miktar seçici component
 * +/- butonları ile miktar ayarlama
 */

import { Minus, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function QuantitySelector({
  value,
  onChange,
  min = 0,
  max = 9999,
  disabled = false,
  size = 'md',
}: QuantitySelectorProps) {
  const [localValue, setLocalValue] = useState(value);
  
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  const handleIncrement = () => {
    if (localValue < max && !disabled) {
      const newValue = localValue + 1;
      setLocalValue(newValue);
      onChange(newValue);
    }
  };
  
  const handleDecrement = () => {
    if (localValue > min && !disabled) {
      const newValue = localValue - 1;
      setLocalValue(newValue);
      onChange(newValue);
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 0;
    const clampedValue = Math.max(min, Math.min(max, val));
    setLocalValue(clampedValue);
  };
  
  const handleInputBlur = () => {
    onChange(localValue);
  };
  
  // Size variants
  const sizeClasses = {
    sm: {
      button: 'w-7 h-7',
      input: 'w-12 h-7 text-sm',
      icon: 'w-3 h-3',
    },
    md: {
      button: 'w-9 h-9',
      input: 'w-16 h-9 text-base',
      icon: 'w-4 h-4',
    },
    lg: {
      button: 'w-11 h-11',
      input: 'w-20 h-11 text-lg',
      icon: 'w-5 h-5',
    },
  };
  
  const classes = sizeClasses[size];
  
  return (
    <div className="flex items-center space-x-2">
      {/* Minus Button */}
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || localValue <= min}
        className={`
          ${classes.button}
          flex items-center justify-center
          rounded-lg border-2 border-gray-300
          bg-white hover:bg-gray-50
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
        `}
        aria-label="Azalt"
      >
        <Minus className={classes.icon} />
      </button>
      
      {/* Input */}
      <input
        type="number"
        value={localValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        disabled={disabled}
        min={min}
        max={max}
        className={`
          ${classes.input}
          text-center font-medium
          border-2 border-gray-300 rounded-lg
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      />
      
      {/* Plus Button */}
      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || localValue >= max}
        className={`
          ${classes.button}
          flex items-center justify-center
          rounded-lg border-2 border-gray-300
          bg-white hover:bg-gray-50
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
        `}
        aria-label="Artır"
      >
        <Plus className={classes.icon} />
      </button>
    </div>
  );
}
