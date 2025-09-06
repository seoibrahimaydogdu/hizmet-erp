import React, { useState, useEffect, useRef, ReactNode, KeyboardEvent } from 'react';
import { useAnimation } from './AnimationSystem';
import { 
  Type, TypeOff,
  MousePointer, MousePointerOff, Keyboard, KeyboardOff,
  Contrast, ContrastOff, RotateCcw, X
} from 'lucide-react';

// Accessibility Features
export interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  screenReader: boolean;
  keyboardNavigation: boolean;
  focusIndicators: boolean;
  colorBlindSupport: boolean;
  fontSize: 'small' | 'medium' | 'large' | 'xlarge';
  colorScheme: 'normal' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'monochrome';
  zoomLevel: number;
  autoFocus: boolean;
  skipLinks: boolean;
  ariaLabels: boolean;
  liveRegions: boolean;
}

// Focus Management Hook
export const useFocusManagement = () => {
  const [focusHistory, setFocusHistory] = useState<HTMLElement[]>([]);
  const [currentFocus, setCurrentFocus] = useState<HTMLElement | null>(null);
  const [isTrapped, setIsTrapped] = useState(false);
  const trapRef = useRef<HTMLElement | null>(null);

  const addToHistory = (element: HTMLElement) => {
    setFocusHistory(prev => [...prev, element]);
    setCurrentFocus(element);
  };

  const goBack = () => {
    if (focusHistory.length > 1) {
      const previousElement = focusHistory[focusHistory.length - 2];
      previousElement?.focus();
      setFocusHistory(prev => prev.slice(0, -1));
      setCurrentFocus(previousElement);
    }
  };

  const trapFocus = (element: HTMLElement) => {
    trapRef.current = element;
    setIsTrapped(true);
    
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
  };

  const releaseFocus = () => {
    setIsTrapped(false);
    trapRef.current = null;
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Tab' && isTrapped && trapRef.current) {
      const focusableElements = Array.from(
        trapRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ) as HTMLElement[];

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    }
  };

  return {
    focusHistory,
    currentFocus,
    isTrapped,
    addToHistory,
    goBack,
    trapFocus,
    releaseFocus,
    handleKeyDown
  };
};

// Screen Reader Hook
export const useScreenReader = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if screen reader is detected
    const checkScreenReader = () => {
      const hasScreenReader = 
        window.speechSynthesis ||
        navigator.userAgent.includes('NVDA') ||
        navigator.userAgent.includes('JAWS') ||
        navigator.userAgent.includes('VoiceOver');
      
      setIsEnabled(hasScreenReader);
    };

    checkScreenReader();
  }, []);

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (isEnabled) {
      setAnnouncements(prev => [...prev, message]);
      
      // Clear announcement after a delay
      setTimeout(() => {
        setAnnouncements(prev => prev.slice(1));
      }, 1000);
    }
  };

  const speak = (text: string, rate = 1, pitch = 1) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = rate;
      utterance.pitch = pitch;
      speechSynthesis.speak(utterance);
    }
  };

  return {
    isEnabled,
    announce,
    speak,
    announcements,
    liveRegionRef
  };
};

// Accessibility Provider Component
interface AccessibilityProviderProps {
  children: ReactNode;
  settings?: Partial<AccessibilitySettings>;
}

