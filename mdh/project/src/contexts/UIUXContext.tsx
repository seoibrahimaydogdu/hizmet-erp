import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabase } from '../hooks/useSupabase';

export interface UIUXSettings {
  // Layout Settings
  layout: 'default' | 'compact' | 'comfortable' | 'minimal';
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  messageSpacing: 'tight' | 'normal' | 'loose';
  
  // Visual Settings
  fontSize: 'small' | 'medium' | 'large';
  lineHeight: 'tight' | 'normal' | 'loose';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  shadows: 'none' | 'subtle' | 'medium' | 'strong';
  
  // Animation Settings
  animations: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  reducedMotion: boolean;
  
  // Color Settings
  accentColor: string;
  colorScheme: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'custom';
  customColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  
  // Typography Settings
  fontFamily: 'system' | 'inter' | 'roboto' | 'open-sans' | 'custom';
  customFont: string;
  fontWeight: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  
  // Accessibility Settings
  highContrast: boolean;
  largeText: boolean;
  focusIndicators: boolean;
  screenReader: boolean;
  
  // Performance Settings
  lazyLoading: boolean;
  virtualScrolling: boolean;
  imageOptimization: boolean;
  
  // Customization Settings
  customCSS: string;
  customJS: string;
}

export interface KeyboardShortcuts {
  [key: string]: {
    action: string;
    description: string;
    enabled: boolean;
  };
}

export interface UIUXState {
  // UI State
  isSidebarOpen: boolean;
  isSettingsOpen: boolean;
  isKeyboardShortcutsOpen: boolean;
  isCustomizationOpen: boolean;
  activeModal: string | null;
  
  // Animation State
  isAnimating: boolean;
  animationQueue: string[];
  
  // Responsive State
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  
  // Focus Management
  focusTrap: boolean;
  focusHistory: string[];
  
  // Loading States
  isLoading: boolean;
  loadingText: string;
  loadingProgress: number;
}

interface UIUXContextType {
  settings: UIUXSettings;
  state: UIUXState;
  keyboardShortcuts: KeyboardShortcuts;
  updateSettings: (settings: Partial<UIUXSettings>) => void;
  updateState: (state: Partial<UIUXState>) => void;
  updateKeyboardShortcuts: (shortcuts: Partial<KeyboardShortcuts>) => void;
  resetToDefaults: () => void;
  exportSettings: () => string;
  importSettings: (settings: string) => void;
  toggleSidebar: () => void;
  openModal: (modalName: string) => void;
  closeModal: () => void;
  addToAnimationQueue: (animation: string) => void;
  setLoading: (loading: boolean, text?: string) => void;
  updateLoadingProgress: (progress: number) => void;
  getResponsiveClass: (classes: { [key: string]: string }) => string;
  applyCustomCSS: (css: string) => void;
  applyCustomJS: (js: string) => void;
}

const UIUXContext = createContext<UIUXContextType | undefined>(undefined);

export const useUIUX = () => {
  const context = useContext(UIUXContext);
  if (context === undefined) {
    throw new Error('useUIUX must be used within a UIUXProvider');
  }
  return context;
};

interface UIUXProviderProps {
  children: React.ReactNode;
}

