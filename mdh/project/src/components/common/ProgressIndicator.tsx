import React from 'react';
import { Loader2, CheckCircle, AlertCircle, Clock } from 'lucide-react';

interface ProgressIndicatorProps {
  progress: number; // 0-100 arası
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spinner' | 'bar' | 'circular' | 'steps';
  showPercentage?: boolean;
  animated?: boolean;
  className?: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  progress,
  message,
  size = 'md',
  variant = 'spinner',
  showPercentage = true,
  animated = true,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  if (variant === 'spinner') {
    return (
      <div className={`flex flex-col items-center space-y-2 ${className}`}>
        <Loader2 className={`${sizeClasses[size]} text-blue-600 ${animated ? 'animate-spin' : ''}`} />
        {message && (
          <p className={`${textSizeClasses[size]} text-gray-600 dark:text-gray-400 text-center`}>
            {message}
          </p>
        )}
        {showPercentage && (
          <p className={`${textSizeClasses[size]} text-gray-500 dark:text-gray-500 font-medium`}>
            {Math.round(progress)}%
          </p>
        )}
      </div>
    );
  }

  if (variant === 'bar') {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center justify-between mb-2">
          {message && (
            <span className={`${textSizeClasses[size]} text-gray-600 dark:text-gray-400`}>
              {message}
            </span>
          )}
          {showPercentage && (
            <span className={`${textSizeClasses[size]} text-gray-500 dark:text-gray-500 font-medium`}>
              {Math.round(progress)}%
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-2 bg-blue-600 transition-all duration-300 ease-out ${
              animated ? 'animate-pulse' : ''
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      </div>
    );
  }

  if (variant === 'circular') {
    const radius = size === 'sm' ? 16 : size === 'md' ? 24 : 32;
    const strokeWidth = size === 'sm' ? 2 : size === 'md' ? 3 : 4;
    const normalizedRadius = radius - strokeWidth * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className={`flex flex-col items-center space-y-2 ${className}`}>
        <div className="relative">
          <svg
            height={radius * 2}
            width={radius * 2}
            className="transform -rotate-90"
          >
            <circle
              stroke="currentColor"
              fill="transparent"
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDasharray}
              style={{ strokeDashoffset }}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="text-blue-600 transition-all duration-300 ease-out"
            />
            <circle
              stroke="currentColor"
              fill="transparent"
              strokeWidth={strokeWidth}
              r={normalizedRadius}
              cx={radius}
              cy={radius}
              className="text-gray-200 dark:text-gray-700"
            />
          </svg>
          {showPercentage && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`${textSizeClasses[size]} font-medium text-gray-600 dark:text-gray-400`}>
                {Math.round(progress)}%
              </span>
            </div>
          )}
        </div>
        {message && (
          <p className={`${textSizeClasses[size]} text-gray-600 dark:text-gray-400 text-center`}>
            {message}
          </p>
        )}
      </div>
    );
  }

  return null;
};

// Adım bazlı progress indicator
interface StepProgressProps {
  steps: Array<{
    id: string;
    title: string;
    description?: string;
    status: 'pending' | 'current' | 'completed' | 'error';
  }>;
  currentStep?: number;
  className?: string;
}

export const StepProgress: React.FC<StepProgressProps> = ({
  steps,
  currentStep = 0,
  className = ''
}) => {
  const getStepIcon = (status: string, index: number) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'current':
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return (
          <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">{index + 1}</span>
          </div>
        );
    }
  };

  const getStepClasses = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 dark:text-green-400';
      case 'current':
        return 'text-blue-600 dark:text-blue-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            {getStepIcon(step.status, index)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`text-sm font-medium ${getStepClasses(step.status)}`}>
              {step.title}
            </h3>
            {step.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {step.description}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Loading overlay
interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
  children: React.ReactNode;
  className?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  message = 'Yükleniyor...',
  progress,
  children,
  className = ''
}) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div className={`relative ${className}`}>
      {children}
      <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-200 dark:border-gray-700">
          <ProgressIndicator
            progress={progress || 0}
            message={message}
            variant="spinner"
            size="lg"
          />
        </div>
      </div>
    </div>
  );
};

// Inline loading
interface InlineLoadingProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  isLoading,
  message = 'Yükleniyor...',
  children,
  className = ''
}) => {
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <ProgressIndicator
          progress={0}
          message={message}
          variant="spinner"
          size="md"
          showPercentage={false}
        />
      </div>
    );
  }

  return <>{children}</>;
};

// Skeleton loading
interface SkeletonLoadingProps {
  isLoading: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SkeletonLoading: React.FC<SkeletonLoadingProps> = ({
  isLoading,
  skeleton,
  children,
  className = ''
}) => {
  if (isLoading) {
    return <div className={className}>{skeleton}</div>;
  }

  return <>{children}</>;
};

export default {
  ProgressIndicator,
  StepProgress,
  LoadingOverlay,
  InlineLoading,
  SkeletonLoading
};
