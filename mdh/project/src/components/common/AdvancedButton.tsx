import React, { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { useUIUX } from '../../contexts/UIUXContext';
import { useAnimation } from './AnimationSystem';
import { Loader2, Check, X, AlertCircle, Info } from 'lucide-react';

// Button variants
export type ButtonVariant = 
  | 'primary' | 'secondary' | 'ghost' | 'outline' | 'link' 
  | 'success' | 'warning' | 'error' | 'info'
  | 'gradient' | 'floating' | 'icon' | 'fab';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type ButtonState = 'default' | 'loading' | 'success' | 'error' | 'disabled';

export interface AdvancedButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  state?: ButtonState;
  loading?: boolean;
  success?: boolean;
  error?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: boolean;
  shadow?: boolean;
  glow?: boolean;
  animation?: boolean;
  children?: ReactNode;
  onClick?: () => void;
}

const AdvancedButton = forwardRef<HTMLButtonElement, AdvancedButtonProps>(({
  variant = 'primary',
  size = 'md',
  state = 'default',
  loading = false,
  success = false,
  error = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  rounded = false,
  shadow = false,
  glow = false,
  animation = true,
  children,
  className = '',
  disabled,
  onClick,
  ...props
}, ref) => {
  const { settings } = useUIUX();
  const { addAnimation } = useAnimation();

  // State hesaplama
  const isDisabled = disabled || state === 'disabled' || loading;
  const isSuccess = success || state === 'success';
  const isError = error || state === 'error';
  const isLoading = loading || state === 'loading';

  // Base classes
  const baseClasses = `
    relative inline-flex items-center justify-center font-medium
    transition-all duration-300 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${animation ? 'hover:scale-105 active:scale-95' : ''}
    ${fullWidth ? 'w-full' : ''}
    ${rounded ? 'rounded-full' : 'rounded-lg'}
    ${shadow ? 'shadow-lg hover:shadow-xl' : ''}
    ${glow ? 'shadow-glow hover:shadow-glow-lg' : ''}
  `;

  // Size classes
  const sizeClasses = {
    xs: 'px-2 py-1 text-xs min-h-[24px]',
    sm: 'px-3 py-1.5 text-sm min-h-[32px]',
    md: 'px-4 py-2 text-sm min-h-[40px]',
    lg: 'px-6 py-3 text-base min-h-[48px]',
    xl: 'px-8 py-4 text-lg min-h-[56px]'
  };

  // Variant classes
  const variantClasses = {
    primary: `
      bg-primary-600 text-white border border-primary-600
      hover:bg-primary-700 hover:border-primary-700
      focus:ring-primary-500
      ${isSuccess ? 'bg-success-600 border-success-600 hover:bg-success-700' : ''}
      ${isError ? 'bg-error-600 border-error-600 hover:bg-error-700' : ''}
    `,
    secondary: `
      bg-gray-100 text-gray-900 border border-gray-300
      hover:bg-gray-200 hover:border-gray-400
      focus:ring-gray-500
      dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600
      dark:hover:bg-gray-600 dark:hover:border-gray-500
    `,
    ghost: `
      bg-transparent text-gray-700 border border-transparent
      hover:bg-gray-100 hover:text-gray-900
      focus:ring-gray-500
      dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100
    `,
    outline: `
      bg-transparent text-primary-600 border border-primary-600
      hover:bg-primary-50 hover:text-primary-700
      focus:ring-primary-500
      dark:text-primary-400 dark:border-primary-400
      dark:hover:bg-primary-900/20 dark:hover:text-primary-300
    `,
    link: `
      bg-transparent text-primary-600 border border-transparent
      hover:text-primary-700 hover:underline
      focus:ring-primary-500
      dark:text-primary-400 dark:hover:text-primary-300
    `,
    success: `
      bg-success-600 text-white border border-success-600
      hover:bg-success-700 hover:border-success-700
      focus:ring-success-500
    `,
    warning: `
      bg-warning-600 text-white border border-warning-600
      hover:bg-warning-700 hover:border-warning-700
      focus:ring-warning-500
    `,
    error: `
      bg-error-600 text-white border border-error-600
      hover:bg-error-700 hover:border-error-700
      focus:ring-error-500
    `,
    info: `
      bg-blue-600 text-white border border-blue-600
      hover:bg-blue-700 hover:border-blue-700
      focus:ring-blue-500
    `,
    gradient: `
      bg-gradient-to-r from-primary-600 to-primary-800 text-white border border-transparent
      hover:from-primary-700 hover:to-primary-900
      focus:ring-primary-500
      ${shadow ? 'shadow-lg' : ''}
    `,
    floating: `
      bg-primary-600 text-white border border-transparent
      hover:bg-primary-700 shadow-lg hover:shadow-xl
      focus:ring-primary-500 rounded-full
      ${shadow ? 'shadow-2xl' : ''}
    `,
    icon: `
      bg-transparent text-gray-600 border border-transparent
      hover:bg-gray-100 hover:text-gray-900
      focus:ring-gray-500 rounded-full p-2
      dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100
    `,
    fab: `
      bg-primary-600 text-white border border-transparent
      hover:bg-primary-700 shadow-lg hover:shadow-xl
      focus:ring-primary-500 rounded-full
      fixed bottom-6 right-6 z-50
      ${shadow ? 'shadow-2xl' : ''}
    `
  };

  // Icon component
  const renderIcon = () => {
    if (isLoading) {
      return <Loader2 className="w-4 h-4 animate-spin" />;
    }
    
    if (isSuccess) {
      return <Check className="w-4 h-4" />;
    }
    
    if (isError) {
      return <X className="w-4 h-4" />;
    }
    
    if (icon) {
      return icon;
    }
    
    return null;
  };

  // Click handler with animation
  const handleClick = () => {
    if (isDisabled) return;
    
    if (animation && !isLoading) {
      addAnimation(`button-${Date.now()}`, {
        type: 'scaleIn',
        duration: 'fast',
        easing: 'bounce'
      });
    }
    
    onClick?.();
  };

  const buttonClasses = `
    ${baseClasses}
    ${sizeClasses[size]}
    ${variantClasses[variant]}
    ${className}
  `.trim();

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={isDisabled}
      onClick={handleClick}
      {...props}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-inherit">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      )}
      
      {/* Success overlay */}
      {isSuccess && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-success-600 rounded-inherit animate-success">
          <Check className="w-4 h-4 text-white" />
        </div>
      )}
      
      {/* Error overlay */}
      {isError && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-error-600 rounded-inherit animate-error">
          <X className="w-4 h-4 text-white" />
        </div>
      )}
      
      {/* Content */}
      <div className={`flex items-center gap-2 ${isLoading || isSuccess || isError ? 'opacity-0' : 'opacity-100'}`}>
        {iconPosition === 'left' && renderIcon()}
        {children && <span>{children}</span>}
        {iconPosition === 'right' && renderIcon()}
      </div>
    </button>
  );
});

