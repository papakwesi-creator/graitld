'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: 'light',
  setTheme: () => null,
});

/**
 * Provides theme state to descendants, synchronizes the selected theme with localStorage, and applies the corresponding `light`/`dark` class to the document root.
 *
 * Reads a saved theme from localStorage on mount. When the theme changes, updates the documentElement's classes (removing any existing `light`/`dark`), optionally disables CSS transitions briefly to avoid animation glitches, and if `theme` is `'system'` and `enableSystem` is true, uses the OS color-scheme preference to choose `light` or `dark`. Exposes a context value `{ theme, setTheme }` where `setTheme` persists the new theme to localStorage and updates state.
 *
 * @param children - React node(s) rendered inside the provider
 * @param defaultTheme - Initial theme used when no saved value exists (default: `'light'`)
 * @param enableSystem - Whether to honor the system color-scheme when `theme` is `'system'` (default: `true`)
 * @param disableTransitionOnChange - When true, briefly disables root CSS transitions during theme changes to avoid visual glitches (default: `true`)
 * @returns The ThemeProvider element that supplies theme context to its children
 */
export function ThemeProvider({
  children,
  defaultTheme = 'light',
  attribute = 'class',
  enableSystem = true,
  disableTransitionOnChange = true,
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;

    if (disableTransitionOnChange) {
      root.style.setProperty('transition', 'none');
      // Force a reflow
      void root.offsetHeight;
      requestAnimationFrame(() => {
        root.style.removeProperty('transition');
      });
    }

    root.classList.remove('light', 'dark');

    if (theme === 'system' && enableSystem) {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme, enableSystem, disableTransitionOnChange]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem('theme', theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value} {...props}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeProviderContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}