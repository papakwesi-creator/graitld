import { redirect } from 'next/navigation';

import { isAuthenticated } from '@/lib/auth-server';

/**
 * Redirects authenticated users to the app root and renders `children` inside a `<main>` for unauthenticated users.
 *
 * @param children - Content to render when the user is not authenticated
 * @returns A React element containing `children` wrapped in a `<main>` element
 */
export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAuthenticated();
  if (authed) {
    redirect('/');
  }

  return <main>{children}</main>;
}