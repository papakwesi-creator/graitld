'use client';

import { useQuery } from 'convex/react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '~convex/_generated/api';

import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCompactNumber, formatCurrency, formatRevenueSource } from '@/lib/product';

function MetricCard({
  label,
  value,
  subtitle,
  accentClass,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  accentClass?: string;
}) {
  return (
    <Card className='glass-panel hover-card-effect relative overflow-hidden rounded-2xl border-0 p-0 transition-all duration-300'>
      <CardContent className='relative z-10 p-6'>
        <p className='font-heading text-xs font-bold tracking-widest text-muted-foreground/80 uppercase'>
          {label}
        </p>
        <div className='mt-3 flex items-baseline gap-2'>
          <p
            className={`font-heading text-3xl font-bold tracking-tight ${accentClass ?? 'text-foreground'}`}
          >
            {value}
          </p>
        </div>
        {subtitle ? <p className='mt-1 text-xs font-medium text-muted-foreground'>{subtitle}</p> : null}
      </CardContent>
      <div className='absolute -top-6 -right-6 h-24 w-24 rounded-full bg-linear-to-br from-white/5 to-white/0 blur-2xl dark:from-white/10' />
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className='space-y-8'>
      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className='h-32 rounded-2xl' />
        ))}
      </div>
      <div className='grid gap-6 lg:grid-cols-3'>
        <Skeleton className='h-96 rounded-2xl lg:col-span-2' />
        <Skeleton className='h-96 rounded-2xl' />
      </div>
    </div>
  );
}

