import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
  primaryColor: string;
  setPrimaryColor: (color: string) => void;
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
  children: ReactNode;
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      return savedTheme || 'light';
    }
    return 'light';
  });

  const [primaryColor, setPrimaryColorState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedColor = localStorage.getItem('primaryColor');
      return savedColor || '#3b82f6';
    }
    return '#3b82f6';
  });

  const [isDark, setIsDark] = useState(false);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
  };

  const setPrimaryColor = (color: string) => {
    setPrimaryColorState(color);
    if (typeof window !== 'undefined') {
      localStorage.setItem('primaryColor', color);
    }
  };

  // Tema değişikliklerini uygula
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;

    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      root.classList.toggle('dark', prefersDark);
    } else {
      setIsDark(theme === 'dark');
      root.classList.toggle('dark', theme === 'dark');
    }

    // Auto modunda media query dinle
    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        const prefersDark = mediaQuery.matches;
        setIsDark(prefersDark);
        root.classList.toggle('dark', prefersDark);
      };
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Ana renk CSS değişkenlerini uygula
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    root.style.setProperty('--color-primary', primaryColor);

    const rgb = hexToRgb(primaryColor);
    if (rgb) {
      root.style.setProperty('--color-primary-50', `rgb(${rgb.r + 48}, ${rgb.g + 48}, ${rgb.b + 48})`);
      root.style.setProperty('--color-primary-100', `rgb(${rgb.r + 32}, ${rgb.g + 32}, ${rgb.b + 32})`);
      root.style.setProperty('--color-primary-200', `rgb(${rgb.r + 16}, ${rgb.g + 16}, ${rgb.b + 16})`);
      root.style.setProperty('--color-primary-300', `rgb(${rgb.r + 8}, ${rgb.g + 8}, ${rgb.b + 8})`);
      root.style.setProperty('--color-primary-400', `rgb(${rgb.r + 4}, ${rgb.g + 4}, ${rgb.b + 4})`);
      root.style.setProperty('--color-primary-500', primaryColor);
      root.style.setProperty('--color-primary-600', `rgb(${Math.max(0, rgb.r - 4)}, ${Math.max(0, rgb.g - 4)}, ${Math.max(0, rgb.b - 4)})`);
      root.style.setProperty('--color-primary-700', `rgb(${Math.max(0, rgb.r - 8)}, ${Math.max(0, rgb.g - 8)}, ${Math.max(0, rgb.b - 8)})`);
      root.style.setProperty('--color-primary-800', `rgb(${Math.max(0, rgb.r - 16)}, ${Math.max(0, rgb.g - 16)}, ${Math.max(0, rgb.b - 16)})`);
      root.style.setProperty('--color-primary-900', `rgb(${Math.max(0, rgb.r - 32)}, ${Math.max(0, rgb.g - 32)}, ${Math.max(0, rgb.b - 32)})`);
    }
  }, [primaryColor]);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  const value = {
    theme,
    setTheme,
    isDark,
    primaryColor,
    setPrimaryColor
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};