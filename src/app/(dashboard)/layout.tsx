import { redirect } from 'next/navigation';

import { AppSidebar } from '@/components/app-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { isAuthenticated } from '@/lib/auth-server';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAuthenticated();
  if (!authed) {
    redirect('/sign-in');
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <DashboardHeader />
        <main className='min-h-[calc(100svh-5rem)] flex-1 px-6 pt-4 pb-8'>
          <div>{children}</div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