export default function OverviewPage() {
  const stats = useQuery(api.influencers.getInfluencerStats);
  const revenueData = useQuery(api.analytics.getRevenueByMonth);
  const topChannels = useQuery(api.analytics.getTopInfluencers);
  const recentLogs = useQuery(api.auditLogs.getRecentLogs, { limit: 5 });

  if (stats === undefined) {
    return <DashboardSkeleton />;
  }

  return (
    <div className='stagger-children mx-auto w-full max-w-[1600px] space-y-8'>
      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        <MetricCard
          label='Tracked Channels'
          value={stats.totalChannels}
          subtitle={`${stats.publicOnlyChannels} public-only records, ${stats.connectedAnalyticsChannels} with connected analytics`}
        />
        <MetricCard
          label='Estimated Tax Output'
          value={formatCurrency(stats.totalEstimatedTax, { compact: true })}
          subtitle='Derived separately from public metadata and source inputs'
          accentClass='text-chart-5'
        />
        <MetricCard
          label='Manual Input Coverage'
          value={stats.manualInputChannels}
          subtitle='Channels with manual financial values recorded'
          accentClass='text-success'
        />
        <MetricCard
          label='Action Required'
          value={stats.actionRequiredChannels}
          subtitle='Reconnect, refresh, or provenance review needed'
          accentClass='text-gold'
        />
      </div>

      <div className='grid gap-6 lg:grid-cols-3'>
        <Card className='glass-panel rounded-2xl border-0 p-0 lg:col-span-2'>
          <CardHeader className='px-6 pt-6'>
            <CardTitle className='font-heading text-sm font-bold tracking-widest text-muted-foreground uppercase'>
              Revenue Inputs &amp; Tax Estimates
            </CardTitle>
            <CardAction>
              <div className='flex gap-2'>
                <span className='flex items-center gap-1.5 text-[10px] font-medium tracking-wider text-muted-foreground uppercase'>
                  <span className='h-2 w-2 rounded-full bg-[oklch(0.6_0.18_250)]' /> Revenue inputs
                </span>
                <span className='flex items-center gap-1.5 text-[10px] font-medium tracking-wider text-muted-foreground uppercase'>
                  <span className='h-2 w-2 rounded-full bg-[oklch(0.65_0.18_150)]' /> Tax estimates
                </span>
              </div>
            </CardAction>
          </CardHeader>

          <CardContent className='px-6 pb-6'>
            {revenueData && revenueData.length > 0 ? (
              <div className='h-72 w-full'>
                <ResponsiveContainer width='100%' height='100%'>
                  <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id='gradRevenue' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor='var(--chart-1)' stopOpacity={0.3} />
                        <stop offset='95%' stopColor='var(--chart-1)' stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id='gradTax' x1='0' y1='0' x2='0' y2='1'>
                        <stop offset='5%' stopColor='var(--chart-2)' stopOpacity={0.3} />
                        <stop offset='95%' stopColor='var(--chart-2)' stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray='3 3'
                      stroke='var(--border)'
                      opacity={0.4}
                      vertical={false}
                    />
                    <XAxis
                      dataKey='month'
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                      dy={10}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => formatCurrency(value, { compact: true })}
                      dx={-10}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        fontSize: '12px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      }}
                      itemStyle={{ color: 'var(--foreground)' }}
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                    <Area
                      type='monotone'
                      dataKey='revenue'
                      name='Revenue input'
                      stroke='var(--chart-1)'
                      strokeWidth={3}
                      fill='url(#gradRevenue)'
                      activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--chart-1)' }}
                    />
                    <Area
                      type='monotone'
                      dataKey='tax'
                      name='Tax estimate'
                      stroke='var(--chart-2)'
                      strokeWidth={3}
                      fill='url(#gradTax)'
                      activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--chart-2)' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className='flex h-64 items-center justify-center text-sm text-muted-foreground'>
                No source-aware financial history yet. Add manual inputs or calculate estimates to
                see trends.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='glass-panel rounded-2xl border-0 p-0'>
          <CardHeader className='px-6 pt-6'>
            <CardTitle className='font-heading text-sm font-bold tracking-widest text-muted-foreground uppercase'>
              Product Tracks
            </CardTitle>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            <div className='space-y-4'>
              <div className='rounded-2xl border border-border/60 bg-background/70 p-4'>
                <p className='text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                  Public YouTube lookup
                </p>
                <p className='mt-2 text-3xl font-bold'>{stats.publicOnlyChannels}</p>
                <p className='mt-2 text-sm text-muted-foreground'>
                  Public metadata imports without revenue access.
                </p>
              </div>
              <div className='rounded-2xl border border-border/60 bg-background/70 p-4'>
                <p className='text-[10px] font-semibold tracking-wider text-muted-foreground uppercase'>
                  Connected analytics
                </p>
                <p className='mt-2 text-3xl font-bold'>{stats.connectedAnalyticsChannels}</p>
                <p className='mt-2 text-sm text-muted-foreground'>
                  Owner-authorized channels with stronger analytics inputs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card className='glass-panel rounded-2xl border-0 p-0'>
          <CardHeader className='px-6 pt-6'>
            <CardTitle className='font-heading text-sm font-bold tracking-widest text-muted-foreground uppercase'>
              Priority Channels
            </CardTitle>
            <CardAction>
              <Button variant='link' render={<Link href='/influencers' />} className='h-auto p-0 text-xs font-medium text-primary'>
                View All
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent className='px-6 pb-6'>
            {topChannels && topChannels.length > 0 ? (
              <div className='space-y-4'>
                {topChannels.slice(0, 5).map((channel, index) => (
                  <div
                    key={channel._id}
                    className='group flex items-center justify-between rounded-xl border border-transparent bg-secondary/30 p-3 transition-all hover:border-border hover:bg-secondary/60'
                  >
                    <div className='flex items-center gap-4'>
                      <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background font-mono text-xs font-bold text-muted-foreground shadow-sm transition-transform group-hover:scale-110 group-hover:text-foreground'>
                        {index + 1}
                      </span>
                      <div>
                        <p className='font-heading text-sm font-semibold'>{channel.name}</p>
                        <p className='text-xs text-muted-foreground'>@{channel.handle}</p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <span className='block font-mono text-sm font-medium text-foreground'>
                        {channel.estimatedAnnualRevenue !== undefined
                          ? formatCurrency(channel.estimatedAnnualRevenue, { compact: true })
                          : channel.totalViews !== undefined
                            ? `${formatCompactNumber(channel.totalViews)} views`
                            : '--'}
                      </span>
                      <span className='text-[10px] tracking-wide text-muted-foreground uppercase'>
                        {channel.estimatedAnnualRevenue !== undefined
                          ? formatRevenueSource(channel.revenueSource)
                          : 'Public signal'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='py-12 text-center text-sm text-muted-foreground'>
                No channels added yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card className='glass-panel rounded-2xl border-0 p-0'>
          <CardHeader className='px-6 pt-6'>
            <CardTitle className='font-heading text-sm font-bold tracking-widest text-muted-foreground uppercase'>
              Recent Activity
            </CardTitle>
            <CardAction>
              <Button variant='link' render={<Link href='/analytics' />} className='h-auto p-0 text-xs font-medium text-primary'>
                View All
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            {recentLogs && recentLogs.length > 0 ? (
              <div className='relative space-y-6 pl-2'>
                <div className='absolute top-2 bottom-4 left-[13px] w-px bg-border/50' />

                {recentLogs.map((log) => (
                  <div key={log._id} className='relative flex items-start gap-4'>
                    <div className='relative z-10 mt-1.5 flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full bg-background ring-2 ring-border'>
                      <div className='h-1.5 w-1.5 rounded-full bg-accent' />
                    </div>
                    <div className='flex-1 rounded-xl bg-secondary/20 p-3 transition-colors hover:bg-secondary/40'>
                      <div className='flex items-start justify-between'>
                        <p className='text-sm font-medium text-foreground'>
                          <span className='font-bold text-primary'>{log.userName ?? 'System'}</span>{' '}
                          {log.action.replace(/_/g, ' ')}
                        </p>
                        <span className='font-mono text-[10px] text-muted-foreground'>
                          {new Date(log.timestamp).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      {log.details ? (
                        <p className='mt-1 text-xs text-muted-foreground'>{log.details}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='py-12 text-center text-sm text-muted-foreground'>
                No activity recorded yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
