import React, { useState, useEffect, useRef, ReactNode, ChangeEvent } from 'react';
import { useAnimation } from './AnimationSystem';
import { TouchFeedback } from './TouchInteractions';
import { 
  Eye, EyeOff, Search, X, Check, AlertCircle, 
  ChevronDown, Star
} from 'lucide-react';

// Form Field Types
export type FormFieldType = 
  | 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search'
  | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'switch'
  | 'date' | 'time' | 'datetime' | 'file' | 'rating' | 'slider' | 'color';

export type ValidationRule = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
};

export type FormFieldState = 'default' | 'focused' | 'error' | 'success' | 'disabled';

// Base Form Field Props
interface BaseFormFieldProps {
  label?: string;
  placeholder?: string;
  value?: any;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  success?: string;
  help?: string;
  disabled?: boolean;
  required?: boolean;
  validation?: ValidationRule;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  state?: FormFieldState;
}

// Advanced Input Component
interface AdvancedInputProps extends BaseFormFieldProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  clearable?: boolean;
  maxLength?: number;
  showCharacterCount?: boolean;
  autoComplete?: string;
  autoFocus?: boolean;
}

export const AdvancedInput: React.FC<AdvancedInputProps> = ({
  label,
  placeholder,
  value = '',
  onChange,
  onBlur,
  onFocus,
  error,
  success,
  help,
  disabled = false,
  required = false,
  type = 'text',
  icon,
  iconPosition = 'left',
  clearable = false,
  maxLength,
  showCharacterCount = false,
  className = '',
  size = 'md',
  state = 'default',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const { addAnimation } = useAnimation();

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
    addAnimation('input-focus', {
      type: 'scaleIn',
      duration: 'fast',
      easing: 'bounce'
    });
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const handleClear = () => {
    setInternalValue('');
    onChange?.('');
    inputRef.current?.focus();
  };

  const getStateClasses = () => {
    if (error || state === 'error') return 'border-error-500 focus:ring-error-500';
    if (success || state === 'success') return 'border-success-500 focus:ring-success-500';
    if (isFocused) return 'border-primary-500 focus:ring-primary-500';
    return 'border-gray-300 dark:border-gray-600 focus:ring-primary-500';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'px-3 py-2 text-sm';
      case 'lg': return 'px-4 py-3 text-lg';
      default: return 'px-4 py-2 text-base';
    }
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}

        {/* Input */}
        <TouchFeedback feedback="glow">
          <input
            ref={inputRef}
            type={inputType}
            value={internalValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            maxLength={maxLength}
            className={`
              w-full ${getSizeClasses()} border rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
              placeholder-gray-500 dark:placeholder-gray-400
              focus:outline-none focus:ring-2 focus:border-transparent
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              ${icon && iconPosition === 'left' ? 'pl-10' : ''}
              ${(icon && iconPosition === 'right') || clearable || type === 'password' ? 'pr-10' : ''}
              ${getStateClasses()}
            `}
            {...props}
          />
        </TouchFeedback>

        {/* Right Icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
          {/* Password Toggle */}
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}

          {/* Clear Button */}
          {clearable && internalValue && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Right Icon */}
          {icon && iconPosition === 'right' && (
            <div className="text-gray-400">
              {icon}
            </div>
          )}
        </div>
      </div>

      {/* Character Count */}
      {showCharacterCount && maxLength && (
        <div className="text-right text-xs text-gray-500">
          {internalValue.length}/{maxLength}
        </div>
      )}

      {/* Help Text */}
      {help && !error && !success && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {help}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-error-600 dark:text-error-400">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 text-sm text-success-600 dark:text-success-400">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}
    </div>
  );
};

// Advanced Textarea Component
interface AdvancedTextareaProps extends BaseFormFieldProps {
  rows?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  autoResize?: boolean;
  maxLength?: number;
  showCharacterCount?: boolean;
}

