import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showToast?: boolean;
  level?: 'page' | 'component' | 'section';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Hata loglama
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Toast bildirimi
    if (this.props.showToast !== false) {
      toast.error('Beklenmeyen bir hata oluştu');
    }

    // Özel hata işleme
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Hata raporlama (gelecekte Sentry gibi servislere gönderilebilir)
    this.reportError(error, errorInfo);
  }

  reportError = (error: Error, errorInfo: ErrorInfo) => {
    // Hata raporlama servisi
    const errorReport = {
      errorId: this.state.errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // localStorage'a kaydet (geliştirme için)
    try {
      const existingErrors = JSON.parse(localStorage.getItem('errorReports') || '[]');
      existingErrors.push(errorReport);
      localStorage.setItem('errorReports', JSON.stringify(existingErrors.slice(-10))); // Son 10 hatayı sakla
    } catch (e) {
      console.error('Error report could not be saved:', e);
    }
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Özel fallback varsa onu kullan
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Level'a göre farklı UI'lar
      const { level = 'component' } = this.props;

      if (level === 'page') {
        return this.renderPageError();
      } else if (level === 'section') {
        return this.renderSectionError();
      } else {
        return this.renderComponentError();
      }
    }

    return this.props.children;
  }

  renderPageError = () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Bir Hata Oluştu
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Sayfa yüklenirken beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.
        </p>

        {process.env.NODE_ENV === 'development' && this.state.error && (
          <details className="mb-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 dark:text-gray-400 mb-2">
              Hata Detayları (Geliştirme)
            </summary>
            <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto">
              <div className="mb-2">
                <strong>Hata ID:</strong> {this.state.errorId}
              </div>
              <div className="mb-2">
                <strong>Mesaj:</strong> {this.state.error.message}
              </div>
              {this.state.error.stack && (
                <div>
                  <strong>Stack:</strong>
                  <pre className="whitespace-pre-wrap mt-1">{this.state.error.stack}</pre>
                </div>
              )}
            </div>
          </details>
        )}

        <div className="space-y-3">
          <button
            onClick={this.handleRetry}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Tekrar Dene</span>
          </button>
          
          <button
            onClick={this.handleReload}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sayfayı Yenile</span>
          </button>
          
          <button
            onClick={this.handleGoHome}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Home className="w-4 h-4" />
            <span>Ana Sayfaya Dön</span>
          </button>
        </div>
      </div>
    </div>
  );

  renderSectionError = () => (
    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-6">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
            Bu bölümde bir hata oluştu
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 mb-3">
            Veriler yüklenirken bir sorun yaşandı. Lütfen tekrar deneyin.
          </p>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center space-x-1 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Tekrar Dene</span>
          </button>
        </div>
      </div>
    </div>
  );

  renderComponentError = () => (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
        <Bug className="w-4 h-4" />
        <span className="text-sm">Bileşen yüklenemedi</span>
        <button
          onClick={this.handleRetry}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Tekrar dene
        </button>
      </div>
    </div>
  );
}

// HOC olarak kullanım için
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Global error handler
export const setupGlobalErrorHandler = () => {
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    toast.error('Beklenmeyen bir hata oluştu');
  });

  // Global JavaScript errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    toast.error('Sistem hatası oluştu');
  });
};

export default ErrorBoundary;
