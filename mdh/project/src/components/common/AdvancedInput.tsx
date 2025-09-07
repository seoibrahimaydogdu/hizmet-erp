import React, { useState, useRef, useEffect } from 'react';
import { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

export interface AdvancedInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  focus?: boolean;
  glow?: boolean;
  animated?: boolean;
  floating?: boolean;
  onClear?: () => void;
}

const AdvancedInput: React.FC<AdvancedInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  size = 'md',
  variant = 'default',
  focus = true,
  glow = false,
  animated = true,
  floating = false,
  onClear,
  className = '',
  value,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHasValue(!!value);
  }, [value]);

  const getSizeClasses = () => {
    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-sm',
      lg: 'px-4 py-4 text-base'
    };
    return sizes[size];
  };

  const getVariantClasses = () => {
    const variants = {
      default: 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600',
      filled: 'bg-gray-50 dark:bg-gray-700 border-0',
      outlined: 'bg-transparent border-2 border-gray-300 dark:border-gray-600'
    };
    return variants[variant];
  };

  const getFocusClasses = () => {
    if (!focus) return '';
    
    let focusClasses = 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ';
    
    if (glow) {
      focusClasses += 'focus:shadow-lg focus:shadow-blue-500/25 ';
    }
    
    if (animated) {
      focusClasses += 'focus:scale-105 ';
    }
    
    return focusClasses;
  };

  const getTransitionClasses = () => {
    if (!animated) return '';
    return 'transition-all duration-200 ease-out';
  };

  const baseInputClasses = `
    w-full rounded-lg
    text-gray-900 dark:text-white
    placeholder-gray-500 dark:placeholder-gray-400
    ${getVariantClasses()}
    ${getSizeClasses()}
    ${getFocusClasses()}
    ${getTransitionClasses()}
    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
    ${className}
  `.trim();

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setHasValue(!!e.target.value);
    props.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(!!e.target.value);
    props.onChange?.(e);
  };

  const isLabelFloating = floating && (isFocused || hasValue);

  return (
    <div className="relative">
      {/* Label */}
      {label && (
        <label 
          className={`
            block text-sm font-medium mb-2
            ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}
            ${floating ? 'absolute left-3 transition-all duration-200 ease-out pointer-events-none' : ''}
            ${isLabelFloating ? '-top-2 bg-white dark:bg-gray-800 px-1 text-xs' : 'top-3'}
          `}
        >
          {label}
        </label>
      )}
      
      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {leftIcon}
          </div>
        )}
        
        {/* Input */}
        <input
          ref={inputRef}
          className={`
            ${baseInputClasses}
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon || onClear ? 'pr-10' : ''}
          `}
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={handleChange}
          {...props}
        />
        
        {/* Right Icon or Clear Button */}
        {(rightIcon || onClear) && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {onClear && hasValue ? (
              <button
                type="button"
                onClick={onClear}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              rightIcon
            )}
          </div>
        )}
      </div>
      
      {/* Helper Text or Error */}
      {(helperText || error) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

// Textarea Component
export interface AdvancedTextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'filled' | 'outlined';
  focus?: boolean;
  glow?: boolean;
  animated?: boolean;
  floating?: boolean;
  autoResize?: boolean;
}

export const AdvancedTextarea: React.FC<AdvancedTextareaProps> = ({
  label,
  error,
  helperText,
  size = 'md',
  variant = 'default',
  focus = true,
  glow = false,
  animated = true,
  floating = false,
  autoResize = false,
  className = '',
  value,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!value);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setHasValue(!!value);
  }, [value]);

  useEffect(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value, autoResize]);

  const getSizeClasses = () => {
    const sizes = {
      sm: 'px-3 py-2 text-sm',
      md: 'px-4 py-3 text-sm',
      lg: 'px-4 py-4 text-base'
    };
    return sizes[size];
  };

  const getVariantClasses = () => {
    const variants = {
      default: 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600',
      filled: 'bg-gray-50 dark:bg-gray-700 border-0',
      outlined: 'bg-transparent border-2 border-gray-300 dark:border-gray-600'
    };
    return variants[variant];
  };

  const getFocusClasses = () => {
    if (!focus) return '';
    
    let focusClasses = 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ';
    
    if (glow) {
      focusClasses += 'focus:shadow-lg focus:shadow-blue-500/25 ';
    }
    
    if (animated) {
      focusClasses += 'focus:scale-105 ';
    }
    
    return focusClasses;
  };

  const getTransitionClasses = () => {
    if (!animated) return '';
    return 'transition-all duration-200 ease-out';
  };

  const baseTextareaClasses = `
    w-full rounded-lg resize-none
    text-gray-900 dark:text-white
    placeholder-gray-500 dark:placeholder-gray-400
    ${getVariantClasses()}
    ${getSizeClasses()}
    ${getFocusClasses()}
    ${getTransitionClasses()}
    ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}
    ${className}
  `.trim();

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    setHasValue(!!e.target.value);
    props.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHasValue(!!e.target.value);
    props.onChange?.(e);
  };

  const isLabelFloating = floating && (isFocused || hasValue);

  return (
    <div className="relative">
      {/* Label */}
      {label && (
        <label 
          className={`
            block text-sm font-medium mb-2
            ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}
            ${floating ? 'absolute left-3 transition-all duration-200 ease-out pointer-events-none' : ''}
            ${isLabelFloating ? '-top-2 bg-white dark:bg-gray-800 px-1 text-xs' : 'top-3'}
          `}
        >
          {label}
        </label>
      )}
      
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        className={baseTextareaClasses}
        value={value}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        {...props}
      />
      
      {/* Helper Text or Error */}
      {(helperText || error) && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
};

// Search Input Component
export interface SearchInputProps extends Omit<AdvancedInputProps, 'leftIcon' | 'rightIcon'> {
  onSearch?: (value: string) => void;
  onClear?: () => void;
  searchIcon?: React.ReactNode;
  clearIcon?: React.ReactNode;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  onSearch,
  onClear,
  searchIcon,
  clearIcon,
  ...props
}) => {
  const defaultSearchIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );

  const defaultClearIcon = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );

  return (
    <AdvancedInput
      {...props}
      leftIcon={searchIcon || defaultSearchIcon}
      rightIcon={props.value ? (clearIcon || defaultClearIcon) : undefined}
      onClear={onClear}
      placeholder={props.placeholder || 'Ara...'}
      type="search"
    />
  );
};

export default AdvancedInput;
