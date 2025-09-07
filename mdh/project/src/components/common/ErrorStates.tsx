import React from 'react';
import { 
  AlertCircle, 
  WifiOff, 
  Search, 
  FileX, 
  Users, 
  Database, 
  Server, 
  Shield, 
  RefreshCw,
  Plus,
  Settings,
  HelpCircle
} from 'lucide-react';
import AdvancedButton from './AdvancedButton';

export interface ErrorStateProps {
  type?: 'error' | 'network' | 'notFound' | 'unauthorized' | 'server' | 'maintenance' | 'timeout';
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  showIcon?: boolean;
  animated?: boolean;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'error',
  title,
  message,
  action,
  secondaryAction,
  className = '',
  showIcon = true,
  animated = true
}) => {
  const getErrorConfig = () => {
    const configs = {
      error: {
        icon: <AlertCircle className="w-16 h-16 text-red-500" />,
        title: title || 'Bir Hata Oluştu',
        message: message || 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.',
        actionLabel: 'Tekrar Dene',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800'
      },
      network: {
        icon: <WifiOff className="w-16 h-16 text-orange-500" />,
        title: title || 'Bağlantı Hatası',
        message: message || 'İnternet bağlantınızı kontrol edin ve tekrar deneyin.',
        actionLabel: 'Tekrar Dene',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800'
      },
      notFound: {
        icon: <Search className="w-16 h-16 text-gray-500" />,
        title: title || 'Sonuç Bulunamadı',
        message: message || 'Aradığınız içerik bulunamadı.',
        actionLabel: 'Ana Sayfaya Dön',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        borderColor: 'border-gray-200 dark:border-gray-800'
      },
      unauthorized: {
        icon: <Shield className="w-16 h-16 text-yellow-500" />,
        title: title || 'Yetkisiz Erişim',
        message: message || 'Bu sayfaya erişim yetkiniz bulunmuyor.',
        actionLabel: 'Giriş Yap',
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800'
      },
      server: {
        icon: <Server className="w-16 h-16 text-red-500" />,
        title: title || 'Sunucu Hatası',
        message: message || 'Sunucu ile bağlantı kurulamadı. Lütfen daha sonra tekrar deneyin.',
        actionLabel: 'Tekrar Dene',
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800'
      },
      maintenance: {
        icon: <Settings className="w-16 h-16 text-blue-500" />,
        title: title || 'Bakım Modu',
        message: message || 'Sistem bakımda. Lütfen daha sonra tekrar deneyin.',
        actionLabel: 'Ana Sayfaya Dön',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800'
      },
      timeout: {
        icon: <RefreshCw className="w-16 h-16 text-purple-500" />,
        title: title || 'Zaman Aşımı',
        message: message || 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.',
        actionLabel: 'Tekrar Dene',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        borderColor: 'border-purple-200 dark:border-purple-800'
      }
    };
    
    return configs[type];
  };

  const config = getErrorConfig();

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className={`
        max-w-md w-full p-8 rounded-xl border-2
        ${config.bgColor} ${config.borderColor}
        ${animated ? 'animate-fade-in' : ''}
      `}>
        {/* Icon */}
        {showIcon && (
          <div className={`flex justify-center mb-6 ${animated ? 'animate-bounce' : ''}`}>
            {config.icon}
          </div>
        )}
        
        {/* Title */}
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 text-center">
          {config.title}
        </h3>
        
        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 text-center mb-6 leading-relaxed">
          {config.message}
        </p>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {action && (
            <AdvancedButton
              onClick={action.onClick}
              variant="primary"
              gradient
              ripple
              glow
              className="w-full sm:w-auto"
            >
              {action.label}
            </AdvancedButton>
          )}
          
          {secondaryAction && (
            <AdvancedButton
              onClick={secondaryAction.onClick}
              variant="ghost"
              className="w-full sm:w-auto"
            >
              {secondaryAction.label}
            </AdvancedButton>
          )}
        </div>
      </div>
    </div>
  );
};

