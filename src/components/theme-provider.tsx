'use client';

import { createContext, useContext, useState } from 'react';

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

const isTheme = (value: string | null): value is Theme =>
  value === 'dark' || value === 'light' || value === 'system';

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: 'light',
  setTheme: () => null,
});

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  attribute = 'class',
  enableSystem = true,
  disableTransitionOnChange = true,
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    const stored = localStorage.getItem('theme');
    return isTheme(stored) ? stored : defaultTheme;
  });

  const applyTheme = (nextTheme: Theme) => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;

    if (disableTransitionOnChange) {
      root.style.setProperty('transition', 'none');
      void root.offsetHeight;
      requestAnimationFrame(() => {
        root.style.removeProperty('transition');
      });
    }

    const resolvedTheme =
      nextTheme === 'system' && enableSystem
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : nextTheme;

    if (attribute === 'class') {
      root.classList.remove('light', 'dark');
      root.classList.add(resolvedTheme);
    } else {
      root.setAttribute(attribute, resolvedTheme);
    }
    root.style.colorScheme = resolvedTheme;
  };

  const value = {
    theme,
    setTheme: (nextTheme: Theme) => {
      localStorage.setItem('theme', nextTheme);
      setThemeState(nextTheme);
      applyTheme(nextTheme);
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
