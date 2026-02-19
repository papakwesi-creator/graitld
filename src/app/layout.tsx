import './globals.css';

import type { Metadata } from 'next';
import { Manrope, DM_Sans, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';

import { ThemeProvider } from '@/components/theme-provider';

import { ConvexClientProvider } from './ConvexClientProvider';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'GRA Influencer Tax Dashboard',
  description:
    'Tax estimation and management system for the Ghana Revenue Authority — assess, track, and manage influencer tax liabilities.',
};

/**
 * App root layout that applies global fonts, provides theme context, and wraps pages with the Convex client.
 *
 * @param children - React nodes to render within the application's layout.
 * @returns The root `<html>` element containing a `<body>` with global font classes and providers that supply theme and Convex client context to `children`.
 */
const themeInitScript = `
(() => {
  const key = 'theme';
  const root = document.documentElement;
  const isTheme = (v) => v === 'light' || v === 'dark' || v === 'system';
  const readTheme = () => {
    const stored = localStorage.getItem(key);
    return isTheme(stored) ? stored : 'system';
  };
  const apply = (theme) => {
    const resolved = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);
    root.style.colorScheme = resolved;
  };
  apply(readTheme());
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  const onChange = () => {
    if (readTheme() === 'system') apply('system');
  };
  if (media.addEventListener) {
    media.addEventListener('change', onChange);
  } else {
    media.addListener(onChange);
  }
  window.addEventListener('storage', (event) => {
    if (event.key === key) apply(readTheme());
  });
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${manrope.variable} ${dmSans.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <Script id='theme-init' strategy='beforeInteractive'>
          {themeInitScript}
        </Script>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}