'use client';

import {
  Alert01Icon,
  CheckmarkCircle02Icon,
  Link01Icon,
  Search01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMutation } from 'convex/react';
import Image from 'next/image';
import React, { useMemo, useState } from 'react';
import { api } from '~convex/_generated/api';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Skeleton } from '@/components/ui/skeleton';

const upsertYoutubeInfluencerRef = api.influencers.upsertYoutubeInfluencer;

type LookupResult = {
  name: string;
  handle: string;
  channelId: string;
  customUrl?: string;
  profileImageUrl?: string;
  description?: string;
  subscribers?: number;
  subscriberCountHidden: boolean;
  totalViews?: number;
  totalVideos?: number;
  avgEngagementRate?: number;
  country?: string;
  channelCreatedAt?: number;
  uploadsPlaylistId?: string;
  topicCategories: string[];
};

type LookupResponse = LookupResult | { error?: string };

function isLookupResult(data: LookupResponse): data is LookupResult {
  return 'channelId' in data;
}

function formatNumber(value?: number) {
  if (value === undefined) return '--';
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function formatDate(timestamp?: number) {
  if (!timestamp) return '--';
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function normalizeHandle(handle: string) {
  return handle.startsWith('@') ? handle.slice(1) : handle;
}

export default function ChannelLookupPage() {
  const upsertYoutubeInfluencer = useMutation(upsertYoutubeInfluencerRef);

  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);
  const [sourceLookupValue, setSourceLookupValue] = useState('');
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const hasLookup = useMemo(() => Boolean(result || error), [result, error]);

  const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setSourceLookupValue('');
    setImportMessage(null);

    try {
      const response = await fetch(`/api/youtube/channel?q=${encodeURIComponent(trimmed)}`, {
        cache: 'no-store',
      });
      const data: LookupResponse = await response.json();

      if (!response.ok || !isLookupResult(data)) {
        setError(
          ('error' in data ? data.error : undefined) ?? 'Failed to look up that YouTube channel.',
        );
        return;
      }

      setResult({ ...data });
      setSourceLookupValue(trimmed);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : 'Lookup failed.');
      setResult(null);
      setSourceLookupValue('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!result) return;

    setIsImporting(true);
    setImportMessage(null);

    try {
      await upsertYoutubeInfluencer({
        name: result.name,
        handle: normalizeHandle(result.handle),
        channelId: result.channelId,
        sourceLookupValue: sourceLookupValue,
        customUrl: result.customUrl,
        profileImageUrl: result.profileImageUrl,
        description: result.description,
        subscribers: result.subscribers,
        subscriberCountHidden: result.subscriberCountHidden,
        totalViews: result.totalViews,
        avgEngagementRate: result.avgEngagementRate,
        totalVideos: result.totalVideos,
        uploadsPlaylistId: result.uploadsPlaylistId,
        topicCategories: result.topicCategories,
        country: result.country,
        channelCreatedAt: result.channelCreatedAt,
      });

      setImportMessage(
        'Channel imported successfully. Existing records are updated by channel ID.',
      );
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Import failed.');
      setImportMessage(null);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className='space-y-6'>
      <div className='rounded-xl border border-border/60 bg-card p-6'>
        <div className='mb-4'>
          <h2 className='font-heading text-base font-semibold'>Channel Lookup</h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            Look up public YouTube channel data by handle, channel ID, or URL, then import it into
            the registry.
          </p>
          <p className='mt-2 text-xs text-muted-foreground'>
            Revenue and monetization metrics are not exposed by the public YouTube Data API.
          </p>
          <p className='mt-1 text-xs text-muted-foreground'>
            Supported inputs: `@handle`, `UC...` channel IDs, `youtube.com/@handle`,
            `youtube.com/channel/...`, `youtube.com/user/...`, and `youtube.com/c/...`.
          </p>
        </div>

        <form onSubmit={handleSearch} className='flex gap-3 max-sm:flex-col'>
          <InputGroup className='flex-1 bg-background'>
            <InputGroupAddon align='inline-start'>
              <HugeiconsIcon icon={Search01Icon} size={16} className='text-muted-foreground' />
            </InputGroupAddon>
            <InputGroupInput
              type='text'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Enter @handle, channel ID, or YouTube channel URL'
            />
          </InputGroup>
          <Button
            type='submit'
            disabled={!query.trim() || isLoading}
            className='gap-2'
            variant='outline'
          >
            <HugeiconsIcon icon={Link01Icon} size={16} />
            {isLoading ? 'Looking up...' : 'Check'}
          </Button>
        </form>
      </div>

      {isLoading && (
        <div className='rounded-xl border border-border/60 bg-card p-6'>
          <div className='flex gap-4'>
            <Skeleton className='h-16 w-16 rounded-full' />
            <div className='flex-1 space-y-2'>
              <Skeleton className='h-5 w-48' />
              <Skeleton className='h-4 w-64' />
              <Skeleton className='h-4 w-full' />
            </div>
          </div>
        </div>
      )}

      {!isLoading && error && (
        <div className='rounded-xl border border-warning/30 bg-warning/5 p-6'>
          <div className='mb-3 flex items-center gap-2'>
            <HugeiconsIcon icon={Alert01Icon} size={18} className='text-warning' />
            <Badge className='bg-warning/15 text-warning'>Lookup Failed</Badge>
          </div>
          <p className='text-sm text-warning-foreground'>{error}</p>
        </div>
      )}

      {!isLoading && result && (
        <div className='space-y-4 rounded-xl border border-border/60 bg-card p-6'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
            <div className='flex items-start gap-4'>
              {result.profileImageUrl ? (
                <Image
                  src={result.profileImageUrl}
                  alt={result.name}
                  width={64}
                  height={64}
                  className='h-16 w-16 rounded-full border border-border/60 object-cover'
                />
              ) : (
                <div className='flex h-16 w-16 items-center justify-center rounded-full border border-border/60 bg-muted text-sm font-semibold text-muted-foreground'>
                  {result.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className='space-y-2'>
                <div>
                  <h3 className='font-heading text-lg font-semibold'>{result.name}</h3>
                  <p className='text-sm text-muted-foreground'>
                    @{normalizeHandle(result.handle)}
                    {result.customUrl ? ` • ${result.customUrl}` : ''}
                  </p>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <Badge variant='outline'>YouTube</Badge>
                  <Badge variant='outline'>Channel ID: {result.channelId}</Badge>
                  {result.country ? <Badge variant='outline'>{result.country}</Badge> : null}
                </div>
              </div>
            </div>

            <Button onClick={handleImport} disabled={isImporting} className='gap-2'>
              <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} />
              {isImporting ? 'Importing...' : 'Import Channel'}
            </Button>
          </div>

          {result.description ? (
            <p className='text-sm leading-6 text-muted-foreground'>{result.description}</p>
          ) : null}

          <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
            <div className='rounded-lg border border-border/60 bg-background p-4'>
              <p className='text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                Subscribers
              </p>
              <p className='mt-2 text-xl font-semibold'>
                {result.subscriberCountHidden ? 'Hidden' : formatNumber(result.subscribers)}
              </p>
            </div>
            <div className='rounded-lg border border-border/60 bg-background p-4'>
              <p className='text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                Total Views
              </p>
              <p className='mt-2 text-xl font-semibold'>{formatNumber(result.totalViews)}</p>
            </div>
            <div className='rounded-lg border border-border/60 bg-background p-4'>
              <p className='text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                Total Videos
              </p>
              <p className='mt-2 text-xl font-semibold'>{formatNumber(result.totalVideos)}</p>
            </div>
            <div className='rounded-lg border border-border/60 bg-background p-4'>
              <p className='text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                Avg. Engagement
              </p>
              <p className='mt-2 text-xl font-semibold'>
                {result.avgEngagementRate !== undefined ? `${result.avgEngagementRate}%` : '--'}
              </p>
            </div>
          </div>

          <div className='grid gap-4 sm:grid-cols-2'>
            <div className='rounded-lg border border-border/60 bg-background p-4'>
              <p className='text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                Channel Created
              </p>
              <p className='mt-2 text-sm font-medium'>{formatDate(result.channelCreatedAt)}</p>
            </div>
            <div className='rounded-lg border border-border/60 bg-background p-4'>
              <p className='text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                Revenue Data
              </p>
              <p className='mt-2 text-sm text-muted-foreground'>
                Not available from public YouTube Data API lookup.
              </p>
            </div>
          </div>

          {result.topicCategories.length > 0 ? (
            <div className='flex flex-wrap gap-2'>
              {result.topicCategories.map((topic) => (
                <Badge key={topic} variant='secondary' className='max-w-full truncate'>
                  {topic}
                </Badge>
              ))}
            </div>
          ) : null}

          {importMessage ? (
            <div className='rounded-lg border border-success/30 bg-success/5 p-4 text-sm text-success'>
              {importMessage}
            </div>
          ) : null}
        </div>
      )}

      {!isLoading && !hasLookup && (
        <div className='rounded-xl border border-dashed border-border/60 bg-muted/10 p-6 text-sm text-muted-foreground'>
          Start with a public YouTube channel handle, channel ID, or full channel URL.
        </div>
      )}
    </div>
  );
}