export const AdvancedTextarea: React.FC<AdvancedTextareaProps> = ({
  label,
  placeholder,
  value = '',
  onChange,
  onBlur,
  onFocus,
  error,
  success,
  help,
  disabled = false,
  required = false,
  rows = 4,
  resize = 'vertical',
  autoResize = false,
  maxLength,
  showCharacterCount = false,
  className = '',
  size = 'md',
  state = 'default',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [internalValue, setInternalValue] = useState(value);
  const { addAnimation } = useAnimation();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [internalValue, autoResize]);

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
    addAnimation('textarea-focus', {
      type: 'scaleIn',
      duration: 'fast',
      easing: 'bounce'
    });
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  const getStateClasses = () => {
    if (error || state === 'error') return 'border-error-500 focus:ring-error-500';
    if (success || state === 'success') return 'border-success-500 focus:ring-success-500';
    if (isFocused) return 'border-primary-500 focus:ring-primary-500';
    return 'border-gray-300 dark:border-gray-600 focus:ring-primary-500';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'px-3 py-2 text-sm';
      case 'lg': return 'px-4 py-3 text-lg';
      default: return 'px-4 py-2 text-base';
    }
  };

  const getResizeClasses = () => {
    switch (resize) {
      case 'none': return 'resize-none';
      case 'vertical': return 'resize-y';
      case 'horizontal': return 'resize-x';
      case 'both': return 'resize';
      default: return 'resize-y';
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      {/* Textarea */}
      <TouchFeedback feedback="glow">
        <textarea
          ref={textareaRef}
          value={internalValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          className={`
            w-full ${getSizeClasses()} border rounded-lg
            bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
            placeholder-gray-500 dark:placeholder-gray-400
            focus:outline-none focus:ring-2 focus:border-transparent
            transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${getResizeClasses()}
            ${getStateClasses()}
          `}
          {...props}
        />
      </TouchFeedback>

      {/* Character Count */}
      {showCharacterCount && maxLength && (
        <div className="text-right text-xs text-gray-500">
          {internalValue.length}/{maxLength}
        </div>
      )}

      {/* Help Text */}
      {help && !error && !success && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {help}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-error-600 dark:text-error-400">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 text-sm text-success-600 dark:text-success-400">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}
    </div>
  );
};

// Advanced Select Component
interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  icon?: ReactNode;
}

interface AdvancedSelectProps extends BaseFormFieldProps {
  options: SelectOption[];
  multiple?: boolean;
  searchable?: boolean;
  clearable?: boolean;
  placeholder?: string;
  emptyMessage?: string;
  loading?: boolean;
  onSearch?: (query: string) => void;
}

export const AdvancedSelect: React.FC<AdvancedSelectProps> = ({
  label,
  placeholder = 'Seçiniz...',
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  success,
  help,
  disabled = false,
  required = false,
  options = [],
  multiple = false,
  searchable = false,
  clearable = false,
  emptyMessage = 'Seçenek bulunamadı',
  loading = false,
  onSearch,
  className = '',
  size = 'md',
  state = 'default',
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const { addAnimation } = useAnimation();
  const selectRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedOptions = Array.isArray(value) ? value : (value ? [value] : []);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      addAnimation('select-open', {
        type: 'fadeInUp',
        duration: 'fast',
        easing: 'ease-out'
      });
    }
  };

  const handleSelect = (option: SelectOption) => {
    if (option.disabled) return;

    if (multiple) {
      const newValue = selectedOptions.includes(option.value)
        ? selectedOptions.filter(v => v !== option.value)
        : [...selectedOptions, option.value];
      onChange?.(newValue);
    } else {
      onChange?.(option.value);
      setIsOpen(false);
    }
  };

  const handleClear = () => {
    onChange?.(multiple ? [] : '');
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    onSearch?.(query);
  };

  const getStateClasses = () => {
    if (error || state === 'error') return 'border-error-500 focus:ring-error-500';
    if (success || state === 'success') return 'border-success-500 focus:ring-success-500';
    if (isFocused || isOpen) return 'border-primary-500 focus:ring-primary-500';
    return 'border-gray-300 dark:border-gray-600 focus:ring-primary-500';
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'px-3 py-2 text-sm';
      case 'lg': return 'px-4 py-3 text-lg';
      default: return 'px-4 py-2 text-base';
    }
  };

  return (
    <div className={`space-y-2 ${className}`} ref={selectRef}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      {/* Select Container */}
      <div className="relative">
        {/* Select Button */}
        <TouchFeedback feedback="glow">
          <button
            type="button"
            onClick={handleToggle}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            className={`
              w-full ${getSizeClasses()} border rounded-lg
              bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100
              focus:outline-none focus:ring-2 focus:border-transparent
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-between
              ${getStateClasses()}
            `}
            {...props}
          >
            <span className="truncate">
              {selectedOptions.length === 0
                ? placeholder
                : multiple
                ? `${selectedOptions.length} seçenek seçildi`
                : options.find(opt => opt.value === value)?.label || placeholder
              }
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </TouchFeedback>

        {/* Clear Button */}
        {clearable && selectedOptions.length > 0 && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-strong max-h-60 overflow-hidden">
            {/* Search */}
            {searchable && (
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <AdvancedInput
                  type="search"
                  placeholder="Ara..."
                  value={searchQuery}
                  onChange={handleSearch}
                  icon={<Search className="w-4 h-4" />}
                  size="sm"
                />
              </div>
            )}

            {/* Options */}
            <div className="max-h-48 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  {emptyMessage}
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option)}
                    disabled={option.disabled}
                    className={`
                      w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700
                      disabled:opacity-50 disabled:cursor-not-allowed
                      flex items-center gap-3
                      ${selectedOptions.includes(option.value) ? 'bg-primary-50 dark:bg-primary-900/20' : ''}
                    `}
                  >
                    {option.icon && <span className="text-gray-400">{option.icon}</span>}
                    <span className="flex-1">{option.label}</span>
                    {selectedOptions.includes(option.value) && (
                      <Check className="w-4 h-4 text-primary-600" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Help Text */}
      {help && !error && !success && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {help}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-error-600 dark:text-error-400">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 text-sm text-success-600 dark:text-success-400">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}
    </div>
  );
};

