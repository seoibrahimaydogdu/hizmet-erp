import React, { useState } from 'react';

export interface AdvancedCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  shadow?: boolean;
  gradient?: boolean;
  border?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
  interactive?: boolean;
  glow?: boolean;
  tilt?: boolean;
  scale?: boolean;
  flip?: boolean;
  shimmer?: boolean;
}

const AdvancedCard: React.FC<AdvancedCardProps> = ({
  children,
  className = '',
  hover = true,
  shadow = true,
  gradient = false,
  border = true,
  rounded = 'lg',
  padding = 'md',
  onClick,
  interactive = false,
  glow = false,
  tilt = false,
  scale = true,
  flip = false,
  shimmer = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const getRoundedClasses = () => {
    const roundedClasses = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
      full: 'rounded-full'
    };
    return roundedClasses[rounded];
  };

  const getPaddingClasses = () => {
    const paddingClasses = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8'
    };
    return paddingClasses[padding];
  };

  const getHoverClasses = () => {
    if (!hover) return '';
    
    let hoverClasses = '';
    
    if (scale) {
      hoverClasses += ' hover:scale-105 ';
    }
    
    if (tilt) {
      hoverClasses += ' hover:rotate-1 ';
    }
    
    if (glow) {
      hoverClasses += ' hover:shadow-2xl hover:shadow-blue-500/25 ';
    }
    
    hoverClasses += ' hover:-translate-y-1 ';
    
    return hoverClasses;
  };

  const getShadowClasses = () => {
    if (!shadow) return '';
    return ' shadow-md hover:shadow-lg ';
  };

  const getGradientClasses = () => {
    if (!gradient) return 'bg-white dark:bg-gray-800';
    return 'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900';
  };

  const getBorderClasses = () => {
    if (!border) return '';
    return ' border border-gray-200 dark:border-gray-700 ';
  };

  const getInteractiveClasses = () => {
    if (!interactive && !onClick) return '';
    return ' cursor-pointer ';
  };

  const getShimmerClasses = () => {
    if (!shimmer) return '';
    return ' relative overflow-hidden ';
  };

  const baseClasses = `
    transition-all duration-300 ease-out
    ${getGradientClasses()}
    ${getBorderClasses()}
    ${getRoundedClasses()}
    ${getPaddingClasses()}
    ${getShadowClasses()}
    ${getHoverClasses()}
    ${getInteractiveClasses()}
    ${getShimmerClasses()}
    ${className}
  `.trim();

  const handleClick = () => {
    if (flip) {
      setIsFlipped(!isFlipped);
    }
    onClick?.();
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      className={baseClasses}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Shimmer Effect */}
      {shimmer && isHovered && (
        <div className="absolute inset-0 -top-1 -left-1 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse transform -skew-x-12"></div>
      )}
      
      {/* Flip Effect */}
      {flip && (
        <div className={`transform transition-transform duration-500 ${isFlipped ? 'rotate-y-180' : ''}`}>
          {children}
        </div>
      )}
      
      {/* Normal Content */}
      {!flip && children}
    </div>
  );
};

// Card Header Component
interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '' }) => {
  return (
    <div className={`border-b border-gray-200 dark:border-gray-700 pb-4 mb-4 ${className}`}>
      {children}
    </div>
  );
};

// Card Body Component
interface CardBodyProps {
  children: React.ReactNode;
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '' }) => {
  return (
    <div className={`${className}`}>
      {children}
    </div>
  );
};

// Card Footer Component
interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '' }) => {
  return (
    <div className={`border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 ${className}`}>
      {children}
    </div>
  );
};

// Stat Card Component
interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  color = 'blue',
  className = ''
}) => {
  const getColorClasses = () => {
    const colors = {
      blue: 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
      green: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      yellow: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
      red: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400',
      purple: 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
      indigo: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
    };
    return colors[color];
  };

  return (
    <AdvancedCard className={`${className}`} hover glow>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {trend && (
            <p className={`text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </p>
          )}
        </div>
        {icon && (
          <div className={`p-3 rounded-lg ${getColorClasses()}`}>
            {icon}
          </div>
        )}
      </div>
    </AdvancedCard>
  );
};

// Feature Card Component
interface FeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  badge?: string;
  onClick?: () => void;
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon,
  badge,
  onClick,
  className = ''
}) => {
  return (
    <AdvancedCard 
      className={`${className}`} 
      onClick={onClick}
      interactive
      hover
      scale
      glow
    >
      <div className="text-center">
        {icon && (
          <div className="mx-auto mb-4 p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full w-fit">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">{description}</p>
        {badge && (
          <span className="inline-block px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs rounded-full">
            {badge}
          </span>
        )}
      </div>
    </AdvancedCard>
  );
};

export default AdvancedCard;
