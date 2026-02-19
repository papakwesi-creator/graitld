'use client';

import {
  Clock01Icon,
  Moon02Icon,
  Settings01Icon,
  Sun01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useQuery } from 'convex/react';
import { api } from '~convex/_generated/api';

import { useTheme } from '@/components/theme-provider';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
                {log.details && <p className='mt-0.5 text-xs text-muted-foreground'>{log.details}</p>}
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
