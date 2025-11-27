import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { themeApi, ActiveThemeResponse } from '../services/themeApi';

interface ThemeContextType {
  theme: ActiveThemeResponse | null;
  loading: boolean;
  error: Error | null;
  refreshTheme: () => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<ActiveThemeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const themeRef = useRef<ActiveThemeResponse | null>(null);

  // Helper function to convert hex to HSL
  const hexToHsl = (hex: string): string => {
    if (!hex || !hex.startsWith('#')) return '';
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h: number, s: number, l: number = (max + min) / 2;

    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
        default: h = 0;
      }
    }

    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  };

  const applyTheme = (themeData: ActiveThemeResponse) => {
    // Apply CSS variables
    const root = document.documentElement;
    
    // Apply theme colors
    if (themeData.theme.primary_color) {
      root.style.setProperty('--theme-primary', themeData.theme.primary_color);
    }
    if (themeData.theme.secondary_color) {
      root.style.setProperty('--theme-secondary', themeData.theme.secondary_color);
    }
    
    // Check if we're in admin area - don't apply theme colors to admin
    const isAdminArea = window.location.pathname.startsWith('/admin') || 
                       window.location.pathname.startsWith('/super-admin') ||
                       document.querySelector('[data-admin-area]') !== null;
    
    // Check if dark mode is active
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    // Apply background color - only override in light mode (only for public site)
    // In dark mode, let the CSS dark mode styles handle the background
    if (themeData.theme.background_color && !isAdminArea) {
      const bgHsl = hexToHsl(themeData.theme.background_color);
      root.style.setProperty('--theme-background', themeData.theme.background_color);
      root.style.setProperty('--theme-background-hsl', bgHsl || '0 0% 100%');
      // Apply to body background only for public pages and only in light mode
      if (!isAdminArea && !isDarkMode) {
        document.body.setAttribute('data-theme-active', 'true');
        document.body.style.backgroundColor = themeData.theme.background_color;
      } else if (!isAdminArea && isDarkMode) {
        // In dark mode, remove theme background override to let dark mode CSS work
        document.body.removeAttribute('data-theme-active');
        document.body.style.backgroundColor = '';
      }
    } else {
      // Reset to default if not set or in admin area
      if (!isAdminArea) {
        root.style.removeProperty('--theme-background');
        root.style.removeProperty('--theme-background-hsl');
        document.body.removeAttribute('data-theme-active');
        document.body.style.backgroundColor = '';
      }
    }
    
    // Apply text color - only override in light mode (only for public site)
    // In dark mode, let the CSS dark mode styles handle the text color
    if (themeData.theme.text_color && !isAdminArea) {
      const textHsl = hexToHsl(themeData.theme.text_color);
      root.style.setProperty('--theme-text', themeData.theme.text_color);
      root.style.setProperty('--theme-text-hsl', textHsl || '0 0% 0%');
      // Only apply to body if not in admin area and in light mode
      if (!isAdminArea && !isDarkMode) {
        document.body.style.color = themeData.theme.text_color;
      } else if (!isAdminArea && isDarkMode) {
        // In dark mode, remove theme text override to let dark mode CSS work
        document.body.style.color = '';
      }
    } else {
      if (!isAdminArea) {
        root.style.removeProperty('--theme-text');
        root.style.removeProperty('--theme-text-hsl');
        document.body.style.color = '';
      }
    }
    
    // Apply accent color
    if (themeData.theme.accent_color) {
      const accentHsl = hexToHsl(themeData.theme.accent_color);
      root.style.setProperty('--theme-accent', themeData.theme.accent_color);
      // Update accent CSS variable used by Tailwind
      root.style.setProperty('--accent', accentHsl || '43 70% 52%');
      // Calculate appropriate foreground color for accent (light or dark text)
      const accentR = parseInt(themeData.theme.accent_color.slice(1, 3), 16);
      const accentG = parseInt(themeData.theme.accent_color.slice(3, 5), 16);
      const accentB = parseInt(themeData.theme.accent_color.slice(5, 7), 16);
      const accentLuminance = (0.299 * accentR + 0.587 * accentG + 0.114 * accentB) / 255;
      const accentForeground = accentLuminance > 0.5 ? '0 0% 0%' : '0 0% 100%';
      root.style.setProperty('--accent-foreground', accentForeground);
    } else {
      root.style.removeProperty('--theme-accent');
    }

    // Add theme class to body
    document.body.className = document.body.className
      .replace(/theme-\w+/g, '')
      .trim();
    document.body.classList.add(`theme-${themeData.theme_key}`);

    // Initialize animations (will be handled by animation component)
    if (themeData.theme.animations && themeData.theme.animations.length > 0) {
      window.dispatchEvent(
        new CustomEvent('theme-animations', {
          detail: themeData.theme.animations,
        })
      );
    }
  };

  const fetchTheme = async () => {
    try {
      setLoading(true);
      setError(null);
      const themeData = await themeApi.getActiveTheme();
      setTheme(themeData);
      themeRef.current = themeData;
      applyTheme(themeData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error('Failed to fetch theme:', err);
      // Apply default theme on error
      const defaultTheme: ActiveThemeResponse = {
        theme_key: 'default',
        theme: {
          name: 'Default',
          primary_color: '#0b5cff',
          secondary_color: '#00d4ff',
          background_color: '#ffffff',
          text_color: '#000000',
          accent_color: '#d4af37',
          banner: 'themes/default/banner.jpg',
          hero_background: '',
          icons_path: 'themes/default/icons/',
          animations: [],
          popup: null,
        },
        event: null,
      };
      setTheme(defaultTheme);
      themeRef.current = defaultTheme;
      applyTheme(defaultTheme);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTheme();
    
    // Refresh theme every 5 minutes
    const interval = setInterval(fetchTheme, 5 * 60 * 1000);
    
    // Listen for dark mode changes and reapply theme
    const observer = new MutationObserver(() => {
      if (themeRef.current) {
        applyTheme(themeRef.current);
      }
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => {
      clearInterval(interval);
      observer.disconnect();
    };
  }, []);

  // Update ref when theme changes
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        loading,
        error,
        refreshTheme: fetchTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

