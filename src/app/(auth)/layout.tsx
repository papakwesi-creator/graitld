import { Unauthenticated } from 'convex/react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Unauthenticated>
      <main>{children}</main>
    </Unauthenticated>
  );
}
