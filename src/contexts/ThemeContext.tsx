import { createContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

type Theme = 'light' | 'dark' | 'system';
type Density = 'compact' | 'comfortable';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  density: Density;
  setDensity: (density: Density) => void;
  language: string;
  setLanguage: (language: string) => void;
  isDark: boolean;
  updatePreferences: (preferences: Partial<{ theme: Theme; density: Density; language: string }>) => Promise<void>;
  loadingPreferences: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export { ThemeContext };

interface ThemeProviderProps {
  children: ReactNode;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>('light');
  const [density, setDensity] = useState<Density>('comfortable');
  const [language, setLanguage] = useState('en');
  const [isDark, setIsDark] = useState(false);
  const [loadingPreferences, setLoadingPreferences] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Load preferences from localStorage or backend
  useEffect(() => {
    const loadPreferences = async () => {
      if (isAuthenticated && user) {
        setLoadingPreferences(true);
        try {
          // Load from backend if user is authenticated
          const response = await fetch(`${API_BASE}/users/preferences`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('expense-audit-token')}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data) {
              setTheme(data.data.theme || 'light');
              setDensity(data.data.density || 'comfortable');
              setLanguage(data.data.language || 'en');
            }
          }
        } catch (error) {
          console.error('Failed to load preferences from backend:', error);
          // Fall back to localStorage
          const storedTheme = localStorage.getItem('expense-audit-theme') as Theme;
          const storedDensity = localStorage.getItem('expense-audit-density') as Density;
          const storedLanguage = localStorage.getItem('expense-audit-language') || 'en';
          
          if (storedTheme) setTheme(storedTheme);
          if (storedDensity) setDensity(storedDensity);
          setLanguage(storedLanguage);
        } finally {
          setLoadingPreferences(false);
        }
      } else {
        // Load from localStorage for non-authenticated users
        const storedTheme = localStorage.getItem('expense-audit-theme') as Theme;
        const storedDensity = localStorage.getItem('expense-audit-density') as Density;
        const storedLanguage = localStorage.getItem('expense-audit-language') || 'en';
        
        if (storedTheme) setTheme(storedTheme);
        if (storedDensity) setDensity(storedDensity);
        setLanguage(storedLanguage);
      }
    };

    loadPreferences();
  }, [isAuthenticated, user]);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      setIsDark(systemTheme === 'dark');
    } else {
      root.classList.add(theme);
      setIsDark(theme === 'dark');
    }

    // Save to localStorage
    localStorage.setItem('expense-audit-theme', theme);
  }, [theme]);

  // Apply density to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('density-compact', 'density-comfortable');
    root.classList.add(`density-${density}`);

    // Save to localStorage
    localStorage.setItem('expense-audit-density', density);
  }, [density]);

  // Save language to localStorage
  useEffect(() => {
    localStorage.setItem('expense-audit-language', language);
  }, [language]);

  // Update preferences in backend
  const updatePreferences = async (preferences: Partial<{ theme: Theme; density: Density; language: string }>) => {
    if (!isAuthenticated) return;

    try {
      const response = await fetch(`${API_BASE}/users/preferences`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('expense-audit-token')}`
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      // Update local state
      if (preferences.theme !== undefined) setTheme(preferences.theme);
      if (preferences.density !== undefined) setDensity(preferences.density);
      if (preferences.language !== undefined) setLanguage(preferences.language);

    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      density, 
      setDensity, 
      language, 
      setLanguage, 
      isDark, 
      updatePreferences,
      loadingPreferences 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}
