'use client';

import {
  Clock01Icon,
  InformationCircleIcon,
  Moon02Icon,
  Settings01Icon,
  Sun01Icon,
  UserCircleIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useQuery } from 'convex/react';
import { useState } from 'react';
import { api } from '~convex/_generated/api';

import { useTheme } from '@/components/theme-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ── Settings Page ────────────────────────────────────────────────────

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const recentLogs = useQuery(api.auditLogs.getRecentLogs, { limit: 15 });

  const tabs = [
    { id: 'profile' as const, label: 'Profile', icon: UserCircleIcon },
    { id: 'appearance' as const, label: 'Appearance', icon: Sun01Icon },
    { id: 'activity' as const, label: 'Activity Log', icon: Clock01Icon },
    { id: 'about' as const, label: 'About', icon: InformationCircleIcon },
  ];

  return (
    <Tabs defaultValue='profile' className='space-y-6'>
      <TabsList className='w-full justify-between sm:w-fit sm:justify-start'>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className='gap-2 px-4'>
            <HugeiconsIcon icon={tab.icon} size={16} />
            <span className='hidden sm:inline'>{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value='profile' className='animate-page-enter'>
        <ProfileSection />
      </TabsContent>
      <TabsContent value='appearance' className='animate-page-enter'>
        <AppearanceSection theme={theme} setTheme={setTheme} />
      </TabsContent>
      <TabsContent value='activity' className='animate-page-enter'>
        <ActivitySection logs={recentLogs} />
      </TabsContent>
      <TabsContent value='about' className='animate-page-enter'>
        <AboutSection />
      </TabsContent>
    </Tabs>
  );
}

// ── Profile Section ──────────────────────────────────────────────────

