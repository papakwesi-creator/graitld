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
import Link from 'next/link';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from './ui/sidebar';

const sidebarItems: {
  title: string;
  href: string;
  icon?: typeof DashboardSquare02Icon;
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
  return (
    <Sidebar>
      {/*<SidebarHeader>

      </SidebarHeader>*/}

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {sidebarItems.map(({ icon, href, title }) => (
              <SidebarMenuItem key={title}>
                <SidebarMenuButton>
                  <Link href={href as Route} className='flex gap-2 items-center'>
                    {icon && <HugeiconsIcon icon={icon} />}
                    <span>{title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>Sign Out</SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};
