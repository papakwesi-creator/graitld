'use client';

import { Authenticated } from 'convex/react';
import type { ReactNode } from 'react';

import { AppSidebar } from '@/components/app-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export function DashboardLayoutClient({ children }: { children: ReactNode }) {
  return (
    <Authenticated>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <DashboardHeader />
          <main className="flex-1 px-6 pb-8 pt-4">
            <div className="animate-page-enter">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </Authenticated>
  );
}
