import React, { useState, useRef } from 'react';
import { ButtonHTMLAttributes } from 'react';

export interface AdvancedButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  ripple?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  gradient?: boolean;
  shadow?: boolean;
  hover?: boolean;
  pulse?: boolean;
  bounce?: boolean;
  glow?: boolean;
  scale?: boolean;
  onClick?: () => void;
}

const AdvancedButton: React.FC<AdvancedButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  ripple = true,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  gradient = false,
  shadow = true,
  hover = true,
  pulse = false,
  bounce = false,
  glow = false,
  scale = true,
  className = '',
  onClick,
  disabled,
  ...props
}) => {
  const [, setIsPressed] = useState(false);
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number; size: number }>>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (ripple && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      const newRipple = {
        id: rippleIdRef.current++,
        x,
        y,
        size
      };
      
      setRipples(prev => [...prev, newRipple]);
      
      // Ripple'i 600ms sonra kaldır
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    }
    
    onClick?.();
  };

  const getVariantClasses = () => {
    const variants = {
      primary: gradient 
        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white'
        : 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
      success: gradient
        ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white'
        : 'bg-green-600 hover:bg-green-700 text-white',
      warning: gradient
        ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white'
        : 'bg-yellow-500 hover:bg-yellow-600 text-white',
      danger: gradient
        ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white'
        : 'bg-red-600 hover:bg-red-700 text-white',
      ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
    };
    
    return variants[variant];
  };

  const getSizeClasses = () => {
    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-sm',
      lg: 'px-6 py-3 text-base'
    };
    
    return sizes[size];
  };

  const getEffectClasses = () => {
    let effects = '';
    
    if (hover) {
      effects += ' transform ';
      if (scale) {
        effects += ' hover:scale-105 active:scale-95 ';
      }
    }
    
    if (pulse) {
      effects += ' animate-pulse ';
    }
    
    if (bounce) {
      effects += ' hover:animate-bounce ';
    }
    
    if (glow) {
      effects += ' hover:shadow-lg hover:shadow-blue-500/25 ';
    }
    
    return effects;
  };

  const getShadowClasses = () => {
    if (!shadow) return '';
    
    return ' shadow-md hover:shadow-lg ';
  };

  const baseClasses = `
    relative overflow-hidden
    rounded-lg font-medium
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${getVariantClasses()}
    ${getSizeClasses()}
    ${getEffectClasses()}
    ${getShadowClasses()}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `.trim();

  const focusRingClasses = {
    primary: 'focus:ring-blue-500',
    secondary: 'focus:ring-gray-500',
    success: 'focus:ring-green-500',
    warning: 'focus:ring-yellow-500',
    danger: 'focus:ring-red-500',
    ghost: 'focus:ring-gray-500'
  };

  return (
    <button
      ref={buttonRef}
      className={`${baseClasses} ${focusRingClasses[variant]}`}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {/* Ripple Effects */}
      {ripples.map((ripple) => (
        <div
          key={ripple.id}
          className="absolute bg-white bg-opacity-30 rounded-full animate-ping pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}
      
      {/* Loading Spinner */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-inherit rounded-lg">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      
      {/* Button Content */}
      <div className={`flex items-center justify-center space-x-2 ${loading ? 'opacity-0' : 'opacity-100'}`}>
        {icon && iconPosition === 'left' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
        
        {children && (
          <span className="flex-1">{children}</span>
        )}
        
        {icon && iconPosition === 'right' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </div>
    </button>
  );
};

// Button Group Component
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({ children, className = '' }) => {
  return (
    <div className={`inline-flex rounded-lg shadow-sm ${className}`} role="group">
      {children}
    </div>
  );
};

// Icon Button Component
interface IconButtonProps extends Omit<AdvancedButtonProps, 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton: React.FC<IconButtonProps> = ({ icon, 'aria-label': ariaLabel, ...props }) => {
  return (
    <AdvancedButton
      {...props}
      aria-label={ariaLabel}
      className={`p-2 ${props.className || ''}`}
    >
      {icon}
    </AdvancedButton>
  );
};

// Floating Action Button
interface FABProps extends Omit<AdvancedButtonProps, 'size'> {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FAB: React.FC<FABProps> = ({
  position = 'bottom-right',
  className = '',
  ...props
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6'
  };

  return (
    <AdvancedButton
      {...props}
      size="lg"
      className={`
        ${positionClasses[position]}
        rounded-full shadow-lg hover:shadow-xl
        z-50
        ${className}
      `}
    />
  );
};

export default AdvancedButton;