function ProfileSection() {
  // In a production app, this would come from the auth session
  const [name, setName] = useState('GRA Officer');
  const [email, setEmail] = useState('officer@gra.gov.gh');
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulated save
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 600);
  };

  return (
    <div className='space-y-6'>
      <div className='rounded-xl border border-border/60 bg-card p-6'>
        <h2 className='font-heading text-base font-semibold'>Profile Information</h2>
        <p className='mt-1 text-sm text-muted-foreground'>
          Your account details and role assignment.
        </p>

        <form onSubmit={handleSave} className='mt-6 space-y-5'>
          {/* Avatar + Role */}
          <div className='flex items-center gap-4'>
            <div className='flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent/20 to-gold/20 font-heading text-lg font-bold text-accent'>
              {name
                .split(' ')
                .map((n: string) => n[0])
                .join('')}
            </div>
            <div>
              <p className='font-medium'>{name}</p>
              <div className='mt-1 flex items-center gap-2'>
                <Badge className='border-gold/30 bg-gold/10 text-[10px] font-semibold text-gold uppercase'>
                  Tax Officer
                </Badge>
                <span className='text-xs text-muted-foreground'>Influencer Division</span>
              </div>
            </div>
          </div>

          <div className='kente-border rounded-full' />

          {/* Form Fields */}
          <div className='grid gap-5 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium tracking-wider text-muted-foreground uppercase'>
                Full Name
              </Label>
              <Input
                type='text'
                value={name}
                onChange={(e) => setName(e.target.value)}
                className='bg-background'
              />
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium tracking-wider text-muted-foreground uppercase'>
                Email Address
              </Label>
              <Input
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className='bg-background'
              />
            </div>
          </div>

          <div className='grid gap-5 sm:grid-cols-2'>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium tracking-wider text-muted-foreground uppercase'>
                Role
              </Label>
              <Input
                type='text'
                value='Tax Officer'
                disabled
                className='bg-muted/40'
              />
              <p className='text-[11px] text-muted-foreground'>
                Contact an administrator to change your role.
              </p>
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium tracking-wider text-muted-foreground uppercase'>
                Department
              </Label>
              <Input
                type='text'
                value='Influencer Tax Division'
                disabled
                className='bg-muted/40'
              />
            </div>
          </div>

          <div className='flex items-center gap-3 pt-2'>
            <Button
              type='submit'
              disabled={isSaving}
              className='bg-accent text-accent-foreground hover:bg-accent/90'
            >
              {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
            </Button>
            {saved && <span className='text-sm text-success'>Profile updated successfully.</span>}
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className='rounded-xl border border-destructive/20 bg-card p-6'>
        <h3 className='text-sm font-semibold text-destructive'>Danger Zone</h3>
        <p className='mt-1 text-sm text-muted-foreground'>
          Irreversible actions that affect your account.
        </p>
        <div className='mt-4 flex items-center justify-between rounded-lg border border-destructive/10 bg-destructive/5 p-4'>
          <div>
            <p className='text-sm font-medium'>Delete Account</p>
            <p className='text-xs text-muted-foreground'>
              Permanently remove your account and all associated data.
            </p>
          </div>
          <Button
            variant='outline'
            size='sm'
            className='border-destructive/30 text-destructive hover:bg-destructive/10'
            onClick={() =>
              alert(
                'Account deletion requires administrator approval. Please contact your supervisor.',
              )
            }
          >
            Request Deletion
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Appearance Section ───────────────────────────────────────────────

function AppearanceSection({
  theme,
  setTheme,
}: {
  theme: string;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
}) {
  const themes = [
    {
      id: 'light' as const,
      label: 'Light',
      icon: Sun01Icon,
      description: 'Warm ivory surfaces with deep navy text',
      preview: 'bg-[oklch(0.975_0.005_85)]',
    },
    {
      id: 'dark' as const,
      label: 'Dark',
      icon: Moon02Icon,
      description: 'Rich navy-black with cream text and gold accents',
      preview: 'bg-[oklch(0.14_0.02_250)]',
    },
    {
      id: 'system' as const,
      label: 'System',
      icon: Settings01Icon,
      description: 'Follows your operating system preference',
      preview: 'bg-gradient-to-r from-[oklch(0.975_0.005_85)] to-[oklch(0.14_0.02_250)]',
    },
  ];

  return (
    <div className='rounded-xl border border-border/60 bg-card p-6'>
      <h2 className='font-heading text-base font-semibold'>Appearance</h2>
      <p className='mt-1 text-sm text-muted-foreground'>
        Customize how the dashboard looks on your device.
      </p>

      <div className='mt-6 grid gap-4 sm:grid-cols-3'>
        {themes.map((t) => (
          <button
            key={t.id}
            onClick={() => setTheme(t.id)}
            className={`group relative rounded-xl border-2 p-4 text-left transition-all ${
              theme === t.id
                ? 'border-accent bg-accent/5 shadow-sm'
                : 'border-border/60 hover:border-border'
            }`}
          >
            {/* Preview swatch */}
            <div className={`mb-3 h-20 rounded-lg border border-border/40 ${t.preview}`}>
              {/* Mini UI preview */}
              <div className='flex h-full items-center justify-center'>
                <HugeiconsIcon
                  icon={t.icon}
                  size={24}
                  className={theme === t.id ? 'text-accent' : 'text-muted-foreground'}
                />
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <p className='text-sm font-medium'>{t.label}</p>
              {theme === t.id && (
                <span className='rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent'>
                  Active
                </span>
              )}
            </div>
            <p className='mt-0.5 text-xs text-muted-foreground'>{t.description}</p>
          </button>
        ))}
      </div>

      {/* Additional Appearance Options */}
      <div className='mt-6 space-y-4 border-t border-border/60 pt-6'>
        <h3 className='text-sm font-semibold'>Display Options</h3>

        <div className='flex items-center justify-between rounded-lg border border-border/40 bg-background/50 p-4'>
          <div>
            <p className='text-sm font-medium'>Compact Mode</p>
            <p className='text-xs text-muted-foreground'>
              Reduce spacing and padding for denser information display.
            </p>
          </div>
          <ToggleSwitch defaultChecked={false} disabled />
        </div>

        <div className='flex items-center justify-between rounded-lg border border-border/40 bg-background/50 p-4'>
          <div>
            <p className='text-sm font-medium'>Animations</p>
            <p className='text-xs text-muted-foreground'>
              Page transitions and micro-interactions.
            </p>
          </div>
          <ToggleSwitch defaultChecked={true} disabled />
        </div>
      </div>
    </div>
  );
}

// ── Activity Log Section ─────────────────────────────────────────────

type AuditLog = {
  _id: string;
  _creationTime: number;
  action: string;
  entityType: string;
  entityId?: string;
  userName?: string;
  userId?: string;
  details?: string;
  timestamp: number;
};

function ActivitySection({ logs }: { logs: AuditLog[] | undefined }) {
  if (logs === undefined) {
    return (
      <div className='rounded-xl border border-border/60 bg-card p-6'>
        <Skeleton className='h-6 w-40' />
        <Skeleton className='mt-2 h-4 w-64' />
        <div className='mt-6 space-y-3'>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className='h-14 w-full' />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='rounded-xl border border-border/60 bg-card p-6'>
      <h2 className='font-heading text-base font-semibold'>Activity Log</h2>
      <p className='mt-1 text-sm text-muted-foreground'>
        Recent system activity and audit trail for compliance tracking.
      </p>

      {logs.length === 0 ? (
        <div className='mt-8 flex flex-col items-center py-8 text-center'>
          <div className='flex h-12 w-12 items-center justify-center rounded-full bg-muted/60'>
            <HugeiconsIcon icon={Clock01Icon} size={20} className='text-muted-foreground' />
          </div>
          <p className='mt-3 text-sm text-muted-foreground'>
            No activity recorded yet. Actions like creating or updating influencer records will
            appear here.
          </p>
        </div>
      ) : (
        <div className='mt-6 space-y-1'>
          {logs.map((log) => (
            <div
              key={log._id}
              className='flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/20'
            >
              <div className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted/60'>
                <ActionIcon action={log.action} />
              </div>
              <div className='flex-1'>
                <p className='text-sm'>
                  <span className='font-medium'>{log.userName ?? 'System'}</span>{' '}
                  <span className='text-muted-foreground'>{formatAction(log.action)}</span>
                  {log.entityType && (
                    <span className='ml-1 rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground'>
                      {log.entityType}
                    </span>
                  )}
                </p>
                {log.details && (
                  <p className='mt-0.5 text-xs text-muted-foreground'>{log.details}</p>
                )}
              </div>
              <span className='shrink-0 text-[11px] text-muted-foreground'>
                {formatTimestamp(log.timestamp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── About Section ────────────────────────────────────────────────────

function AboutSection() {
  return (
    <div className='space-y-6'>
      <div className='rounded-xl border border-border/60 bg-card p-6'>
        <div className='flex items-center gap-4'>
          <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gold font-heading text-sm font-bold text-gold-foreground'>
            GRA
          </div>
          <div>
            <h2 className='font-heading text-base font-semibold'>GRA Influencer Tax Dashboard</h2>
            <p className='text-sm text-muted-foreground'>Version 1.0.0 — Final Year Project</p>
          </div>
        </div>

        <div className='kente-border mt-5 rounded-full' />

        <div className='mt-5 space-y-4'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <InfoRow label='Organization' value='Ghana Revenue Authority' />
            <InfoRow label='Division' value='Influencer Tax Division' />
            <InfoRow label='Platform' value='Next.js + Convex' />
            <InfoRow label='License' value='Internal Use Only' />
          </div>
        </div>
      </div>

      <div className='rounded-xl border border-border/60 bg-card p-6'>
        <h3 className='text-sm font-semibold'>System Information</h3>
        <div className='mt-4 grid gap-3 sm:grid-cols-2'>
          <InfoRow label='Frontend' value='Next.js 16 + React 19' />
          <InfoRow label='Backend' value='Convex (Real-time)' />
          <InfoRow label='Authentication' value='Better Auth' />
          <InfoRow label='Styling' value='Tailwind CSS v4' />
          <InfoRow label='Charts' value='Recharts' />
          <InfoRow label='Icons' value='Hugeicons' />
        </div>
      </div>

      <div className='rounded-xl border border-border/60 bg-card p-6'>
        <h3 className='text-sm font-semibold'>Purpose</h3>
        <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>
          This dashboard enables Ghana Revenue Authority officers to assess, track, and manage tax
          liabilities for social media influencers operating within Ghana. It integrates channel
          metrics from platforms like YouTube and TikTok to estimate taxable income and ensure
          compliance with Ghanaian tax regulations.
        </p>
      </div>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex items-center justify-between rounded-lg border border-border/40 bg-background/50 px-4 py-3'>
      <span className='text-xs font-medium tracking-wider text-muted-foreground uppercase'>
        {label}
      </span>
      <span className='text-sm font-medium'>{value}</span>
    </div>
  );
}

function ToggleSwitch({
  defaultChecked,
  disabled,
}: {
  defaultChecked: boolean;
  disabled?: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <button
      type='button'
      role='switch'
      aria-checked={checked}
      disabled={disabled}
      onClick={() => setChecked(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${
        checked ? 'bg-accent' : 'bg-muted'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function ActionIcon({ action }: { action: string }) {
  const size = 12;
  const className = 'text-muted-foreground';

  if (action.includes('create') || action.includes('add')) {
    return <span className='text-[10px] font-bold text-success'>+</span>;
  }
  if (action.includes('delete') || action.includes('remove')) {
    return <span className='text-[10px] font-bold text-destructive'>-</span>;
  }
  if (action.includes('update') || action.includes('edit')) {
    return <HugeiconsIcon icon={Settings01Icon} size={size} className={className} />;
  }
  return <HugeiconsIcon icon={Clock01Icon} size={size} className={className} />;
}

function formatAction(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toLowerCase());
}

function formatTimestamp(ts: number): string {
  const now = Date.now();
  const diff = now - ts;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

  return new Date(ts).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}