// Rating Component
interface RatingProps extends BaseFormFieldProps {
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  allowHalf?: boolean;
  readonly?: boolean;
  showValue?: boolean;
}

export const Rating: React.FC<RatingProps> = ({
  label,
  value = 0,
  onChange,
  error,
  success,
  help,
  disabled = false,
  required = false,
  max = 5,
  size = 'md',
  allowHalf = false,
  readonly = false,
  showValue = false,
  className = '',
  state = 'default',
  ...props
}) => {
  const [hoverValue, setHoverValue] = useState(0);
  const { addAnimation } = useAnimation();

  const getSizeClasses = () => {
    switch (size) {
      case 'sm': return 'w-4 h-4';
      case 'lg': return 'w-8 h-8';
      default: return 'w-6 h-6';
    }
  };

  const handleClick = (rating: number) => {
    if (disabled || readonly) return;
    onChange?.(rating);
    addAnimation('rating-click', {
      type: 'bounceIn',
      duration: 'fast',
      easing: 'bounce'
    });
  };

  const handleMouseEnter = (rating: number) => {
    if (disabled || readonly) return;
    setHoverValue(rating);
  };

  const handleMouseLeave = () => {
    if (disabled || readonly) return;
    setHoverValue(0);
  };

  const displayValue = hoverValue || value;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-error-500 ml-1">*</span>}
        </label>
      )}

      {/* Rating Stars */}
      <div className="flex items-center gap-1">
        {Array.from({ length: max }, (_, index) => {
          const rating = index + 1;
          const isFilled = rating <= displayValue;

          return (
            <button
              key={index}
              type="button"
              onClick={() => handleClick(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
              onMouseLeave={handleMouseLeave}
              disabled={disabled || readonly}
              className={`
                ${getSizeClasses()} transition-colors duration-200
                ${isFilled ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}
                ${!disabled && !readonly ? 'hover:text-yellow-400 cursor-pointer' : 'cursor-default'}
              `}
              {...props}
            >
              <Star className={`w-full h-full ${isFilled ? 'fill-current' : ''}`} />
            </button>
          );
        })}
        
        {showValue && (
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            {value.toFixed(1)}
          </span>
        )}
      </div>

      {/* Help Text */}
      {help && !error && !success && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {help}
        </p>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-error-600 dark:text-error-400">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-center gap-2 text-sm text-success-600 dark:text-success-400">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}
    </div>
  );
};

export default AdvancedInput;
