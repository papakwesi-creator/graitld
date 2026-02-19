'use client';

import { useQuery } from 'convex/react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '~convex/_generated/api';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Format a numeric amount (in Ghanaian cedi) into a compact, human-friendly currency string.
 *
 * @param value - The amount in Ghanaian cedi to format
 * @returns A string prefixed with `GH₵`; values >= 1,000,000 use `X.XM`, values >= 1,000 use `X.XK`, otherwise the locale-formatted whole amount
 */
function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `GH\u20B5${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `GH\u20B5${(value / 1_000).toFixed(1)}K`;
  return `GH\u20B5${value.toLocaleString()}`;
}

/**
 * Render a metric card with a label, a prominent value, an optional subtitle, and a decorative gradient accent.
 *
 * @param label - Short uppercase label displayed above the value
 * @param value - Primary metric displayed prominently (string or number)
 * @param subtitle - Optional secondary text shown beneath the value
 * @param accentClass - Optional CSS class applied to the value for emphasis (defaults to foreground color)
 * @returns A React element representing the metric card
 */
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
        {subtitle && <p className='mt-1 text-xs font-medium text-muted-foreground'>{subtitle}</p>}
      </CardContent>
      <div className='absolute -top-6 -right-6 h-24 w-24 rounded-full bg-gradient-to-br from-white/5 to-white/0 blur-2xl dark:from-white/10' />
    </Card>
  );
}

/**
 * Render skeleton placeholders that mimic the dashboard layout while data is loading.
 *
 * @returns A React element containing placeholder skeleton cards arranged to match the dashboard's grid and chart areas.
 */
function DashboardSkeleton() {
  return (
    <div className='space-y-8 p-1'>
      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-32 rounded-2xl' />
        ))}
      </div>
      <div className='grid gap-6 lg:grid-cols-3'>
        <Skeleton className='h-96 rounded-2xl lg:col-span-2' />
        <Skeleton className='h-96 rounded-2xl' />
      </div>
    </div>
  );
}

/**
 * Renders the Overview dashboard for influencer analytics, including metric cards, revenue and tax charts, platform distribution, top influencers, and recent activity.
 *
 * Fetches required data via Convex queries and displays a loading skeleton until summary stats are available.
 *
 * @returns A JSX element representing the overview analytics dashboard.
 */
export default function OverviewPage() {
  const stats = useQuery(api.influencers.getInfluencerStats);
  const revenueData = useQuery(api.analytics.getRevenueByMonth);
  const platformData = useQuery(api.analytics.getPlatformDistribution);
  const topInfluencers = useQuery(api.analytics.getTopInfluencers);
  const recentLogs = useQuery(api.auditLogs.getRecentLogs, { limit: 5 });

  if (stats === undefined) {
    return <DashboardSkeleton />;
  }

  return (
    <div className='stagger-children animate-page-enter mx-auto max-w-[1600px] space-y-8 p-1'>
      {/* Metric cards */}
      <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-4'>
        <MetricCard
          label='Total Influencers'
          value={stats.totalInfluencers}
          subtitle={`${stats.youtubeCount} YouTube, ${stats.tiktokCount} TikTok`}
        />
        <MetricCard
          label='Est. Tax Revenue'
          value={formatCurrency(stats.totalEstimatedTax)}
          subtitle='Annual projection based on current data'
          accentClass='text-accent'
        />
        <MetricCard
          label='Compliance Rate'
          value={`${stats.complianceRate}%`}
          subtitle={`${stats.totalInfluencers - stats.pendingAssessments} assessed / ${stats.totalInfluencers} total`}
          accentClass={
            stats.complianceRate >= 70
              ? 'text-success'
              : stats.complianceRate >= 40
                ? 'text-warning'
                : 'text-destructive'
          }
        />
        <MetricCard
          label='Pending Reviews'
          value={stats.pendingAssessments}
          subtitle='Awaiting tax assessment'
          accentClass='text-gold'
        />
      </div>

      {/* Charts row */}
      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Revenue trend */}
        <Card className='glass-panel rounded-2xl border-0 p-0 lg:col-span-2'>
          <CardHeader className='flex-row items-center justify-between px-6 pt-6'>
            <CardTitle className='font-heading text-sm font-bold tracking-widest text-muted-foreground uppercase'>
              Revenue &amp; Tax Trend
            </CardTitle>
            <div className='flex gap-2'>
              <span className='flex items-center gap-1.5 text-[10px] font-medium tracking-wider text-muted-foreground uppercase'>
                <span className='h-2 w-2 rounded-full bg-[oklch(0.6_0.18_250)]'></span> Revenue
              </span>
              <span className='flex items-center gap-1.5 text-[10px] font-medium tracking-wider text-muted-foreground uppercase'>
                <span className='h-2 w-2 rounded-full bg-[oklch(0.65_0.18_150)]'></span> Tax
              </span>
            </div>
          </CardHeader>

          <CardContent className='px-6 pb-6'>
            {revenueData && revenueData.length > 0 ? (
              <div className='h-[300px] w-full'>
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
                      tickFormatter={(v) => formatCurrency(v)}
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
                      formatter={(value: any) => formatCurrency(Number(value))}
                    />
                    <Area
                      type='monotone'
                      dataKey='revenue'
                      name='Est. Revenue'
                      stroke='var(--chart-1)'
                      strokeWidth={3}
                      fill='url(#gradRevenue)'
                      activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--chart-1)' }}
                    />
                    <Area
                      type='monotone'
                      dataKey='tax'
                      name='Est. Tax'
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
                No data yet. Add influencers to see trends.
              </div>
            )}
          </CardContent>
        </Card>
        {/* Platform distribution */}
        <Card className='glass-panel rounded-2xl border-0 p-0'>
          <CardHeader className='px-6 pt-6'>
            <CardTitle className='font-heading text-sm font-bold tracking-widest text-muted-foreground uppercase'>
              Platform Split
            </CardTitle>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            {platformData && (platformData[0].value > 0 || platformData[1].value > 0) ? (
              <div className='flex h-[300px] flex-col items-center justify-center'>
                <ResponsiveContainer width='100%' height={220}>
                  <PieChart>
                    <Pie
                      data={platformData}
                      cx='50%'
                      cy='50%'
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={6}
                      dataKey='value'
                      strokeWidth={0}
                      cornerRadius={6}
                    >
                      {platformData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index === 0 ? 'var(--chart-4)' : 'var(--chart-5)'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      itemStyle={{ color: 'var(--foreground)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className='mt-4 grid w-full grid-cols-2 gap-4 px-4'>
                  {platformData.map((p, i) => (
                    <div
                      key={p.name}
                      className='flex flex-col items-center rounded-lg bg-secondary/50 p-2'
                    >
                      <span className='text-xs font-medium text-muted-foreground uppercase'>
                        {p.name}
                      </span>
                      <div className='mt-1 flex items-center gap-2'>
                        <span
                          className='h-2 w-2 rounded-full'
                          style={{ backgroundColor: i === 0 ? 'var(--chart-4)' : 'var(--chart-5)' }}
                        />
                        <span className='text-lg font-bold'>{p.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className='flex h-48 items-center justify-center text-sm text-muted-foreground'>
                No influencers yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: Top influencers & Activity */}
      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Top influencers */}
        <Card className='glass-panel rounded-2xl border-0 p-0'>
          <CardHeader className='flex-row items-center justify-between px-6 pt-6'>
            <CardTitle className='font-heading text-sm font-bold tracking-widest text-muted-foreground uppercase'>
              Top Influencers
            </CardTitle>
            <Button variant='link' className='h-auto p-0 text-xs font-medium text-accent'>
              View All
            </Button>
          </CardHeader>

          <CardContent className='px-6 pb-6'>
            {topInfluencers && topInfluencers.length > 0 ? (
              <div className='space-y-4'>
                {topInfluencers.slice(0, 5).map((inf, i) => (
                  <div
                    key={inf._id}
                    className='group flex items-center justify-between rounded-xl border border-transparent bg-secondary/30 p-3 transition-all hover:border-border hover:bg-secondary/60'
                  >
                    <div className='flex items-center gap-4'>
                      <span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background font-mono text-xs font-bold text-muted-foreground shadow-sm transition-transform group-hover:scale-110 group-hover:text-foreground'>
                        {i + 1}
                      </span>
                      <div>
                        <p className='font-heading text-sm font-semibold'>{inf.name}</p>
                        <p className='text-xs text-muted-foreground'>
                          @{inf.handle} &middot; <span className='capitalize'>{inf.platform}</span>
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <span className='block font-mono text-sm font-medium text-foreground'>
                        {formatCurrency(inf.estimatedAnnualRevenue ?? 0)}
                      </span>
                      <span className='text-[10px] tracking-wide text-muted-foreground uppercase'>
                        Est. Revenue
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className='py-12 text-center text-sm text-muted-foreground'>
                No influencers added yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card className='glass-panel rounded-2xl border-0 p-0'>
          <CardHeader className='flex-row items-center justify-between px-6 pt-6'>
            <CardTitle className='font-heading text-sm font-bold tracking-widest text-muted-foreground uppercase'>
              Recent Activity
            </CardTitle>
            <Button variant='link' className='h-auto p-0 text-xs font-medium text-accent'>
              View All
            </Button>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            {recentLogs && recentLogs.length > 0 ? (
              <div className='relative space-y-6 pl-2'>
                {/* Timeline line */}
                <div className='absolute top-2 bottom-4 left-[11px] w-px bg-border/50' />

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
                      {log.details && (
                        <p className='mt-1 text-xs text-muted-foreground'>{log.details}</p>
                      )}
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
