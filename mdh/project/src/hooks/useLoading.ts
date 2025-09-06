import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingHook {
  loading: LoadingState;
  isLoading: (key: string) => boolean;
  setLoading: (key: string, value: boolean) => void;
  executeWithLoading: <T>(
    key: string, 
    operation: () => Promise<T>,
    options?: {
      successMessage?: string;
      errorMessage?: string;
      showToast?: boolean;
    }
  ) => Promise<T | null>;
  executeMultipleWithLoading: <T>(
    operations: Array<{
      key: string;
      operation: () => Promise<T>;
      successMessage?: string;
      errorMessage?: string;
    }>
  ) => Promise<Array<T | null>>;
}

export const useLoading = (): LoadingHook => {
  const [loading, setLoadingState] = useState<LoadingState>({});

  const isLoading = useCallback((key: string): boolean => {
    return loading[key] || false;
  }, [loading]);

  const setLoading = useCallback((key: string, value: boolean) => {
    setLoadingState(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const executeWithLoading = useCallback(async <T>(
    key: string,
    operation: () => Promise<T>,
    options: {
      successMessage?: string;
      errorMessage?: string;
      showToast?: boolean;
    } = {}
  ): Promise<T | null> => {
    const { successMessage, errorMessage, showToast = true } = options;
    
    setLoading(key, true);
    
    try {
      const result = await operation();
      
      if (successMessage && showToast) {
        toast.success(successMessage);
      }
      
      return result;
    } catch (error) {
      const message = errorMessage || (error instanceof Error ? error.message : 'Bir hata oluştu');
      
      if (showToast) {
        toast.error(message);
      }
      
      console.error(`Error in ${key}:`, error);
      return null;
    } finally {
      setLoading(key, false);
    }
  }, [setLoading]);

  const executeMultipleWithLoading = useCallback(async <T>(
    operations: Array<{
      key: string;
      operation: () => Promise<T>;
      successMessage?: string;
      errorMessage?: string;
    }>
  ): Promise<Array<T | null>> => {
    const results: Array<T | null> = [];
    
    for (const { key, operation, successMessage, errorMessage } of operations) {
      const result = await executeWithLoading(key, operation, {
        successMessage,
        errorMessage,
        showToast: false // Toplu işlemlerde toast gösterme
      });
      results.push(result);
    }
    
    // Toplu işlem sonucu için genel toast
    const successCount = results.filter(r => r !== null).length;
    const totalCount = operations.length;
    
    if (successCount === totalCount) {
      toast.success(`${totalCount} işlem başarıyla tamamlandı`);
    } else if (successCount > 0) {
      toast.error(`${totalCount - successCount} işlem başarısız oldu`);
    } else {
      toast.error('Tüm işlemler başarısız oldu');
    }
    
    return results;
  }, [executeWithLoading]);

  return {
    loading,
    isLoading,
    setLoading,
    executeWithLoading,
    executeMultipleWithLoading
  };
};

// Özel loading hook'ları
export const useAsyncOperation = () => {
  const { executeWithLoading, isLoading } = useLoading();
  
  const execute = useCallback(async <T>(
    key: string,
    operation: () => Promise<T>,
    options?: {
      successMessage?: string;
      errorMessage?: string;
      showToast?: boolean;
    }
  ) => {
    return executeWithLoading(key, operation, options);
  }, [executeWithLoading]);
  
  return {
    execute,
    isLoading
  };
};

// Retry mekanizması ile loading hook'u
export const useRetryableLoading = () => {
  const { executeWithLoading, isLoading } = useLoading();
  
  const executeWithRetry = useCallback(async <T>(
    key: string,
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      retryDelay?: number;
      successMessage?: string;
      errorMessage?: string;
      showToast?: boolean;
    } = {}
  ): Promise<T | null> => {
    const { 
      maxRetries = 3, 
      retryDelay = 1000, 
      successMessage, 
      errorMessage, 
      showToast = true 
    } = options;
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        setLoading(key, true);
        const result = await operation();
        
        if (successMessage && showToast) {
          toast.success(successMessage);
        }
        
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Bilinmeyen hata');
        
        if (attempt < maxRetries) {
          // Retry delay
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
          continue;
        }
      } finally {
        setLoading(key, false);
      }
    }
    
    // Tüm denemeler başarısız
    const message = errorMessage || lastError?.message || 'İşlem başarısız oldu';
    
    if (showToast) {
      toast.error(`${message} (${maxRetries} deneme yapıldı)`);
    }
    
    return null;
  }, []);
  
  return {
    executeWithRetry,
    isLoading
  };
};

// Progress tracking ile loading hook'u
export const useProgressLoading = () => {
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const { executeWithLoading, isLoading } = useLoading();
  
  const executeWithProgress = useCallback(async <T>(
    key: string,
    operation: (updateProgress: (progress: number, message: string) => void) => Promise<T>,
    options: {
      successMessage?: string;
      errorMessage?: string;
      showToast?: boolean;
    } = {}
  ): Promise<T | null> => {
    setProgress(0);
    setProgressMessage('Başlatılıyor...');
    
    const updateProgress = (newProgress: number, message: string) => {
      setProgress(newProgress);
      setProgressMessage(message);
    };
    
    return executeWithLoading(key, () => operation(updateProgress), options);
  }, [executeWithLoading]);
  
  return {
    executeWithProgress,
    isLoading,
    progress,
    progressMessage
  };
};

export default useLoading;
