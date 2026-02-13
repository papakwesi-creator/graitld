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
    await authClient.signOut();
    router.push('/sign-in');
  };

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <SidebarHeader className="px-4 py-6">
        <div className="flex items-center gap-3.5">
          {/* Refined Minimal Logo */}
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-accent text-sidebar-primary-foreground shadow-lg shadow-sidebar-primary/20">
            <span className="font-heading text-sm font-bold tracking-tighter">GRA</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-heading text-sm font-bold tracking-tight text-sidebar-foreground">
              Tax Dashboard
            </span>
            <span className="text-[10px] font-medium uppercase tracking-wider text-sidebar-foreground/50">
              Influencer Division
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-sidebar-foreground/40">
            Platform
          </SidebarGroupLabel>
          <SidebarMenu className="space-y-1">
            {navItems.map(({ icon, href, title }) => {
              const active = isActive(href);
              return (
                <SidebarMenuItem key={title}>
                  <SidebarMenuButton
                    isActive={active}
                    render={<Link href={href as Route} />}
                    className={`
                      relative h-10 w-full justify-start gap-3 overflow-hidden rounded-lg px-3 transition-all duration-200
                      ${active 
                        ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm' 
                        : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                      }
                    `}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-full w-[3px] -translate-y-1/2 bg-sidebar-primary shadow-[0_0_12px_rgba(var(--sidebar-primary),0.5)]" />
                    )}
                    <HugeiconsIcon
                      icon={icon}
                      size={18}
                      className={`shrink-0 transition-colors ${active ? 'text-sidebar-primary' : 'text-sidebar-foreground/60'}`}
                    />
                    <span className="tracking-tight truncate">{title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="rounded-xl bg-sidebar-accent/30 p-4 border border-sidebar-border/50">
           <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] font-medium uppercase text-sidebar-foreground/50">System Status</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse"/>
                  Operational
                </span>
              </div>
           </div>
        </div>
        <SidebarSeparator className="my-4 opacity-50" />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="group flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sidebar-foreground/60 hover:bg-destructive/10 hover:text-destructive transition-colors"
            >
              <HugeiconsIcon icon={Logout03Icon} size={18} className="group-hover:text-destructive transition-colors" />
              <span className="font-medium">Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
