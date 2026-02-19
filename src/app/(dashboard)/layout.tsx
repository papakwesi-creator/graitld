import { redirect } from 'next/navigation';

import { AppSidebar } from '@/components/app-sidebar';
import { DashboardHeader } from '@/components/dashboard-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { isAuthenticated } from '@/lib/auth-server';

/**
 * Render the dashboard shell and ensure the user is authenticated.
 *
 * Performs an authentication check and redirects to `/sign-in` when the user is not authenticated. When authenticated, renders the dashboard layout containing the sidebar, header, and a main content area that displays the provided `children`.
 *
 * @param children - The page content to render inside the dashboard's main area
 * @returns The dashboard layout React element
 */
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
