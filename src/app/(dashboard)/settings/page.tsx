'use client';

import { useState } from 'react';

import { Clock01Icon, Moon02Icon, Settings01Icon, Sun01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useQuery } from 'convex/react';
import { api } from '~convex/_generated/api';

import { useTheme } from '@/components/theme-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

/**
 * Renders the settings page UI with tabbed sections for Profile, Appearance, Activity Log, and About.
 *
 * Uses the current theme from `useTheme()` and provides it to the Appearance section; also fetches recent audit logs and supplies them to the Activity section. The default active tab is Profile.
 *
 * @returns A React element containing the complete settings page and its tabbed content.
 */

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const recentLogs = useQuery(api.auditLogs.getRecentLogs, { limit: 15 });

  const tabs = [
    { id: 'appearance' as const, label: 'Appearance', icon: Sun01Icon },
    { id: 'activity' as const, label: 'Activity Log', icon: Clock01Icon },
  ];

  return (
    <Tabs defaultValue='appearance' className='space-y-6'>
      <TabsList className='w-full justify-between sm:w-fit sm:justify-start'>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.id} value={tab.id} className='gap-2 px-4'>
            <HugeiconsIcon icon={tab.icon} size={16} />
            <span className='hidden sm:inline'>{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value='appearance'>
        <AppearanceSection theme={theme} setTheme={setTheme} />
      </TabsContent>
      <TabsContent value='activity'>
        <ActivitySection logs={recentLogs} />
      </TabsContent>
    </Tabs>
  );
}

/**
 * Render the profile information and account management section for the current user.
 *
 * Renders editable fields for full name and email with a simulated save flow that shows saving and success states, an avatar derived from the name, role and department readouts, and a "Danger Zone" area to request account deletion.
 *
 * Clicking "Save Changes" simulates a save operation and shows a transient success message. Clicking "Request Deletion" shows an alert requiring administrator approval.
 *
 * @returns The rendered JSX element for the profile section.
 */

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
              <Input type='text' value='Tax Officer' disabled className='bg-muted/40' />
              <p className='text-[11px] text-muted-foreground'>
                Contact an administrator to change your role.
              </p>
            </div>
            <div className='space-y-1.5'>
              <Label className='text-xs font-medium tracking-wider text-muted-foreground uppercase'>
                Department
              </Label>
              <Input type='text' value='Influencer Tax Division' disabled className='bg-muted/40' />
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

/**
 * Renders the Appearance settings panel allowing the user to preview and select a theme.
 *
 * Renders three theme options (Light, Dark, System) with live previews and an active indicator,
 * and displays non-interactive display option toggles (Compact Mode and Animations).
 *
 * @param theme - The currently selected theme id; expected values are `'light'`, `'dark'`, or `'system'`.
 * @param setTheme - Callback invoked with the selected theme id (`'light' | 'dark' | 'system'`) when a theme option is chosen.
 * @returns A React element containing the appearance settings UI.
 */

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
      description: 'High-contrast light interface',
      preview: 'bg-[oklch(0.985_0.002_240)]',
    },
    {
      id: 'dark' as const,
      label: 'Dark',
      icon: Moon02Icon,
      description: 'High-contrast dark interface',
      preview: 'bg-[oklch(0.12_0.04_265)]',
    },
    {
      id: 'system' as const,
      label: 'System',
      icon: Settings01Icon,
      description: 'Follow operating system preference',
      preview: 'bg-gradient-to-r from-[oklch(0.985_0.002_240)] to-[oklch(0.12_0.04_265)]',
    },
  ];

  return (
    <div className='rounded-xl border border-border/60 bg-card p-6'>
      <h2 className='font-heading text-base font-semibold'>Appearance</h2>
      <p className='mt-1 text-sm text-muted-foreground'>
        Choose how the dashboard theme is applied across pages.
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
            <div className={`mb-3 h-20 rounded-lg border border-border/40 ${t.preview}`}>
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
    </div>
  );
}

type AuditLog = {
  _id: string;
  action: string;
  entityType: string;
  userName?: string;
  details?: string;
  timestamp: number;
};

/**
 * Render the Activity Log section displaying recent audit entries, a loading skeleton, or an empty-state message.
 *
 * When `logs` is `undefined`, a loading skeleton is rendered. When `logs` is an empty array, a centered
 * empty-state message is shown. When `logs` contains entries, each entry displays the actor (`userName` or
 * "System"), a human-readable action label, an optional entity type badge, optional details, and a formatted timestamp.
 *
 * @param logs - Array of audit log entries to display, or `undefined` while loading
 * @returns A React element representing the activity log section
 */
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
          <p className='mt-3 text-sm text-muted-foreground'>No activity recorded yet.</p>
        </div>
      ) : (
        <div className='mt-6 space-y-1'>
          {logs.map((log) => (
            <div
              key={log._id}
              className='flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-muted/20'
            >
              <div className='mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted/60'>
                <HugeiconsIcon icon={Clock01Icon} size={12} className='text-muted-foreground' />
              </div>
              <div className='flex-1'>
                <p className='text-sm'>
                  <span className='font-medium'>{log.userName ?? 'System'}</span>{' '}
                  <span className='text-muted-foreground'>
                    {log.action.replace(/_/g, ' ').toLowerCase()}
                  </span>
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
                {new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Render the About section of the Settings page.
 *
 * Renders three informational cards: branding and basic project details, system
 * information (frontend, backend, auth, styling, charts, icons), and a short
 * purpose description for the dashboard.
 *
 * @returns A JSX element containing branding, system information, and purpose cards for the Settings page
 */

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

/**
 * Renders a two-column information row with an uppercase label on the left and a value on the right.
 *
 * @param label - The left-side label text (rendered uppercase and styled as a muted label)
 * @param value - The right-side value text (rendered as the main value)
 * @returns A JSX element containing the labeled row
 */

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

/**
 * Renders a binary toggle switch that manages its own checked state.
 *
 * The switch initializes its state from `defaultChecked`, updates its visual and
 * `aria-checked` state when toggled, and ignores click interactions when `disabled` is true.
 *
 * @param defaultChecked - Initial checked state of the switch
 * @param disabled - When true, the switch is non-interactive and appears disabled
 * @returns A JSX element rendering the toggle switch; `aria-checked` reflects the current checked state
 */
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

/**
 * Render a compact visual indicator for an audit/activity action string.
 *
 * Maps common action keywords to distinct icons or symbols:
 * - contains "create" or "add": a small green plus sign
 * - contains "delete" or "remove": a small destructive minus sign
 * - contains "update" or "edit": a settings icon
 * - otherwise: a clock icon
 *
 * @param action - The action text used to determine which icon to display
 * @returns A JSX element representing the action icon or symbol
 */
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

/**
 * Convert an action identifier into a human-readable label.
 *
 * @param action - The action identifier (typically snake_case or underscore-separated)
 * @returns The action with underscores replaced by spaces and the first letter of each word lowercased
 */
function formatAction(action: string): string {
  return action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toLowerCase());
}

/**
 * Format a Unix timestamp into a concise human-readable relative time or a localized date.
 *
 * @param ts - Timestamp in milliseconds since the Unix epoch
 * @returns `Just now` for times under 60 seconds; `Xm ago` for minutes; `Xh ago` for hours; `Xd ago` for days (up to 6 days); otherwise a localized date string in `en-GB` format like `12 Feb 2024`
 */
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
