'use client';

import { Moon02Icon, Search01Icon, Sun01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { CommandSearch } from '@/components/command-search';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';

const pageTitles: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Overview',
    description: 'Key metrics and performance summary',
  },
  '/influencers': {
    title: 'Influencers',
    description: 'Manage influencer profiles and tax records',
  },
  '/analytics': {
    title: 'Analytics',
    description: 'Tax gap analysis and compliance insights',
  },
  '/reports': {
    title: 'Reports',
    description: 'Generate and manage tax reports',
  },
  '/channel-lookup': {
    title: 'Channel Lookup',
    description: 'Search and import channel data',
  },
  '/settings': {
    title: 'Settings',
    description: 'Account and application preferences',
  },
};

export function DashboardHeader() {
  const pathname = usePathname();
  const page = pageTitles[pathname] ?? {
    title: 'Dashboard',
    description: '',
  };
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-20 shrink-0 items-center justify-between gap-4 border-b border-border/40 bg-background/80 px-8 backdrop-blur-xl transition-all">
        <div className="flex items-center gap-4">
          <SidebarTrigger className="-ml-2 h-9 w-9 text-muted-foreground hover:bg-accent hover:text-accent-foreground" />
          <div className="flex flex-col gap-0.5">
            <h1 className="font-heading text-lg font-bold tracking-tight text-foreground">
              {page.title}
            </h1>
            {page.description && (
              <p className="hidden text-xs font-medium text-muted-foreground md:block">
                {page.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setSearchOpen(true)}
            className="group flex h-9 items-center gap-2 rounded-lg border border-input bg-background/50 px-3 text-sm text-muted-foreground transition-colors hover:border-accent/50 hover:bg-accent/5 hover:text-accent-foreground w-full md:w-64"
          >
            <HugeiconsIcon icon={Search01Icon} size={16} />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="ml-auto pointer-events-none hidden h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
              <span className="text-xs">⌘</span>K
            </kbd>
          </button>

          <div className="h-6 w-px bg-border/60 mx-1" />

          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent/10 hover:text-accent-foreground"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
             <HugeiconsIcon
              icon={theme === 'dark' ? Sun01Icon : Moon02Icon}
              size={18}
            />
          </button>
        </div>
      </header>

      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
