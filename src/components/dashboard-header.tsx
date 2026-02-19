'use client';

import { Moon02Icon, Search01Icon, Sun01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CommandSearch } from '@/components/command-search';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { Kbd } from '@/components/ui/kbd';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';

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

/**
 * Render the dashboard header with the current page title and description, a search trigger, and a theme toggle.
 *
 * Pressing Cmd/Ctrl+K toggles the search UI. The search button opens the CommandSearch component; the theme button toggles between light and dark modes.
 *
 * @returns A JSX element containing the header and the CommandSearch component bound to the header's search state.
 */
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
      <header className='sticky top-0 z-30 flex h-20 shrink-0 items-center justify-between gap-4 border-b border-border/40 bg-background/80 px-8 backdrop-blur-xl transition-all'>
        <div className='flex items-center gap-4'>
          <SidebarTrigger className='-ml-2 h-9 w-9 text-muted-foreground hover:bg-accent hover:text-accent-foreground' />
          <div className='flex flex-col gap-0.5'>
            <h1 className='font-heading text-lg font-bold tracking-tight text-foreground'>
              {page.title}
            </h1>
            {page.description && (
              <p className='hidden text-xs font-medium text-muted-foreground md:block'>
                {page.description}
              </p>
            )}
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <Button
            onClick={() => setSearchOpen(true)}
            variant='outline'
            className='group h-9 w-full justify-start gap-2 px-3 text-sm text-muted-foreground md:w-64'
          >
            <HugeiconsIcon icon={Search01Icon} size={16} />
            <span className='hidden sm:inline'>Search...</span>
            <Kbd className='ml-auto hidden sm:inline-flex'>
              <span className='text-xs'>⌘</span>K
            </Kbd>
          </Button>

          <Separator orientation='vertical' className='mx-1 h-6' />

          <Button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            variant='ghost'
            size='icon'
            className='h-9 w-9'
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            <HugeiconsIcon icon={theme === 'dark' ? Sun01Icon : Moon02Icon} size={18} />
          </Button>
        </div>
      </header>

      <CommandSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
