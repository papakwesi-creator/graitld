'use client';

import { Add01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import { api } from '~convex/_generated/api';
import type { Id } from '~convex/_generated/dataModel';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';

const PLATFORMS = ['youtube', 'tiktok'] as const;
const COMPLIANCE_STATUSES = ['compliant', 'non-compliant', 'pending', 'under-review'] as const;
const REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Eastern',
  'Central',
  'Northern',
  'Volta',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
  'Western North',
  'Oti',
  'North East',
  'Savannah',
] as const;

/**
 * Format a numeric amount as a Ghanaian cedi currency string.
 *
 * @param value - The amount in Ghanaian cedi to format
 * @returns The amount prefixed with `GH₵` and formatted with locale-specific thousands separators
 */
function formatCurrency(value: number): string {
  return `GH\u20B5${value.toLocaleString()}`;
}

/**
 * Renders a compact badge for an influencer's compliance status.
 *
 * The displayed label replaces any hyphen in the status with a space and is capitalized by the UI.
 *
 * @param status - Compliance status; commonly one of: `compliant`, `non-compliant`, `pending`, `under-review`
 * @returns A styled span element showing the status label; unknown statuses render with a muted style
 */
function StatusBadge({ status }: { status: string }) {
  const classes: Record<string, string> = {
    'compliant': 'status-compliant',
    'non-compliant': 'status-non-compliant',
    'pending': 'status-pending',
    'under-review': 'status-under-review',
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${classes[status] ?? 'bg-muted text-muted-foreground'}`}
    >
      {status.replace('-', ' ')}
    </span>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <Badge
      className={`text-[10px] font-semibold uppercase ${
        platform === 'youtube'
          ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400'
          : 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-400'
      }`}
    >
      {platform}
    </Badge>
  );
}

/**
 * Renders the Influencers management page with listing, client-side filtering, and an add-influencer UI.
 *
 * The component fetches influencers, allows text/platform/status filtering, and provides controls to create
 * and remove influencers via mutations; it also includes a sheet-driven form for adding new influencers.
 *
 * @returns The React element for the Influencers page.
 */
export default function InfluencersPage() {
  const influencers = useQuery(api.influencers.getInfluencers, {});
  const createInfluencer = useMutation(api.influencers.createInfluencer);
  const deleteInfluencer = useMutation(api.influencers.deleteInfluencer);

  const [search, setSearch] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<(typeof PLATFORMS)[number] | 'all'>(
    'all',
  );
  const [filterStatus, setFilterStatus] = useState<(typeof COMPLIANCE_STATUSES)[number] | 'all'>(
    'all',
  );
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [form, setForm] = useState({
    name: '',
    platform: 'youtube' as 'youtube' | 'tiktok',
    handle: '',
    email: '',
    region: '' as (typeof REGIONS)[number] | '',
    estimatedMonthlyRevenue: '',
    estimatedAnnualRevenue: '',
    taxIdNumber: '',
  });

  if (influencers === undefined) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-10 w-48' />
          <Skeleton className='h-10 w-36' />
        </div>
        <Skeleton className='h-12 w-full' />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className='h-16 w-full' />
        ))}
      </div>
    );
  }

  // Client-side filtering
  let filtered = influencers;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (i) => i.name.toLowerCase().includes(q) || i.handle.toLowerCase().includes(q),
    );
  }
  if (filterPlatform !== 'all') {
    filtered = filtered.filter((i) => i.platform === filterPlatform);
  }
  if (filterStatus !== 'all') {
    filtered = filtered.filter((i) => i.complianceStatus === filterStatus);
  }

  const handleCreate = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!form.name || !form.handle) return;
    setIsCreating(true);
    try {
      const monthlyRev = form.estimatedMonthlyRevenue
        ? parseFloat(form.estimatedMonthlyRevenue)
        : undefined;
      const annualRev = form.estimatedAnnualRevenue
        ? parseFloat(form.estimatedAnnualRevenue)
        : monthlyRev
          ? monthlyRev * 12
          : undefined;

      await createInfluencer({
        name: form.name,
        platform: form.platform,
        handle: form.handle.replace('@', ''),
        email: form.email || undefined,
        region: (form.region || undefined) as (typeof REGIONS)[number] | undefined,
        estimatedMonthlyRevenue: monthlyRev,
        estimatedAnnualRevenue: annualRev,
        taxLiability: annualRev ? Math.round(annualRev * 0.25) : undefined,
        taxIdNumber: form.taxIdNumber || undefined,
        complianceStatus: 'pending',
      });
      setForm({
        name: '',
        platform: 'youtube',
        handle: '',
        email: '',
        region: '',
        estimatedMonthlyRevenue: '',
        estimatedAnnualRevenue: '',
        taxIdNumber: '',
      });
      setShowAddDialog(false);
    } catch (err) {
      console.error('Failed to create influencer:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <p className='text-sm text-muted-foreground'>
            {influencers.length} influencer{influencers.length !== 1 ? 's' : ''} registered
          </p>
        </div>
        <Button
          onClick={() => setShowAddDialog(true)}
          className='gap-2 bg-accent text-accent-foreground hover:bg-accent/90'
        >
          <HugeiconsIcon icon={Add01Icon} size={16} />
          Add Influencer
        </Button>
      </div>

      {/* Filters */}
      <div className='flex flex-wrap gap-3'>
        <InputGroup className='min-w-50 flex-1 bg-card'>
          <InputGroupAddon align='inline-start'>
            <HugeiconsIcon icon={Search01Icon} size={14} className='text-muted-foreground' />
          </InputGroupAddon>
          <InputGroupInput
            type='text'
            placeholder='Search by name or handle...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
        <Select
          value={filterPlatform}
          onValueChange={(value) => {
            if (value) {
              setFilterPlatform(value as (typeof PLATFORMS)[number] | 'all');
            }
          }}
        >
          <SelectTrigger className='min-w-[160px] bg-card'>
            <SelectValue placeholder='All Platforms' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Platforms</SelectItem>
            {PLATFORMS.map((p) => (
              <SelectItem key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filterStatus}
          onValueChange={(value) => {
            if (value) {
              setFilterStatus(value as (typeof COMPLIANCE_STATUSES)[number] | 'all');
            }
          }}
        >
          <SelectTrigger className='min-w-[160px] bg-card'>
            <SelectValue placeholder='All Statuses' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Statuses</SelectItem>
            {COMPLIANCE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Data table */}
      <div className='overflow-hidden rounded-xl border border-border/60 bg-card'>
        <div className='overflow-x-auto'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b border-border/60 bg-muted/30'>
                <th className='px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                  Name
                </th>
                <th className='px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                  Platform
                </th>
                <th className='px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                  Handle
                </th>
                <th className='px-4 py-3 text-left text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                  Region
                </th>
                <th className='px-4 py-3 text-right text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                  Est. Revenue
                </th>
                <th className='px-4 py-3 text-right text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                  Tax Liability
                </th>
                <th className='px-4 py-3 text-center text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                  Status
                </th>
                <th className='px-4 py-3 text-right text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className='px-4 py-12 text-center text-muted-foreground'>
                    {influencers.length === 0
                      ? 'No influencers added yet. Click "Add Influencer" to get started.'
                      : 'No influencers match your filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map((inf) => (
                  <tr
                    key={inf._id}
                    className='border-b border-border/40 transition-colors hover:bg-muted/20'
                  >
                    <td className='px-4 py-3'>
                      <p className='font-medium'>{inf.name}</p>
                      {inf.email && <p className='text-xs text-muted-foreground'>{inf.email}</p>}
                    </td>
                    <td className='px-4 py-3'>
                      <PlatformBadge platform={inf.platform} />
                    </td>
                    <td className='px-4 py-3 font-mono text-xs text-muted-foreground'>
                      @{inf.handle}
                    </td>
                    <td className='px-4 py-3 text-xs text-muted-foreground'>{inf.region ?? '—'}</td>
                    <td className='px-4 py-3 text-right font-mono text-xs'>
                      {inf.estimatedAnnualRevenue
                        ? formatCurrency(inf.estimatedAnnualRevenue)
                        : '—'}
                    </td>
                    <td className='px-4 py-3 text-right font-mono text-xs font-medium text-accent'>
                      {inf.taxLiability ? formatCurrency(inf.taxLiability) : '—'}
                    </td>
                    <td className='px-4 py-3 text-center'>
                      <StatusBadge status={inf.complianceStatus ?? 'pending'} />
                    </td>
                    <td className='px-4 py-3 text-right'>
                      <button
                        onClick={() => deleteInfluencer({ id: inf._id as Id<'influencers'> })}
                        className='text-xs text-destructive/65 hover:text-destructive'
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Influencer Sheet */}
      <Sheet open={showAddDialog} onOpenChange={setShowAddDialog}>
        <SheetContent className='w-full overflow-y-auto p-0 sm:max-w-md'>
          <div className='px-6 pb-6 pt-6'>
            <SheetHeader className='mb-6 p-0'>
              <SheetTitle className='font-heading text-xl font-bold'>Add New Influencer</SheetTitle>
              <SheetDescription>Register a new influencer in the system.</SheetDescription>
            </SheetHeader>

            <form onSubmit={handleCreate} className='space-y-6'>
            <div className='space-y-4'>
              <div className='grid gap-2'>
                <Label
                  htmlFor='name'
                  className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'
                >
                  Full Name *
                </Label>
                <Input
                  id='name'
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder='e.g. Kwame Asante'
                  className='bg-secondary/20'
                />
              </div>

              <div className='grid gap-2'>
                <Label
                  htmlFor='handle'
                  className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'
                >
                  Handle *
                </Label>
                <Input
                  id='handle'
                  value={form.handle}
                  onChange={(e) => setForm({ ...form, handle: e.target.value })}
                  required
                  placeholder='@channel_name'
                  className='bg-secondary/20'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label
                    htmlFor='platform'
                    className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'
                  >
                    Platform *
                  </Label>
                  <Select
                    value={form.platform}
                    onValueChange={(value) =>
                      setForm({ ...form, platform: value as 'youtube' | 'tiktok' })
                    }
                  >
                    <SelectTrigger id='platform' className='bg-secondary/20'>
                      <SelectValue placeholder='Select platform' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='youtube'>YouTube</SelectItem>
                      <SelectItem value='tiktok'>TikTok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='grid gap-2'>
                  <Label
                    htmlFor='region'
                    className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'
                  >
                    Region
                  </Label>
                  <Select
                    value={form.region}
                    onValueChange={(value) =>
                      setForm({ ...form, region: value as (typeof REGIONS)[number] })
                    }
                  >
                    <SelectTrigger id='region' className='bg-secondary/20'>
                      <SelectValue placeholder='Select region' />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className='grid gap-2'>
                <Label
                  htmlFor='email'
                  className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'
                >
                  Email
                </Label>
                <Input
                  id='email'
                  type='email'
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder='email@example.com'
                  className='bg-secondary/20'
                />
              </div>

              <div className='grid gap-2'>
                <Label
                  htmlFor='taxId'
                  className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'
                >
                  Tax ID Number
                </Label>
                <Input
                  id='taxId'
                  value={form.taxIdNumber}
                  onChange={(e) => setForm({ ...form, taxIdNumber: e.target.value })}
                  placeholder='GHA-XXXXX'
                  className='bg-secondary/20'
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='grid gap-2'>
                  <Label
                    htmlFor='monthlyRev'
                    className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'
                  >
                    Est. Monthly (GH&#8373;)
                  </Label>
                  <Input
                    id='monthlyRev'
                    type='number'
                    value={form.estimatedMonthlyRevenue}
                    onChange={(e) => setForm({ ...form, estimatedMonthlyRevenue: e.target.value })}
                    placeholder='0'
                    className='bg-secondary/20'
                  />
                </div>
                <div className='grid gap-2'>
                  <Label
                    htmlFor='annualRev'
                    className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'
                  >
                    Est. Annual (GH&#8373;)
                  </Label>
                  <Input
                    id='annualRev'
                    type='number'
                    value={form.estimatedAnnualRevenue}
                    onChange={(e) => setForm({ ...form, estimatedAnnualRevenue: e.target.value })}
                    placeholder='Auto'
                    className='bg-secondary/20'
                  />
                </div>
              </div>
            </div>

              <div className='flex justify-end gap-3 border-t border-border pt-4'>
                <Button type='button' variant='outline' onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button
                  type='submit'
                  disabled={isCreating}
                  className='bg-primary text-primary-foreground hover:bg-primary/90'
                >
                  {isCreating ? 'Adding...' : 'Add Influencer'}
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}