export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({
  children,
  settings: initialSettings
}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reducedMotion: false,
    screenReader: false,
    keyboardNavigation: true,
    focusIndicators: true,
    colorBlindSupport: false,
    fontSize: 'medium',
    colorScheme: 'normal',
    zoomLevel: 100,
    autoFocus: false,
    skipLinks: true,
    ariaLabels: true,
    liveRegions: true,
    ...initialSettings
  });

  const { announce } = useScreenReader();

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    // Large text
    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }

    // Reduced motion
    if (settings.reducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }

    // Font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px',
      xlarge: '20px'
    };
    root.style.setProperty('--font-size', fontSizeMap[settings.fontSize]);

    // Color scheme
    root.setAttribute('data-color-scheme', settings.colorScheme);

    // Zoom level
    root.style.setProperty('--zoom-level', `${settings.zoomLevel}%`);

    // Focus indicators
    if (settings.focusIndicators) {
      root.classList.add('focus-indicators');
    } else {
      root.classList.remove('focus-indicators');
    }

    // Keyboard navigation
    if (settings.keyboardNavigation) {
      root.classList.add('keyboard-navigation');
    } else {
      root.classList.remove('keyboard-navigation');
    }

    // Announce changes
    announce('Erişilebilirlik ayarları güncellendi');
  }, [settings, announce]);

  const updateSettings = (newSettings: Partial<AccessibilitySettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings({
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      screenReader: false,
      keyboardNavigation: true,
      focusIndicators: true,
      colorBlindSupport: false,
      fontSize: 'medium',
      colorScheme: 'normal',
      zoomLevel: 100,
      autoFocus: false,
      skipLinks: true,
      ariaLabels: true,
      liveRegions: true
    });
  };

  return (
    <AccessibilityContext.Provider value={{
      settings,
      updateSettings,
      resetSettings
    }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

const AccessibilityContext = React.createContext<{
  settings: AccessibilitySettings;
  updateSettings: (settings: Partial<AccessibilitySettings>) => void;
  resetSettings: () => void;
} | undefined>(undefined);

export const useAccessibility = () => {
  const context = React.useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};

// Skip Links Component
export const SkipLinks: React.FC<{ links: { href: string; label: string }[] }> = ({ links }) => {
  const { settings } = useAccessibility();

  if (!settings.skipLinks) return null;

  return (
    <div className="skip-links">
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="skip-link"
          onFocus={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.opacity = '1';
          }}
          onBlur={(e) => {
            e.currentTarget.style.transform = 'translateY(-100%)';
            e.currentTarget.style.opacity = '0';
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
};

// Focus Trap Component
interface FocusTrapProps {
  children: ReactNode;
  active: boolean;
  onEscape?: () => void;
  className?: string;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  active,
  onEscape,
  className = ''
}) => {
  const { handleKeyDown } = useFocusManagement();
  const trapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (active && trapRef.current) {
      const focusableElements = trapRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [active]);

  const handleKeyDownWithEscape = (e: KeyboardEvent) => {
    handleKeyDown(e);
    
    if (e.key === 'Escape' && onEscape) {
      onEscape();
    }
  };

  if (!active) return <>{children}</>;

  return (
    <div
      ref={trapRef}
      className={className}
      onKeyDown={handleKeyDownWithEscape}
      tabIndex={-1}
    >
      {children}
    </div>
  );
};

// Accessibility Panel Component
interface AccessibilityPanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export const AccessibilityPanel: React.FC<AccessibilityPanelProps> = ({
  isOpen,
  onClose,
  className = ''
}) => {
  const { settings, updateSettings, resetSettings } = useAccessibility();
  const { addAnimation } = useAnimation();

  if (!isOpen) return null;

  const handleToggle = (key: keyof AccessibilitySettings) => {
    updateSettings({ [key]: !settings[key] });
    addAnimation('accessibility-toggle', {
      type: 'scaleIn',
      duration: 'fast',
      easing: 'bounce'
    });
  };

  const handleSliderChange = (key: keyof AccessibilitySettings, value: any) => {
    updateSettings({ [key]: value });
  };

  return (
    <div className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-strong border border-gray-200 dark:border-gray-700 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Erişilebilirlik Ayarları
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Settings */}
        <div className="space-y-6">
          {/* Visual Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Görsel Ayarlar
            </h3>
            
            <div className="space-y-4">
              {/* High Contrast */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {settings.highContrast ? <Contrast className="w-5 h-5 text-primary-600" /> : <ContrastOff className="w-5 h-5 text-gray-400" />}
                  <span className="text-gray-700 dark:text-gray-300">Yüksek Kontrast</span>
                </div>
                <button
                  onClick={() => handleToggle('highContrast')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.highContrast ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.highContrast ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Large Text */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {settings.largeText ? <Type className="w-5 h-5 text-primary-600" /> : <TypeOff className="w-5 h-5 text-gray-400" />}
                  <span className="text-gray-700 dark:text-gray-300">Büyük Metin</span>
                </div>
                <button
                  onClick={() => handleToggle('largeText')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.largeText ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.largeText ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Font Boyutu
                </label>
                <select
                  value={settings.fontSize}
                  onChange={(e) => handleSliderChange('fontSize', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="small">Küçük</option>
                  <option value="medium">Orta</option>
                  <option value="large">Büyük</option>
                  <option value="xlarge">Çok Büyük</option>
                </select>
              </div>

              {/* Zoom Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Yakınlaştırma: {settings.zoomLevel}%
                </label>
                <input
                  type="range"
                  min="75"
                  max="200"
                  step="25"
                  value={settings.zoomLevel}
                  onChange={(e) => handleSliderChange('zoomLevel', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Interaction Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Etkileşim Ayarları
            </h3>
            
            <div className="space-y-4">
              {/* Reduced Motion */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {settings.reducedMotion ? <RotateCcw className="w-5 h-5 text-primary-600" /> : <RotateCcw className="w-5 h-5 text-gray-400" />}
                  <span className="text-gray-700 dark:text-gray-300">Azaltılmış Hareket</span>
                </div>
                <button
                  onClick={() => handleToggle('reducedMotion')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.reducedMotion ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.reducedMotion ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Keyboard Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {settings.keyboardNavigation ? <Keyboard className="w-5 h-5 text-primary-600" /> : <KeyboardOff className="w-5 h-5 text-gray-400" />}
                  <span className="text-gray-700 dark:text-gray-300">Klavye Navigasyonu</span>
                </div>
                <button
                  onClick={() => handleToggle('keyboardNavigation')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.keyboardNavigation ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.keyboardNavigation ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              {/* Focus Indicators */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {settings.focusIndicators ? <MousePointer className="w-5 h-5 text-primary-600" /> : <MousePointerOff className="w-5 h-5 text-gray-400" />}
                  <span className="text-gray-700 dark:text-gray-300">Odak Göstergeleri</span>
                </div>
                <button
                  onClick={() => handleToggle('focusIndicators')}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.focusIndicators ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.focusIndicators ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>
            </div>
          </div>

          {/* Color Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Renk Ayarları
            </h3>
            
            <div className="space-y-4">
              {/* Color Scheme */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Renk Şeması
                </label>
                <select
                  value={settings.colorScheme}
                  onChange={(e) => handleSliderChange('colorScheme', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                >
                  <option value="normal">Normal</option>
                  <option value="protanopia">Protanopia</option>
                  <option value="deuteranopia">Deuteranopia</option>
                  <option value="tritanopia">Tritanopia</option>
                  <option value="monochrome">Monokrom</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={resetSettings}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Sıfırla
          </button>
          
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Tamam
          </button>
        </div>
      </div>
    </div>
  );
};

// Live Region Component
interface LiveRegionProps {
  children: ReactNode;
  level: 'polite' | 'assertive';
  className?: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  children,
  level = 'polite',
  className = ''
}) => {
  const { settings } = useAccessibility();

  if (!settings.liveRegions) return null;

  return (
    <div
      className={`sr-only ${className}`}
      aria-live={level}
      aria-atomic="true"
    >
      {children}
    </div>
  );
};

export default AccessibilityProvider;
