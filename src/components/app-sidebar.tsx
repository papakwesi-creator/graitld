'use client';

import {
  Analytics01Icon,
  ChartRadarIcon,
  DashboardSquare02Icon,
  Logout03Icon,
  Search02Icon,
  Settings01Icon,
  UserGroupIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { authClient } from '@/lib/auth-client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from './ui/sidebar';

const navItems: {
  title: string;
  href: string;
  icon: typeof DashboardSquare02Icon;
}[] = [
  {
    title: 'Overview',
    href: '/',
    icon: DashboardSquare02Icon,
  },
  {
    title: 'Influencers',
    href: '/influencers',
    icon: UserGroupIcon,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: Analytics01Icon,
  },
  {
    title: 'Reports',
    href: '/reports',
    icon: ChartRadarIcon,
  },
  {
    title: 'Channel Lookup',
    href: '/channel-lookup',
    icon: Search02Icon,
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings01Icon,
  },
];

export const AppSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.push('/sign-in'),
      },
    });
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <Sidebar className='border-r border-sidebar-border bg-sidebar text-sidebar-foreground'>
      <SidebarHeader className='px-4 py-6'>
        <div className='flex items-center gap-3.5'>
          {/* Refined Minimal Logo */}
          <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-sidebar-primary to-sidebar-accent text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20'>
            <span className='font-heading text-sm font-bold tracking-tighter'>GRA</span>
          </div>
          <div className='flex flex-col gap-0.5'>
            <span className='font-heading text-sm font-bold tracking-tight text-sidebar-foreground'>
              Tax Dashboard
            </span>
            <span className='text-[10px] font-medium tracking-wider text-sidebar-foreground/50 uppercase'>
              Influencer Division
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className='px-2'>
        <SidebarGroup>
          <SidebarGroupLabel className='mb-2 px-2 text-[10px] font-bold tracking-widest text-sidebar-foreground/40 uppercase'>
            Platform
          </SidebarGroupLabel>
          <SidebarMenu className='space-y-1'>
            {navItems.map(({ icon, href, title }) => {
              const active = isActive(href);
              return (
                <SidebarMenuItem key={title}>
                  <SidebarMenuButton
                    isActive={active}
                    render={<Link href={href as Route} />}
                    className={`
                      relative h-10 w-full justify-start gap-3 overflow-hidden rounded-lg px-3 transition-all duration-200
                      ${
                        active
                          ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground shadow-sm'
                          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                      }
                    `}
                  >
                    {active && (
                      <span className='absolute top-1/2 left-0 h-full w-0.75 -translate-y-1/2 bg-sidebar-primary shadow-[0_0_12px_rgba(var(--sidebar-primary),0.5)]' />
                    )}
                    <HugeiconsIcon
                      icon={icon}
                      size={18}
                      className={`shrink-0 transition-colors ${active ? 'text-sidebar-primary' : 'text-sidebar-foreground/60'}`}
                    />
                    <span className='truncate tracking-tight'>{title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className='p-4'>
        <SidebarSeparator className='my-1 opacity-50' />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              variant='destructive'
              onClick={handleSignOut}
              className='group flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sidebar-foreground/60 transition-colors hover:bg-destructive/10 hover:text-destructive'
            >
              <HugeiconsIcon
                icon={Logout03Icon}
                size={18}
                className='transition-colors group-hover:text-destructive'
              />
              <span className='font-medium'>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
