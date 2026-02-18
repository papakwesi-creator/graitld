import './globals.css';

import type { Metadata } from 'next';
import { Manrope, DM_Sans, JetBrains_Mono } from 'next/font/google';

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