'use client';

import {
  Add01Icon,
  Alert01Icon,
  Clock01Icon,
  Search01Icon,
  TiktokIcon,
  UserGroupIcon,
  ViewIcon,
  YoutubeIcon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMutation } from 'convex/react';
import { useState } from 'react';
import { api } from '~convex/_generated/api';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';

// ── Mock Social Blade API ────────────────────────────────────────────
// Returns simulated channel data for any given handle/URL.
// In production, this would call the real Social Blade or YouTube/TikTok APIs.

type ChannelData = {
  name: string;
  handle: string;
  platform: 'youtube' | 'tiktok';
  profileImageUrl: string;
  subscribers: number;
  totalViews: number;
  totalVideos: number;
  avgEngagementRate: number;
  estimatedMonthlyRevenue: number;
  estimatedAnnualRevenue: number;
  country: string;
  channelCreated: string;
  category: string;
  recentGrowth: number; // subscriber growth % last 30d
  grade: string; // Social Blade letter grade
};

type LookupHistoryEntry = {
  handle: string;
  platform: 'youtube' | 'tiktok';
  name: string;
  timestamp: number;
};

// Deterministic mock data based on handle string
function mockSocialBladeAPI(query: string): Promise<ChannelData | null> {
  return new Promise((resolve) => {
    setTimeout(
      () => {
        // Parse platform from URL or default to youtube
        let platform: 'youtube' | 'tiktok' = 'youtube';
        let handle = query.trim();

        if (handle.includes('tiktok.com') || handle.toLowerCase().includes('tiktok')) {
          platform = 'tiktok';
        }

        // Strip URL parts
        handle = handle
          .replace(/https?:\/\/(www\.)?(youtube\.com|tiktok\.com)\/(channel\/|@|c\/)?/gi, '')
          .replace(/\?.*$/, '')
          .replace(/^@/, '')
          .trim();

        if (!handle) {
          resolve(null);
          return;
        }

        // Generate deterministic-ish mock data from handle
        const seed = handle.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        const rand = (min: number, max: number) =>
          Math.floor((((seed * 9301 + 49297) % 233280) / 233280) * (max - min) + min);

        const subscribers = rand(5000, 2500000);
        const totalViews = subscribers * rand(50, 300);
        const totalVideos = rand(50, 800);
        const engRate = parseFloat((rand(10, 85) / 10).toFixed(1));
        const monthlyRev = rand(500, 45000);

        const grades = ['A++', 'A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C'];
        const categories = [
          'Entertainment',
          'Comedy',
          'Education',
          'Music',
          'Lifestyle',
          'Technology',
          'Gaming',
          'Fashion',
          'Food',
          'Travel',
        ];

        const ghanaNames = [
          'Kwame Asante',
          'Ama Serwaa',
          'Kofi Mensah',
          'Abena Pokua',
          'Yaw Boateng',
          'Akosua Agyeman',
          'Kwesi Appiah',
          'Efua Sutherland',
          'Nana Aba',
          'Kojo Antwi',
          'Adwoa Safo',
          'Fiifi Coleman',
        ];

        resolve({
          name: ghanaNames[seed % ghanaNames.length],
          handle: `@${handle}`,
          platform,
          profileImageUrl: '',
          subscribers,
          totalViews,
          totalVideos,
          avgEngagementRate: engRate,
          estimatedMonthlyRevenue: monthlyRev,
          estimatedAnnualRevenue: monthlyRev * 12,
          country: 'Ghana',
          channelCreated: `${2015 + (seed % 8)}-${String((seed % 12) + 1).padStart(2, '0')}-15`,
          category: categories[seed % categories.length],
          recentGrowth: parseFloat((rand(-20, 150) / 10).toFixed(1)),
          grade: grades[seed % grades.length],
        });
      },
      1200 + Math.random() * 800,
    ); // Simulate network latency
  });
}

