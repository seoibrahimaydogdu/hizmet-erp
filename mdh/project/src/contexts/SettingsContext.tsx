import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Settings {
  siteName: string;
  siteDescription: string;
  language: string;
  timezone: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  soundEnabled: boolean;
  primaryColor: string;
  fontSize: string;
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;
  maxTicketsPerPage: number;
  autoAssignment: boolean;
  workingHours: {
    start: string;
    end: string;
  };
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  saveSettings: () => Promise<void>;
  isLoading: boolean;
}

const defaultSettings: Settings = {
  siteName: 'Workexe Yönetim Paneli',
  siteDescription: 'Workexe SEO SaaS Yönetim Paneli',
  language: 'tr',
  timezone: 'Europe/Istanbul',
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  soundEnabled: true,
  primaryColor: '#3B82F6',
  fontSize: 'medium',
  twoFactorAuth: false,
  sessionTimeout: 30,
  passwordExpiry: 90,
  smtpHost: 'smtp.gmail.com',
  smtpPort: 587,
  smtpUser: '',
  smtpPassword: '',
  maxTicketsPerPage: 10,
  autoAssignment: true,
  workingHours: {
    start: '09:00',
    end: '18:00'
  }
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

interface SettingsProviderProps {
  children: ReactNode;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Sayfa yüklendiğinde kaydedilmiş ayarları yükle
  useEffect(() => {
    const loadSettings = () => {
      try {
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          // Tema hariç diğer ayarları yükle
          const { theme: savedTheme, lastSaved, ...otherSettings } = parsedSettings;
          setSettings({ ...defaultSettings, ...otherSettings });
        }
      } catch (error) {
        console.error('Kaydedilmiş ayarlar yüklenirken hata:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSettings();
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const saveSettings = async () => {
    try {
      // Mevcut tema ayarını koru
      const existingSettings = localStorage.getItem('appSettings');
      let existingTheme = 'light';
      let existingLastSaved = new Date().toISOString();
      
      if (existingSettings) {
        try {
          const parsed = JSON.parse(existingSettings);
          existingTheme = parsed.theme || 'light';
          existingLastSaved = parsed.lastSaved || new Date().toISOString();
        } catch (e) {
          console.error('Mevcut ayarlar parse edilemedi:', e);
        }
      }

      const settingsToSave = {
        ...settings,
        theme: existingTheme,
        lastSaved: new Date().toISOString()
      };
      
      localStorage.setItem('appSettings', JSON.stringify(settingsToSave));
      
      console.log('Settings saved:', settingsToSave);
    } catch (error) {
      console.error('Ayarlar kaydedilirken hata oluştu:', error);
      throw error;
    }
  };

  const value: SettingsContextType = {
    settings,
    updateSettings,
    saveSettings,
    isLoading
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