AdvancedButton.displayName = 'AdvancedButton';

// Button Group Component
interface ButtonGroupProps {
  children: ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  orientation = 'horizontal',
  spacing = 'sm',
  className = ''
}) => {
  const orientationClasses = orientation === 'horizontal' ? 'flex-row' : 'flex-col';
  const spacingClasses = {
    none: '',
    sm: orientation === 'horizontal' ? 'space-x-1' : 'space-y-1',
    md: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
    lg: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4'
  };

  return (
    <div className={`inline-flex ${orientationClasses} ${spacingClasses[spacing]} ${className}`}>
      {children}
    </div>
  );
};

// Icon Button Component
interface IconButtonProps extends Omit<AdvancedButtonProps, 'variant' | 'children'> {
  icon: ReactNode;
  label?: string;
  tooltip?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  label,
  tooltip,
  size = 'md',
  ...props
}) => {
  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7'
  };

  return (
    <AdvancedButton
      variant="icon"
      size={size}
      icon={<span className={iconSizes[size]}>{icon}</span>}
      title={tooltip || label}
      {...props}
    >
      {label}
    </AdvancedButton>
  );
};

// Floating Action Button Component
interface FABProps extends Omit<AdvancedButtonProps, 'variant'> {
  icon: ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FAB: React.FC<FABProps> = ({
  icon,
  label,
  position = 'bottom-right',
  size = 'lg',
  ...props
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  return (
    <AdvancedButton
      variant="fab"
      size={size}
      icon={icon}
      className={`${positionClasses[position]} ${props.className || ''}`}
      {...props}
    >
      {label}
    </AdvancedButton>
  );
};

// Toggle Button Component
interface ToggleButtonProps extends AdvancedButtonProps {
  pressed?: boolean;
  onToggle?: (pressed: boolean) => void;
}

export const ToggleButton: React.FC<ToggleButtonProps> = ({
  pressed = false,
  onToggle,
  onClick,
  ...props
}) => {
  const handleClick = () => {
    onToggle?.(!pressed);
    onClick?.();
  };

  return (
    <AdvancedButton
      {...props}
      onClick={handleClick}
      className={`${props.className || ''} ${pressed ? 'ring-2 ring-primary-500 bg-primary-100 dark:bg-primary-900' : ''}`}
    />
  );
};

export default AdvancedButton;