// ── Formatting helpers ───────────────────────────────────────────────

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `GH\u20B5${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `GH\u20B5${(value / 1_000).toFixed(1)}K`;
  return `GH\u20B5${value.toLocaleString()}`;
}

// ── Page Component ───────────────────────────────────────────────────

export default function ChannelLookupPage() {
  const createInfluencer = useMutation(api.influencers.createInfluencer);

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<ChannelData | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addedHandles, setAddedHandles] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<LookupHistoryEntry[]>([]);

  const handleSearch = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError('');
    setResult(null);
    setHasSearched(true);

    try {
      const data = await mockSocialBladeAPI(query);
      if (data) {
        setResult(data);
        // Add to history
        setHistory((prev) => {
          const next = [
            {
              handle: data.handle,
              platform: data.platform,
              name: data.name,
              timestamp: Date.now(),
            },
            ...prev.filter((h) => h.handle !== data.handle),
          ].slice(0, 10);
          return next;
        });
      } else {
        setError('No channel found for that handle or URL. Please check and try again.');
      }
    } catch {
      setError('Failed to fetch channel data. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToSystem = async () => {
    if (!result) return;
    setIsAdding(true);
    try {
      await createInfluencer({
        name: result.name,
        platform: result.platform,
        handle: result.handle.replace('@', ''),
        subscribers: result.subscribers,
        totalViews: result.totalViews,
        totalVideos: result.totalVideos,
        avgEngagementRate: result.avgEngagementRate,
        estimatedMonthlyRevenue: result.estimatedMonthlyRevenue,
        estimatedAnnualRevenue: result.estimatedAnnualRevenue,
        complianceStatus: 'pending',
        region: 'Greater Accra',
        taxLiability: Math.round(result.estimatedAnnualRevenue * 0.25),
      });
      setAddedHandles((prev) => new Set(prev).add(result.handle));
    } catch (err) {
      console.error('Failed to add influencer:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const alreadyAdded = result ? addedHandles.has(result.handle) : false;

  return (
    <div className='space-y-6'>
      {/* Search Section */}
      <div className='rounded-xl border border-border/60 bg-card p-6'>
        <div className='mb-4'>
          <h2 className='font-heading text-base font-semibold'>Search Channel</h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            Enter a YouTube or TikTok handle, channel name, or URL to look up channel metrics via
            Social Blade.
          </p>
        </div>

        <form onSubmit={handleSearch} className='flex gap-3'>
          <InputGroup className='flex-1 bg-background'>
            <InputGroupAddon align='inline-start'>
              <HugeiconsIcon icon={Search01Icon} size={16} className='text-muted-foreground' />
            </InputGroupAddon>
            <InputGroupInput
              type='text'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='e.g. @kwameasante, youtube.com/@channel, tiktok.com/@user'
            />
          </InputGroup>
          <Button
            type='submit'
            disabled={isSearching || !query.trim()}
            className='gap-2 bg-accent text-accent-foreground hover:bg-accent/90'
          >
            {isSearching ? (
              <>
                <span className='inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground' />
                Searching...
              </>
            ) : (
              <>
                <HugeiconsIcon icon={Search01Icon} size={16} />
                Lookup
              </>
            )}
          </Button>
        </form>

        <div className='mt-3 flex gap-2'>
          <span className='text-xs text-muted-foreground'>Try:</span>
          {['kwameasante', 'amaserwaa', 'tiktok.com/@kofi_comedy'].map((example) => (
            <button
              key={example}
              type='button'
              onClick={() => {
                setQuery(example);
              }}
              className='rounded-md bg-muted/60 px-2 py-0.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            >
              {example}
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {isSearching && (
        <div className='rounded-xl border border-border/60 bg-card p-6'>
          <div className='flex items-center gap-3'>
            <div className='h-16 w-16 animate-pulse rounded-full bg-muted' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-5 w-48' />
              <Skeleton className='h-4 w-32' />
            </div>
          </div>
          <div className='mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-20 w-full rounded-lg' />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isSearching && (
        <div className='flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4'>
          <HugeiconsIcon icon={Alert01Icon} size={20} className='shrink-0 text-destructive' />
          <p className='text-sm text-destructive'>{error}</p>
        </div>
      )}

      {/* Result Card */}
      {result && !isSearching && (
        <div className='animate-page-enter space-y-6'>
          {/* Channel Header */}
          <div className='rounded-xl border border-border/60 bg-card p-6'>
            <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
              <div className='flex items-center gap-4'>
                {/* Profile avatar placeholder */}
                <div className='flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-accent/20 to-gold/20 font-heading text-xl font-bold text-accent'>
                  {result.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')}
                </div>
                <div>
                  <div className='flex items-center gap-2'>
                    <h3 className='font-heading text-lg font-semibold'>{result.name}</h3>
                    <Badge
                      className={`text-[10px] font-semibold uppercase ${
                        result.platform === 'youtube'
                          ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400'
                          : 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-400'
                      }`}
                    >
                      {result.platform}
                    </Badge>
                    <span className='rounded-md bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold'>
                      {result.grade}
                    </span>
                  </div>
                  <p className='mt-0.5 font-mono text-sm text-muted-foreground'>{result.handle}</p>
                  <div className='mt-1 flex items-center gap-3 text-xs text-muted-foreground'>
                    <span>{result.country}</span>
                    <span className='text-border'>|</span>
                    <span>{result.category}</span>
                    <span className='text-border'>|</span>
                    <span>Since {result.channelCreated.slice(0, 4)}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleAddToSystem}
                disabled={isAdding || alreadyAdded}
                className={`gap-2 ${
                  alreadyAdded
                    ? 'bg-success/10 text-success'
                    : 'bg-accent text-accent-foreground hover:bg-accent/90'
                }`}
              >
                {alreadyAdded ? (
                  'Added to System'
                ) : isAdding ? (
                  <>
                    <span className='inline-block h-4 w-4 animate-spin rounded-full border-2 border-accent-foreground/30 border-t-accent-foreground' />
                    Adding...
                  </>
                ) : (
                  <>
                    <HugeiconsIcon icon={Add01Icon} size={16} />
                    Add to System
                  </>
                )}
              </Button>
            </div>

            {/* Metrics Grid */}
            <div className='mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              <MetricTile
                icon={UserGroupIcon}
                label='Subscribers'
                value={formatNumber(result.subscribers)}
                detail={`${result.recentGrowth > 0 ? '+' : ''}${result.recentGrowth}% last 30d`}
                detailPositive={result.recentGrowth > 0}
              />
              <MetricTile
                icon={ViewIcon}
                label='Total Views'
                value={formatNumber(result.totalViews)}
                detail={`${formatNumber(result.totalVideos)} videos`}
              />
              <MetricTile
                icon={result.platform === 'youtube' ? YoutubeIcon : TiktokIcon}
                label='Engagement Rate'
                value={`${result.avgEngagementRate}%`}
                detail={result.avgEngagementRate > 3.5 ? 'Above average' : 'Below average'}
                detailPositive={result.avgEngagementRate > 3.5}
              />
              <MetricTile
                icon={Alert01Icon}
                label='Est. Annual Revenue'
                value={formatCurrency(result.estimatedAnnualRevenue)}
                detail={`${formatCurrency(result.estimatedMonthlyRevenue)}/mo`}
              />
            </div>
          </div>

          {/* Tax Implication Preview */}
          <div className='rounded-xl border border-border/60 bg-card p-6'>
            <h3 className='font-heading text-base font-semibold'>Tax Liability Preview</h3>
            <p className='mt-1 text-xs text-muted-foreground'>
              Estimated based on Ghana Revenue Authority standard rates (25% income tax rate)
            </p>

            <div className='mt-4 grid gap-4 sm:grid-cols-3'>
              <div className='rounded-lg bg-muted/30 p-4'>
                <p className='text-xs font-medium tracking-wider text-muted-foreground uppercase'>
                  Estimated Taxable Income
                </p>
                <p className='mt-1 font-heading text-xl font-semibold'>
                  {formatCurrency(result.estimatedAnnualRevenue)}
                </p>
              </div>
              <div className='rounded-lg bg-muted/30 p-4'>
                <p className='text-xs font-medium tracking-wider text-muted-foreground uppercase'>
                  Tax Rate
                </p>
                <p className='mt-1 font-heading text-xl font-semibold'>25%</p>
              </div>
              <div className='rounded-lg bg-accent/5 p-4'>
                <p className='text-xs font-medium tracking-wider text-accent uppercase'>
                  Estimated Tax Liability
                </p>
                <p className='mt-1 font-heading text-xl font-semibold text-accent'>
                  {formatCurrency(Math.round(result.estimatedAnnualRevenue * 0.25))}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state — before any search */}
      {!hasSearched && !isSearching && (
        <div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-card/50 py-16 text-center'>
          <div className='flex h-14 w-14 items-center justify-center rounded-full bg-muted/60'>
            <HugeiconsIcon icon={Search01Icon} size={24} className='text-muted-foreground' />
          </div>
          <h3 className='mt-4 font-heading text-base font-semibold'>Look up any channel</h3>
          <p className='mt-1 max-w-sm text-sm text-muted-foreground'>
            Search for a YouTube or TikTok channel by handle or URL to view their metrics, estimated
            revenue, and potential tax liability.
          </p>
        </div>
      )}

      {/* Recent Lookups */}
      {history.length > 0 && (
        <div className='rounded-xl border border-border/60 bg-card p-6'>
          <h3 className='mb-4 font-heading text-base font-semibold'>Recent Lookups</h3>
          <div className='space-y-2'>
            {history.map((entry) => (
              <button
                key={entry.handle + entry.timestamp}
                onClick={() => {
                  setQuery(entry.handle.replace('@', ''));
                  // Auto-search
                  setIsSearching(true);
                  setError('');
                  setResult(null);
                  setHasSearched(true);
                  mockSocialBladeAPI(entry.handle.replace('@', '')).then((data) => {
                    if (data) setResult(data);
                    else setError('Channel not found.');
                    setIsSearching(false);
                  });
                }}
                className='flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-muted/40'
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    entry.platform === 'youtube'
                      ? 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400'
                      : 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400'
                  }`}
                >
                  <HugeiconsIcon
                    icon={entry.platform === 'youtube' ? YoutubeIcon : TiktokIcon}
                    size={16}
                  />
                </div>
                <div className='flex-1'>
                  <p className='text-sm font-medium'>{entry.name}</p>
                  <p className='font-mono text-xs text-muted-foreground'>{entry.handle}</p>
                </div>
                <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                  <HugeiconsIcon icon={Clock01Icon} size={12} />
                  <span>
                    {new Date(entry.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Metric Tile ──────────────────────────────────────────────────────

function MetricTile({
  icon,
  label,
  value,
  detail,
  detailPositive,
}: {
  icon: typeof UserGroupIcon;
  label: string;
  value: string;
  detail?: string;
  detailPositive?: boolean;
}) {
  return (
    <div className='metric-card rounded-lg border border-border/40 bg-background/50 p-4'>
      <div className='flex items-center gap-2 text-muted-foreground'>
        <HugeiconsIcon icon={icon} size={14} />
        <span className='text-xs font-medium tracking-wider uppercase'>{label}</span>
      </div>
      <p className='mt-2 font-heading text-xl font-semibold'>{value}</p>
      {detail && (
        <p
          className={`mt-1 text-xs ${
            detailPositive === true
              ? 'text-success'
              : detailPositive === false
                ? 'text-destructive'
                : 'text-muted-foreground'
          }`}
        >
          {detail}
        </p>
      )}
    </div>
  );
}
