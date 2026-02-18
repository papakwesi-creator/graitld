import { redirect } from 'next/navigation';

import { isAuthenticated } from '@/lib/auth-server';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAuthenticated();
  if (authed) {
    redirect('/');
  }

  return <main>{children}</main>;
}
