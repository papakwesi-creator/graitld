'use client';

import { Alert01Icon, Link01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useState } from 'react';

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

/**
 * Provides deterministic mock channel metrics for a given channel handle or URL.
 *
 * @param query - Channel handle, username, or full URL (YouTube or TikTok). The function will normalize the input and infer the platform (defaults to YouTube when not explicit).
 * @returns A ChannelData mock object containing metrics and metadata for the resolved handle, or `null` if the input does not resolve to a valid handle.
 */
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

/**
 * Renders the Channel Lookup page UI for searching influencer channels, viewing mocked Social Blade metrics, and adding a channel to the system.
 *
 * Displays a search form, loading and error states, a detailed result card with metrics and tax preview, recent lookups, and controls to add the found channel as an influencer.
 *
 * @returns The React element for the channel lookup page.
 */

export default function ChannelLookupPage() {
  const [query, setQuery] = useState('');
  const [hasAttempted, setHasAttempted] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!query.trim()) return;
    setHasAttempted(true);
  };

  return (
    <div className='space-y-6'>
      <div className='rounded-xl border border-border/60 bg-card p-6'>
        <div className='mb-4'>
          <h2 className='font-heading text-base font-semibold'>Channel Lookup</h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            This feature is disabled until a verified live API integration is configured.
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
              placeholder='Enter channel handle or URL'
            />
          </InputGroup>
          <Button type='submit' disabled={!query.trim()} className='gap-2' variant='outline'>
            <HugeiconsIcon icon={Link01Icon} size={16} />
            Check
          </Button>
        </form>
      </div>

      {(hasAttempted || query.trim()) && (
        <div className='rounded-xl border border-warning/30 bg-warning/5 p-6'>
          <div className='mb-3 flex items-center gap-2'>
            <HugeiconsIcon icon={Alert01Icon} size={18} className='text-warning' />
            <Badge className='bg-warning/15 text-warning'>Unavailable</Badge>
          </div>
          <p className='text-sm text-warning-foreground'>
            Live channel lookup is not connected yet. No mocked or estimated channel data is shown.
          </p>
        </div>
      )}
    </div>
  );
}