export const UIUXProvider: React.FC<UIUXProviderProps> = ({ children }) => {
  const { user, updateUIUXSettings, getUserPreferences } = useSupabase();
  
  const [settings, setSettings] = useState<UIUXSettings>(() => {
    const saved = localStorage.getItem('uiuxSettings');
    return saved ? JSON.parse(saved) : {
      layout: 'default',
      sidebarCollapsed: false,
      sidebarWidth: 320,
      messageSpacing: 'normal',
      fontSize: 'medium',
      lineHeight: 'normal',
      borderRadius: 'medium',
      shadows: 'subtle',
      animations: true,
      animationSpeed: 'normal',
      reducedMotion: false,
      accentColor: '#3b82f6',
      colorScheme: 'blue',
      customColors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        accent: '#8b5cf6'
      },
      fontFamily: 'system',
      customFont: '',
      fontWeight: 'normal',
      highContrast: false,
      largeText: false,
      focusIndicators: true,
      screenReader: false,
      lazyLoading: true,
      virtualScrolling: false,
      imageOptimization: true,
      customCSS: '',
      customJS: ''
    };
  });

  const [state, setState] = useState<UIUXState>({
    isSidebarOpen: true,
    isSettingsOpen: false,
    isKeyboardShortcutsOpen: false,
    isCustomizationOpen: false,
    activeModal: null,
    isAnimating: false,
    animationQueue: [],
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenSize: 'lg',
    focusTrap: false,
    focusHistory: [],
    isLoading: false,
    loadingText: '',
    loadingProgress: 0
  });

  const [keyboardShortcuts, setKeyboardShortcuts] = useState<KeyboardShortcuts>({
    'Ctrl+K': { action: 'openSearch', description: 'Arama aç', enabled: true },
    'Ctrl+N': { action: 'newMessage', description: 'Yeni mesaj', enabled: true },
    'Ctrl+Shift+N': { action: 'newChannel', description: 'Yeni kanal', enabled: true },
    'Ctrl+/': { action: 'toggleSidebar', description: 'Kenar çubuğunu aç/kapat', enabled: true },
    'Ctrl+Shift+S': { action: 'openSettings', description: 'Ayarları aç', enabled: true },
    'Ctrl+Shift+K': { action: 'openKeyboardShortcuts', description: 'Klavye kısayolları', enabled: true },
    'Escape': { action: 'closeModal', description: 'Modal kapat', enabled: true },
    'Ctrl+Shift+T': { action: 'toggleTheme', description: 'Tema değiştir', enabled: true },
    'Ctrl+Shift+F': { action: 'toggleFocusMode', description: 'Odak modu', enabled: true },
    'Ctrl+Shift+M': { action: 'toggleMute', description: 'Sessize al', enabled: true }
  });

  // Ayarları localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('uiuxSettings', JSON.stringify(settings));
  }, [settings]);

  // Responsive breakpoint'leri kontrol et
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth;
      let newScreenSize: UIUXState['screenSize'];
      let newIsMobile = false;
      let newIsTablet = false;
      let newIsDesktop = false;

      if (width < 640) {
        newScreenSize = 'xs';
        newIsMobile = true;
      } else if (width < 768) {
        newScreenSize = 'sm';
        newIsMobile = true;
      } else if (width < 1024) {
        newScreenSize = 'md';
        newIsTablet = true;
      } else if (width < 1280) {
        newScreenSize = 'lg';
        newIsDesktop = true;
      } else if (width < 1536) {
        newScreenSize = 'xl';
        newIsDesktop = true;
      } else {
        newScreenSize = '2xl';
        newIsDesktop = true;
      }

      setState(prev => ({
        ...prev,
        isMobile: newIsMobile,
        isTablet: newIsTablet,
        isDesktop: newIsDesktop,
        screenSize: newScreenSize
      }));
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Klavye kısayollarını dinle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.ctrlKey || event.metaKey ? 
        `${event.ctrlKey ? 'Ctrl+' : 'Cmd+'}${event.shiftKey ? 'Shift+' : ''}${event.key.toUpperCase()}` :
        event.key;

      const shortcut = keyboardShortcuts[key];
      if (shortcut && shortcut.enabled) {
        event.preventDefault();
        executeShortcut(shortcut.action);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [keyboardShortcuts]);

  // Kısayol aksiyonlarını çalıştır
  const executeShortcut = (action: string) => {
    switch (action) {
      case 'openSearch':
        // Arama aç
        break;
      case 'newMessage':
        // Yeni mesaj
        break;
      case 'newChannel':
        // Yeni kanal
        break;
      case 'toggleSidebar':
        toggleSidebar();
        break;
      case 'openSettings':
        setState(prev => ({ ...prev, isSettingsOpen: true }));
        break;
      case 'openKeyboardShortcuts':
        setState(prev => ({ ...prev, isKeyboardShortcutsOpen: true }));
        break;
      case 'closeModal':
        closeModal();
        break;
      case 'toggleTheme':
        // Tema değiştir
        break;
      case 'toggleFocusMode':
        // Odak modu
        break;
      case 'toggleMute':
        // Sessize al
        break;
    }
  };

  // Ayarları güncelle
  const updateSettings = async (newSettings: Partial<UIUXSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // LocalStorage'a kaydet (geçici)
    localStorage.setItem('uiuxSettings', JSON.stringify({ ...settings, ...newSettings }));
    
    // Supabase'e kaydet (kullanıcı giriş yapmışsa)
    if (user) {
      try {
        await updateUIUXSettings({ ...settings, ...newSettings });
      } catch (error) {
        console.error('UI/UX ayarları Supabase\'e kaydedilemedi:', error);
      }
    }
  };

  // State'i güncelle
  const updateState = (newState: Partial<UIUXState>) => {
    setState(prev => ({ ...prev, ...newState }));
  };

  // Klavye kısayollarını güncelle
  const updateKeyboardShortcuts = (newShortcuts: Partial<KeyboardShortcuts>) => {
    setKeyboardShortcuts(prev => ({ ...prev, ...newShortcuts }));
  };

  // Varsayılanlara sıfırla
  const resetToDefaults = () => {
    setSettings({
      layout: 'default',
      sidebarCollapsed: false,
      sidebarWidth: 320,
      messageSpacing: 'normal',
      fontSize: 'medium',
      lineHeight: 'normal',
      borderRadius: 'medium',
      shadows: 'subtle',
      animations: true,
      animationSpeed: 'normal',
      reducedMotion: false,
      accentColor: '#3b82f6',
      colorScheme: 'blue',
      customColors: {
        primary: '#3b82f6',
        secondary: '#6b7280',
        accent: '#8b5cf6'
      },
      fontFamily: 'system',
      customFont: '',
      fontWeight: 'normal',
      highContrast: false,
      largeText: false,
      focusIndicators: true,
      screenReader: false,
      lazyLoading: true,
      virtualScrolling: false,
      imageOptimization: true,
      customCSS: '',
      customJS: ''
    });
  };

  // Ayarları dışa aktar
  const exportSettings = (): string => {
    return JSON.stringify({
      settings,
      keyboardShortcuts
    }, null, 2);
  };

  // Ayarları içe aktar
  const importSettings = (settingsString: string) => {
    try {
      const imported = JSON.parse(settingsString);
      if (imported.settings) {
        setSettings(imported.settings);
      }
      if (imported.keyboardShortcuts) {
        setKeyboardShortcuts(imported.keyboardShortcuts);
      }
    } catch (error) {
      console.error('Ayarlar içe aktarılamadı:', error);
    }
  };

  // Kenar çubuğunu aç/kapat
  const toggleSidebar = () => {
    setState(prev => ({ ...prev, isSidebarOpen: !prev.isSidebarOpen }));
  };

  // Modal aç
  const openModal = (modalName: string) => {
    setState(prev => ({ ...prev, activeModal: modalName }));
  };

  // Modal kapat
  const closeModal = () => {
    setState(prev => ({ ...prev, activeModal: null }));
  };

  // Animasyon kuyruğuna ekle
  const addToAnimationQueue = (animation: string) => {
    setState(prev => ({
      ...prev,
      animationQueue: [...prev.animationQueue, animation]
    }));
  };

  // Yükleme durumunu ayarla
  const setLoading = (loading: boolean, text: string = '') => {
    setState(prev => ({
      ...prev,
      isLoading: loading,
      loadingText: text,
      loadingProgress: loading ? 0 : 100
    }));
  };

  // Yükleme ilerlemesini güncelle
  const updateLoadingProgress = (progress: number) => {
    setState(prev => ({ ...prev, loadingProgress: progress }));
  };

  // Responsive class'ları al
  const getResponsiveClass = (classes: { [key: string]: string }): string => {
    return classes[state.screenSize] || classes.default || '';
  };

  // Özel CSS uygula
  const applyCustomCSS = (css: string) => {
    let styleElement = document.getElementById('custom-css');
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = 'custom-css';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = css;
  };

  // Özel JS uygula
  const applyCustomJS = (js: string) => {
    try {
      // Güvenli JS çalıştırma
      const script = document.createElement('script');
      script.textContent = js;
      document.head.appendChild(script);
    } catch (error) {
      console.error('Özel JS çalıştırılamadı:', error);
    }
  };

  // CSS değişkenlerini güncelle
  useEffect(() => {
    const root = document.documentElement;
    
    // Renk şeması
    root.style.setProperty('--accent-color', settings.accentColor);
    root.style.setProperty('--primary-color', settings.customColors.primary);
    root.style.setProperty('--secondary-color', settings.customColors.secondary);
    
    // Font boyutu
    const fontSizeMap = { small: '14px', medium: '16px', large: '18px' };
    root.style.setProperty('--font-size', fontSizeMap[settings.fontSize]);
    
    // Border radius
    const borderRadiusMap = { none: '0', small: '4px', medium: '8px', large: '12px' };
    root.style.setProperty('--border-radius', borderRadiusMap[settings.borderRadius]);
    
    // Gölge
    const shadowMap = {
      none: 'none',
      subtle: '0 1px 3px rgba(0,0,0,0.1)',
      medium: '0 4px 6px rgba(0,0,0,0.1)',
      strong: '0 10px 25px rgba(0,0,0,0.15)'
    };
    root.style.setProperty('--shadow', shadowMap[settings.shadows]);
    
    // Animasyon hızı
    const speedMap = { slow: '0.5s', normal: '0.3s', fast: '0.15s' };
    root.style.setProperty('--animation-speed', speedMap[settings.animationSpeed]);
    
    // Reduced motion
    if (settings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0.01ms');
    }
  }, [settings]);

  // Özel CSS'i uygula
  useEffect(() => {
    if (settings.customCSS) {
      applyCustomCSS(settings.customCSS);
    }
  }, [settings.customCSS]);

  return (
    <UIUXContext.Provider value={{
      settings,
      state,
      keyboardShortcuts,
      updateSettings,
      updateState,
      updateKeyboardShortcuts,
      resetToDefaults,
      exportSettings,
      importSettings,
      toggleSidebar,
      openModal,
      closeModal,
      addToAnimationQueue,
      setLoading,
      updateLoadingProgress,
      getResponsiveClass,
      applyCustomCSS,
      applyCustomJS
    }}>
      {children}
    </UIUXContext.Provider>
  );
};
