import { useState, useEffect } from 'react';

interface Settings {
  siteName: string;
  siteDescription: string;
  language: string;
  timezone: string;
  emailNotifications?: boolean;
  pushNotifications?: boolean;
  soundEnabled?: boolean;
  primaryColor?: string;
  fontSize?: string;
  twoFactorAuth?: boolean;
  sessionTimeout?: number;
  passwordExpiry?: number;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  maxTicketsPerPage?: number;
  autoAssignment?: boolean;
  workingHours?: {
    start: string;
    end: string;
  };
}

export const useSettings = () => {
  const [settings, setSettingsState] = useState<Settings>(() => {
    const savedSettings = localStorage.getItem('appSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        return {
          siteName: parsed.siteName || 'MDH Panel',
          siteDescription: parsed.siteDescription || 'Profesyonel müşteri destek platformu',
          language: parsed.language || 'tr',
          timezone: parsed.timezone || 'Europe/Istanbul',
          emailNotifications: parsed.emailNotifications ?? true,
          pushNotifications: parsed.pushNotifications ?? true,
          soundEnabled: parsed.soundEnabled ?? true,
          primaryColor: parsed.primaryColor || '#3B82F6',
          fontSize: parsed.fontSize || 'medium',
          twoFactorAuth: parsed.twoFactorAuth ?? false,
          sessionTimeout: parsed.sessionTimeout || 30,
          passwordExpiry: parsed.passwordExpiry || 90,
          smtpHost: parsed.smtpHost || 'smtp.gmail.com',
          smtpPort: parsed.smtpPort || 587,
          smtpUser: parsed.smtpUser || '',
          smtpPassword: parsed.smtpPassword || '',
          maxTicketsPerPage: parsed.maxTicketsPerPage || 10,
          autoAssignment: parsed.autoAssignment ?? true,
          workingHours: parsed.workingHours || {
            start: '09:00',
            end: '18:00'
          }
        };
      } catch (error) {
        console.error('Settings parse error:', error);
      }
    }
    return {
      siteName: 'MDH Panel',
      siteDescription: 'Profesyonel müşteri destek platformu',
      language: 'tr',
      timezone: 'Europe/Istanbul',
      emailNotifications: true,
      pushNotifications: true,
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
  });

  const setSettings = (newSettings: Partial<Settings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettingsState(updatedSettings);
    localStorage.setItem('appSettings', JSON.stringify(updatedSettings));
  };

  return { settings, setSettings };
};
