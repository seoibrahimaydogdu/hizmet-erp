import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useSupabase } from '../hooks/useSupabase';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'mention' | 'message' | 'file' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'chat' | 'mention' | 'file' | 'system' | 'reminder' | 'announcement';
  timestamp: Date;
  isRead: boolean;
  isDismissed: boolean;
  expiresAt?: Date;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  channelId?: string;
  channelName?: string;
  messageId?: string;
  actionUrl?: string;
  metadata?: {
    sound?: string;
    vibration?: boolean;
    badge?: number;
    icon?: string;
    color?: string;
  };
}

export interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  mobile: boolean;
  mentions: boolean;
  messages: boolean;
  files: boolean;
  system: boolean;
  reminders: boolean;
  announcements: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "08:00"
  };
  priorityFilter: 'all' | 'high' | 'urgent';
  soundEffects: {
    message: string;
    mention: string;
    file: string;
    system: string;
  };
  vibrationPattern: number[];
  autoDismiss: {
    enabled: boolean;
    duration: number; // milliseconds
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  settings: NotificationSettings;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'isRead' | 'isDismissed'>) => Promise<void>;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  playNotificationSound: (type: keyof NotificationSettings['soundEffects']) => void;
  requestNotificationPermission: () => Promise<boolean>;
  isNotificationSupported: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { user, updateNotificationSettings, updateNotificationHistory, getUserPreferences } = useSupabase();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('notificationSettings');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      sound: true,
      desktop: true,
      mobile: true,
      mentions: true,
      messages: true,
      files: true,
      system: true,
      reminders: true,
      announcements: true,
      quietHours: {
        enabled: false,
        start: "22:00",
        end: "08:00"
      },
      priorityFilter: 'all',
      soundEffects: {
        message: '/sounds/message.mp3',
        mention: '/sounds/mention.mp3',
        file: '/sounds/file.mp3',
        system: '/sounds/system.mp3'
      },
      vibrationPattern: [200, 100, 200],
      autoDismiss: {
        enabled: true,
        duration: 5000
      }
    };
  });

  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});
  const isNotificationSupported = 'Notification' in window;

  // Ses dosyalarını önceden yükle
  useEffect(() => {
    Object.entries(settings.soundEffects).forEach(([type, sound]) => {
      if (sound) {
        const audio = new Audio(sound);
        audio.preload = 'auto';
        audioRefs.current[type] = audio;
      }
    });
  }, [settings.soundEffects]);

  // Ayarları localStorage'a kaydet
  useEffect(() => {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  }, [settings]);

  // Okunmamış bildirim sayısını hesapla
  const unreadCount = notifications.filter(n => !n.isRead && !n.isDismissed).length;

  // Bildirim ekleme
  const addNotification = async (notificationData: Omit<Notification, 'id' | 'timestamp' | 'isRead' | 'isDismissed'>) => {
    if (!settings.enabled) return;

    // Sessiz saatleri kontrol et
    if (settings.quietHours.enabled && isInQuietHours()) {
      return;
    }

    // Öncelik filtresini kontrol et
    if (settings.priorityFilter !== 'all' && notificationData.priority !== settings.priorityFilter) {
      return;
    }

    // Aynı bildirimin daha önce gösterilip gösterilmediğini kontrol et
    const notificationKey = `${notificationData.title}_${notificationData.message}_${notificationData.type}`;
    const shownNotifications = JSON.parse(localStorage.getItem('shownNotifications') || '[]');
    
    if (shownNotifications.includes(notificationKey)) {
      return; // Bu bildirim daha önce gösterilmiş, tekrar gösterme
    }

    const notification: Notification = {
      ...notificationData,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      isRead: false,
      isDismissed: false
    };

    setNotifications(prev => [notification, ...prev]);

    // Ses çal
    if (settings.sound) {
      playNotificationSound(notificationData.category as keyof NotificationSettings['soundEffects']);
    }

    // Desktop bildirimi göster
    if (settings.desktop && isNotificationSupported && Notification.permission === 'granted') {
      showDesktopNotification(notification);
    }

    // Mobil titreşim
    if (settings.mobile && 'vibrate' in navigator) {
      navigator.vibrate(settings.vibrationPattern);
    }

    // Toast bildirimi
    showToastNotification(notification);

    // Otomatik kapatma
    if (settings.autoDismiss.enabled) {
      setTimeout(() => {
        dismissNotification(notification.id);
      }, settings.autoDismiss.duration);
    }

    // Bu bildirimin gösterildiğini localStorage'a kaydet
    if (!shownNotifications.includes(notificationKey)) {
      shownNotifications.push(notificationKey);
      localStorage.setItem('shownNotifications', JSON.stringify(shownNotifications));
      
      // Supabase'e kaydet (kullanıcı giriş yapmışsa)
      if (user) {
        try {
          await updateNotificationHistory(shownNotifications, true);
        } catch (error) {
          console.error('Bildirim geçmişi Supabase\'e kaydedilemedi:', error);
        }
      }
    }
  };

  // Bildirimi okundu olarak işaretle
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isRead: true } : n)
    );
  };

  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, isRead: true }))
    );
  };

  // Bildirimi kapat
  const dismissNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, isDismissed: true } : n)
    );
  };

  // Tüm bildirimleri temizle
  const clearAllNotifications = async () => {
    setNotifications([]);
    
    // LocalStorage'dan temizle
    localStorage.removeItem('shownNotifications');
    localStorage.removeItem('hasShownWelcomeNotifications');
    
    // Supabase'den temizle (kullanıcı giriş yapmışsa)
    if (user) {
      try {
        await updateNotificationHistory([], false);
      } catch (error) {
        console.error('Bildirim geçmişi Supabase\'den temizlenemedi:', error);
      }
    }
  };

  // Ayarları güncelle
  const updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // LocalStorage'a kaydet (geçici)
    localStorage.setItem('notificationSettings', JSON.stringify({ ...settings, ...newSettings }));
    
    // Supabase'e kaydet (kullanıcı giriş yapmışsa)
    if (user) {
      try {
        await updateNotificationSettings({ ...settings, ...newSettings });
      } catch (error) {
        console.error('Bildirim ayarları Supabase\'e kaydedilemedi:', error);
      }
    }
  };

  // Ses çal
  const playNotificationSound = (type: keyof NotificationSettings['soundEffects']) => {
    const audio = audioRefs.current[type];
    if (audio && settings.sound) {
      audio.currentTime = 0;
      audio.play().catch(console.error);
    }
  };

  // Desktop bildirimi göster
  const showDesktopNotification = (notification: Notification) => {
    const desktopNotification = new Notification(notification.title, {
      body: notification.message,
      icon: notification.metadata?.icon || '/icons/notification.png',
      badge: notification.metadata?.badge ? '/icons/badge.png' : undefined,
      tag: notification.id,
      requireInteraction: notification.priority === 'urgent',
      silent: !settings.sound
    });

    desktopNotification.onclick = () => {
      if (notification.actionUrl) {
        window.open(notification.actionUrl, '_blank');
      }
      markAsRead(notification.id);
      desktopNotification.close();
    };

    // Otomatik kapatma
    setTimeout(() => {
      desktopNotification.close();
    }, 10000);
  };

  // Toast bildirimi göster
  const showToastNotification = (notification: Notification) => {
    const toastOptions = {
      duration: notification.priority === 'urgent' ? 8000 : 4000,
      position: 'top-right' as const,
      style: {
        background: getNotificationColor(notification.type),
        color: '#fff',
        border: `1px solid ${getNotificationBorderColor(notification.type)}`
      }
    };

    toast(notification.message, toastOptions);
  };

  // Bildirim izni iste
  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!isNotificationSupported) return false;

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return Notification.permission === 'granted';
  };

  // Sessiz saatleri kontrol et
  const isInQuietHours = (): boolean => {
    if (!settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMinute] = settings.quietHours.start.split(':').map(Number);
    const [endHour, endMinute] = settings.quietHours.end.split(':').map(Number);
    
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Gece yarısını geçen durum
      return currentTime >= startTime || currentTime <= endTime;
    }
  };

  // Bildirim rengini al
  const getNotificationColor = (type: Notification['type']): string => {
    switch (type) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      case 'mention': return '#8b5cf6';
      case 'file': return '#06b6d4';
      case 'system': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  // Bildirim border rengini al
  const getNotificationBorderColor = (type: Notification['type']): string => {
    switch (type) {
      case 'success': return '#059669';
      case 'warning': return '#d97706';
      case 'error': return '#dc2626';
      case 'mention': return '#7c3aed';
      case 'file': return '#0891b2';
      case 'system': return '#4b5563';
      default: return '#2563eb';
    }
  };

  // Eski bildirimleri temizle (7 günden eski)
  useEffect(() => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    setNotifications(prev => 
      prev.filter(n => n.timestamp > sevenDaysAgo)
    );
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      settings,
      addNotification,
      markAsRead,
      markAllAsRead,
      dismissNotification,
      clearAllNotifications,
      updateSettings,
      playNotificationSound,
      requestNotificationPermission,
      isNotificationSupported
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