// Empty State Component
export interface EmptyStateProps {
  type?: 'default' | 'search' | 'projects' | 'users' | 'data' | 'files' | 'messages';
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  showIcon?: boolean;
  animated?: boolean;
  illustration?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'default',
  title,
  message,
  action,
  secondaryAction,
  className = '',
  showIcon = true,
  animated = true,
  illustration
}) => {
  const getEmptyConfig = () => {
    const configs = {
      default: {
        icon: <FileX className="w-16 h-16 text-gray-400" />,
        title: title || 'Henüz İçerik Yok',
        message: message || 'Bu alanda henüz hiçbir içerik bulunmuyor.',
        actionLabel: 'İçerik Ekle',
        bgColor: 'bg-gray-50 dark:bg-gray-900/20',
        borderColor: 'border-gray-200 dark:border-gray-800'
      },
      search: {
        icon: <Search className="w-16 h-16 text-blue-400" />,
        title: title || 'Arama Sonucu Bulunamadı',
        message: message || 'Arama kriterlerinize uygun sonuç bulunamadı.',
        actionLabel: 'Aramayı Temizle',
        bgColor: 'bg-blue-50 dark:bg-blue-900/20',
        borderColor: 'border-blue-200 dark:border-blue-800'
      },
      projects: {
        icon: <Plus className="w-16 h-16 text-green-400" />,
        title: title || 'Henüz Proje Yok',
        message: message || 'İlk projenizi oluşturarak başlayın ve projelerinizi yönetmeye başlayın.',
        actionLabel: 'İlk Projeyi Oluştur',
        bgColor: 'bg-green-50 dark:bg-green-900/20',
        borderColor: 'border-green-200 dark:border-green-800'
      },
      users: {
        icon: <Users className="w-16 h-16 text-purple-400" />,
        title: title || 'Henüz Kullanıcı Yok',
        message: message || 'Takımınıza ilk kullanıcıyı ekleyerek başlayın.',
        actionLabel: 'Kullanıcı Ekle',
        bgColor: 'bg-purple-50 dark:bg-purple-900/20',
        borderColor: 'border-purple-200 dark:border-purple-800'
      },
      data: {
        icon: <Database className="w-16 h-16 text-indigo-400" />,
        title: title || 'Veri Bulunamadı',
        message: message || 'Bu alanda henüz hiçbir veri bulunmuyor.',
        actionLabel: 'Veri Ekle',
        bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
        borderColor: 'border-indigo-200 dark:border-indigo-800'
      },
      files: {
        icon: <FileX className="w-16 h-16 text-orange-400" />,
        title: title || 'Dosya Bulunamadı',
        message: message || 'Bu klasörde henüz hiçbir dosya bulunmuyor.',
        actionLabel: 'Dosya Yükle',
        bgColor: 'bg-orange-50 dark:bg-orange-900/20',
        borderColor: 'border-orange-200 dark:border-orange-800'
      },
      messages: {
        icon: <HelpCircle className="w-16 h-16 text-pink-400" />,
        title: title || 'Mesaj Bulunamadı',
        message: message || 'Henüz hiçbir mesaj bulunmuyor.',
        actionLabel: 'Mesaj Gönder',
        bgColor: 'bg-pink-50 dark:bg-pink-900/20',
        borderColor: 'border-pink-200 dark:border-pink-800'
      }
    };
    
    return configs[type];
  };

  const config = getEmptyConfig();

  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 ${className}`}>
      <div className={`
        max-w-md w-full text-center
        ${animated ? 'animate-fade-in' : ''}
      `}>
        {/* Illustration or Icon */}
        {illustration ? (
          <div className={`mb-8 ${animated ? 'animate-float' : ''}`}>
            {illustration}
          </div>
        ) : showIcon && (
          <div className={`relative mb-8 ${animated ? 'animate-float' : ''}`}>
            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-full flex items-center justify-center mx-auto">
              {config.icon}
            </div>
            {type === 'projects' && (
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                <Plus className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        )}
        
        {/* Title */}
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {config.title}
        </h3>
        
        {/* Message */}
        <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed max-w-sm mx-auto">
          {config.message}
        </p>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {action && (
            <AdvancedButton
              onClick={action.onClick}
              variant="primary"
              gradient
              ripple
              glow
              icon={<Plus className="w-5 h-5" />}
              iconPosition="left"
              className="w-full sm:w-auto"
            >
              {action.label}
            </AdvancedButton>
          )}
          
          {secondaryAction && (
            <AdvancedButton
              onClick={secondaryAction.onClick}
              variant="ghost"
              className="w-full sm:w-auto"
            >
              {secondaryAction.label}
            </AdvancedButton>
          )}
        </div>
      </div>
    </div>
  );
};

// Loading State Component
export interface LoadingStateProps {
  message?: string;
  progress?: number;
  type?: 'spinner' | 'dots' | 'pulse' | 'skeleton';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Yükleniyor...',
  progress,
  type = 'spinner',
  size = 'md',
  className = ''
}) => {
  const getSizeClasses = () => {
    const sizes = {
      sm: 'w-4 h-4',
      md: 'w-8 h-8',
      lg: 'w-12 h-12'
    };
    return sizes[size];
  };

  const renderLoader = () => {
    switch (type) {
      case 'spinner':
        return (
          <div className={`${getSizeClasses()} border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin`}></div>
        );
      case 'dots':
        return (
          <div className="flex space-x-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className={`${size === 'sm' ? 'w-2 h-2' : size === 'md' ? 'w-3 h-3' : 'w-4 h-4'} bg-blue-600 rounded-full animate-bounce`}
                style={{ animationDelay: `${i * 0.1}s` }}
              ></div>
            ))}
          </div>
        );
      case 'pulse':
        return (
          <div className={`${getSizeClasses()} bg-blue-600 rounded-full animate-pulse`}></div>
        );
      case 'skeleton':
        return (
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2"></div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="text-center">
        {renderLoader()}
        {message && (
          <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">{message}</p>
        )}
        {progress !== undefined && (
          <div className="mt-4 w-48 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        )}
      </div>
    </div>
  );
};

export { ErrorState, EmptyState, LoadingState };
export default ErrorState;
