'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';

/**
 * Render the authentication page for the GRA Tax Dashboard with sign-in and sign-up modes.
 *
 * Displays GRA branding and an authentication form that switches between "sign in" and "create account"
 * modes, shows validation and error states, and manages loading state during submission. On successful
 * authentication the page navigates to the application home.
 *
 * @returns The React element for the sign-in / sign-up page containing branding and the authentication form.
 */
export default function SignInPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signUp') {
        const { error } = await authClient.signUp.email({
          email,
          password,
          name,
        });
        if (error) {
          setError(error.message ?? 'Sign up failed');
          return;
        }
      } else {
        const { error } = await authClient.signIn.email({
          email,
          password,
        });
        if (error) {
          setError(error.message ?? 'Sign in failed');
          return;
        }
      }
      router.push('/');
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='flex min-h-screen'>
      {/* Left panel — GRA branding */}
      <div className='relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[oklch(0.18_0.03_250)] p-12 lg:flex'>
        {/* Decorative geometric pattern */}
        <div className='absolute inset-0 opacity-[0.04]'>
          <svg width='100%' height='100%' xmlns='http://www.w3.org/2000/svg'>
            <defs>
              <pattern id='kente' x='0' y='0' width='60' height='60' patternUnits='userSpaceOnUse'>
                <rect width='60' height='60' fill='none' />
                <rect x='0' y='0' width='15' height='30' fill='currentColor' />
                <rect x='30' y='0' width='15' height='30' fill='currentColor' />
                <rect x='15' y='30' width='15' height='30' fill='currentColor' />
                <rect x='45' y='30' width='15' height='30' fill='currentColor' />
              </pattern>
            </defs>
            <rect width='100%' height='100%' fill='url(#kente)' className='text-white' />
          </svg>
        </div>

        {/* Kente accent stripe */}
        <div className='absolute top-0 left-0 h-full w-[6px]'>
          <div
            className='h-full w-full'
            style={{
              background:
                'repeating-linear-gradient(180deg, #D4A843 0px, #D4A843 20px, #006B3F 20px, #006B3F 40px, #0C1B2A 40px, #0C1B2A 60px)',
            }}
          />
        </div>

        <div className='relative z-10'>
          <div className='flex items-center gap-4'>
            <div className='flex h-14 w-14 items-center justify-center rounded-xl bg-[#D4A843] font-heading text-lg font-bold text-[#0C1B2A]'>
              GRA
            </div>
            <div>
              <h2 className='font-heading text-xl font-bold text-white'>Ghana Revenue Authority</h2>
              <p className='text-sm text-white/50'>Influencer Tax Liability Dashboard</p>
            </div>
          </div>
        </div>

        <div className='relative z-10 space-y-6'>
          <blockquote className='border-l-2 border-[#D4A843] pl-6'>
            <p className='font-heading text-2xl leading-relaxed font-semibold text-white/90'>
              Building a transparent and efficient tax framework for Ghana&apos;s digital economy.
            </p>
          </blockquote>
          <div className='flex gap-8 text-white/40'>
            <div>
              <p className='font-heading text-3xl font-bold text-[#D4A843]'>GH&#8373;</p>
              <p className='mt-1 text-xs tracking-wider uppercase'>Revenue Tracking</p>
            </div>
            <div className='h-12 w-px bg-white/10' />
            <div>
              <p className='font-heading text-3xl font-bold text-[#006B3F]'>2</p>
              <p className='mt-1 text-xs tracking-wider uppercase'>Platforms Monitored</p>
            </div>
            <div className='h-12 w-px bg-white/10' />
            <div>
              <p className='font-heading text-3xl font-bold text-white/70'>16</p>
              <p className='mt-1 text-xs tracking-wider uppercase'>Regions Covered</p>
            </div>
          </div>
        </div>

        <p className='relative z-10 text-xs text-white/30'>
          &copy; {new Date().getFullYear()} Ghana Revenue Authority. All rights reserved.
        </p>
      </div>

      {/* Right panel — Auth form */}
      <div className='flex w-full items-center justify-center bg-background px-6 lg:w-1/2'>
        <div className='w-full max-w-md space-y-8'>
          {/* Mobile logo */}
          <div className='flex items-center gap-3 lg:hidden'>
            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-[#D4A843] font-heading text-sm font-bold text-[#0C1B2A]'>
              GRA
            </div>
            <span className='font-heading text-sm font-semibold'>GRA Tax Dashboard</span>
          </div>

          <div>
            <h1 className='font-heading text-3xl font-bold tracking-tight text-foreground'>
              {mode === 'signIn' ? 'Welcome back' : 'Create account'}
            </h1>
            <p className='mt-2 text-sm text-muted-foreground'>
              {mode === 'signIn'
                ? 'Enter your credentials to access the dashboard.'
                : 'Set up your officer account to get started.'}
            </p>
          </div>

          {error && (
            <div className='rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive'>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className='space-y-5'>
            {mode === 'signUp' && (
              <div className='space-y-2'>
                <Label
                  htmlFor='name'
                  className='text-xs font-medium tracking-wider text-muted-foreground uppercase'
                >
                  Full Name
                </Label>
                <Input
                  id='name'
                  type='text'
                  placeholder='Officer Name'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className='h-10 bg-card px-4'
                />
              </div>
            )}

            <div className='space-y-2'>
              <Label
                htmlFor='email'
                className='text-xs font-medium tracking-wider text-muted-foreground uppercase'
              >
                Email Address
              </Label>
              <Input
                id='email'
                type='email'
                placeholder='officer@gra.gov.gh'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className='h-10 bg-card px-4'
              />
            </div>

            <div className='space-y-2'>
              <Label
                htmlFor='password'
                className='text-xs font-medium tracking-wider text-muted-foreground uppercase'
              >
                Password
              </Label>
              <Input
                id='password'
                type='password'
                placeholder='Enter your password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className='h-10 bg-card px-4'
              />
            </div>

            <Button
              type='submit'
              disabled={loading}
              className='h-10 w-full bg-[oklch(0.22_0.04_250)] text-white hover:bg-[oklch(0.28_0.04_250)]'
            >
              {loading ? (
                <span className='flex items-center justify-center gap-2'>
                  <span className='h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white' />
                  Please wait...
                </span>
              ) : mode === 'signIn' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          <div className='relative'>
            <div className='absolute inset-0 flex items-center'>
              <span className='w-full border-t border-border' />
            </div>
            <div className='relative flex justify-center text-xs uppercase'>
              <span className='bg-background px-2 text-muted-foreground'>or</span>
            </div>
          </div>

          <Button
            type='button'
            onClick={() => {
              setMode(mode === 'signIn' ? 'signUp' : 'signIn');
              setError('');
            }}
            variant='outline'
            className='h-10 w-full'
          >
            {mode === 'signIn'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </Button>
        </div>
      </div>
    </div>
  );
}
