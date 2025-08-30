import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSupabase } from '../hooks/useSupabase';

interface ThemeContextType {
  theme: 'light' | 'dark' | 'auto';
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
  isDark: boolean;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const { user, updateTheme, getUserPreferences } = useSupabase();
  
  const [theme, setThemeState] = useState<'light' | 'dark' | 'auto'>(() => {
    // Local storage'dan tema tercihini al (geçici)
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'auto';
    if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
      return savedTheme;
    }
    return 'auto';
  });

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return theme === 'dark';
  });

  const isDark = isDarkMode;

  useEffect(() => {
    // Tema değişikliğini localStorage'a kaydet
    localStorage.setItem('theme', theme);
    
    // isDarkMode'u güncelle
    if (theme === 'auto') {
      setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    } else {
      setIsDarkMode(theme === 'dark');
    }
  }, [theme]);

  useEffect(() => {
    // HTML elementine tema class'ını ekle/çıkar
    const htmlElement = document.documentElement;
    if (isDarkMode) {
      htmlElement.classList.add('dark');
    } else {
      htmlElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Sistem tema değişikliklerini dinle
  useEffect(() => {
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        setIsDarkMode(e.matches);
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  const setTheme = async (newTheme: 'light' | 'dark' | 'auto') => {
    setThemeState(newTheme);
    
    // LocalStorage'a kaydet (geçici)
    localStorage.setItem('theme', newTheme);
    
    // Supabase'e kaydet (kullanıcı giriş yapmışsa)
    if (user) {
      try {
        await updateTheme(newTheme);
      } catch (error) {
        console.error('Tema Supabase\'e kaydedilemedi:', error);
      }
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark, isDarkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};