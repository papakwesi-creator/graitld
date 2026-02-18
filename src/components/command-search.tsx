'use client';

import {
  Analytics01Icon,
  ChartRadarIcon,
  DashboardSquare02Icon,
  Search02Icon,
  Settings01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';

import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

const pages = [
  { title: 'Overview', href: '/', icon: DashboardSquare02Icon },
  { title: 'Influencers', href: '/influencers', icon: UserGroupIcon },
  { title: 'Analytics', href: '/analytics', icon: Analytics01Icon },
  { title: 'Reports', href: '/reports', icon: ChartRadarIcon },
  { title: 'Channel Lookup', href: '/channel-lookup', icon: Search02Icon },
  { title: 'Settings', href: '/settings', icon: Settings01Icon },
];

interface CommandSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Render a searchable command dialog that lists dashboard pages and navigates to a page when selected.
 *
 * @param open - Whether the dialog is currently open
 * @param onOpenChange - Callback invoked when the dialog open state should change
 * @returns A JSX element rendering a CommandDialog with a searchable list of pages; selecting an item closes the dialog and navigates to that page's `href`.
 */
export function CommandSearch({ open, onOpenChange }: CommandSearchProps) {
  const router = useRouter();

  const navigate = (href: string) => {
    onOpenChange(false);
    router.push(href as Route);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title='Search pages'
      description='Search the dashboard and jump to a page.'
      className='sm:max-w-lg'
    >
      <Command>
        <CommandInput autoFocus placeholder='Search pages...' />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            <div className='px-2 py-1.5 text-xs font-medium text-muted-foreground'>Pages</div>
            {pages.map((page) => (
              <CommandItem key={page.href} value={page.title} onSelect={() => navigate(page.href)}>
                <HugeiconsIcon icon={page.icon} size={16} />
                <span>{page.title}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </Command>
    </CommandDialog>
  );
}