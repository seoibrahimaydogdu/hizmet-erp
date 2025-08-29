import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface ErrorState {
  hasError: boolean;
  error: Error | null;
  errorId: string | null;
  retryCount: number;
}

interface ErrorHandlerOptions {
  showToast?: boolean;
  toastMessage?: string;
  maxRetries?: number;
  onError?: (error: Error) => void;
  onRetry?: () => void;
}

export const useErrorHandler = (options: ErrorHandlerOptions = {}) => {
  const {
    showToast = true,
    toastMessage,
    maxRetries = 3,
    onError,
    onRetry
  } = options;

  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorId: null,
    retryCount: 0
  });

  const generateErrorId = useCallback(() => {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const handleError = useCallback((error: Error, context?: string) => {
    const errorId = generateErrorId();
    
    setErrorState({
      hasError: true,
      error,
      errorId,
      retryCount: errorState.retryCount
    });

    // Log error
    console.error(`Error in ${context || 'unknown context'}:`, error);

    // Show toast if enabled
    if (showToast) {
      const message = toastMessage || getErrorMessage(error);
      toast.error(message);
    }

    // Call custom error handler
    if (onError) {
      onError(error);
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      logErrorToService(error, errorId, context);
    }
  }, [showToast, toastMessage, onError, errorState.retryCount, generateErrorId]);

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorId: null,
      retryCount: 0
    });
  }, []);

  const retry = useCallback(async (operation: () => Promise<any>) => {
    if (errorState.retryCount >= maxRetries) {
      toast.error(`Maksimum deneme sayısına ulaşıldı (${maxRetries})`);
      return;
    }

    setErrorState(prev => ({
      ...prev,
      retryCount: prev.retryCount + 1
    }));

    try {
      clearError();
      if (onRetry) {
        onRetry();
      }
      await operation();
    } catch (error) {
      handleError(error as Error, 'retry operation');
    }
  }, [errorState.retryCount, maxRetries, clearError, onRetry, handleError]);

  const withErrorHandling = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: string
  ): Promise<T | null> => {
    try {
      clearError();
      return await operation();
    } catch (error) {
      handleError(error as Error, context);
      return null;
    }
  }, [clearError, handleError]);

  return {
    errorState,
    handleError,
    clearError,
    retry,
    withErrorHandling
  };
};

// Helper function to get user-friendly error messages
const getErrorMessage = (error: Error): string => {
  // Network errors
  if (error.name === 'NetworkError' || error.message.includes('fetch')) {
    return 'İnternet bağlantısı sorunu. Lütfen bağlantınızı kontrol edin.';
  }

  // Timeout errors
  if (error.message.includes('timeout') || error.message.includes('timed out')) {
    return 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.';
  }

  // Authentication errors
  if (error.message.includes('401') || error.message.includes('unauthorized')) {
    return 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.';
  }

  // Permission errors
  if (error.message.includes('403') || error.message.includes('forbidden')) {
    return 'Bu işlem için yetkiniz bulunmuyor.';
  }

  // Server errors
  if (error.message.includes('500') || error.message.includes('server')) {
    return 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';
  }

  // Database errors
  if (error.message.includes('database') || error.message.includes('db')) {
    return 'Veritabanı hatası oluştu. Lütfen daha sonra tekrar deneyin.';
  }

  // Validation errors
  if (error.message.includes('validation') || error.message.includes('invalid')) {
    return 'Girilen bilgiler geçersiz. Lütfen kontrol edin.';
  }

  // Default error message
  return 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
};

// Helper function to log errors to external service
const logErrorToService = (error: Error, errorId: string, context?: string) => {
  const errorData = {
    errorId,
    message: error.message,
    name: error.name,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
    userId: getCurrentUserId() // You'll need to implement this
  };

  // Send to your error logging service
  // Example: Sentry, LogRocket, or your own API
  fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(errorData)
  }).catch(console.error); // Don't let error logging fail
};

// Helper function to get current user ID (implement based on your auth system)
const getCurrentUserId = (): string | null => {
  // Implement based on your authentication system
  // Example: return localStorage.getItem('userId');
  return null;
};

// Specific error handlers for common operations
export const useApiErrorHandler = () => {
  return useErrorHandler({
    showToast: true,
    maxRetries: 2,
    onError: (error) => {
      console.error('API Error:', error);
    }
  });
};

export const useFormErrorHandler = () => {
  return useErrorHandler({
    showToast: true,
    maxRetries: 0, // Don't retry form submissions automatically
    onError: (error) => {
      console.error('Form Error:', error);
    }
  });
};

export const useFileUploadErrorHandler = () => {
  return useErrorHandler({
    showToast: true,
    maxRetries: 1,
    toastMessage: 'Dosya yükleme hatası. Lütfen tekrar deneyin.',
    onError: (error) => {
      console.error('File Upload Error:', error);
    }
  });
};

// Error boundary hook for functional components
export const useErrorBoundary = () => {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((error: Error) => {
    setError(error);
    console.error('Error boundary caught error:', error);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    resetError,
    hasError: !!error
  };
};
