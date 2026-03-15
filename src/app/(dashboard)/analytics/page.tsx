'use client';

import { useQuery } from 'convex/react';
import {
  Bar,
  BarChart,
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

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAnalyticsStatus, formatCurrency, formatRevenueSource } from '@/lib/product';

const COMPLIANCE_COLORS: Record<string, string> = {
  compliant: 'oklch(0.55 0.16 150)',
  'non-compliant': 'oklch(0.55 0.22 27)',
  pending: 'oklch(0.72 0.12 80)',
  'under-review': 'oklch(0.6 0.12 200)',
};

function AnalyticsSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='grid gap-6 lg:grid-cols-2'>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className='h-80 rounded-xl' />
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const metrics = useQuery(api.analytics.getDashboardMetrics);
  const compliance = useQuery(api.analytics.getComplianceBreakdown);
  const topChannels = useQuery(api.analytics.getTopInfluencers);

  if (metrics === undefined || compliance === undefined || topChannels === undefined) {
    return <AnalyticsSkeleton />;
  }

  const trackData = [
    {
      label: 'Public only',
      value: metrics.publicOnlyChannels,
      fill: 'var(--chart-1)',
    },
    {
      label: 'Manual inputs',
      value: metrics.manualInputChannels,
      fill: 'var(--chart-2)',
    },
    {
      label: 'Connected analytics',
      value: metrics.connectedAnalyticsChannels,
      fill: 'var(--chart-3)',
    },
    {
      label: 'Action required',
      value: metrics.actionRequiredChannels,
      fill: 'var(--warning)',
    },
  ];

  return (
    <div className='stagger-children space-y-6'>
      <div className='grid gap-4 sm:grid-cols-3'>
        <Card size='sm'>
          <CardHeader>
            <CardTitle className='text-xs font-medium tracking-wider text-muted-foreground uppercase'>
              Estimated Tax Output
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='font-heading text-2xl font-bold text-chart-5'>
              {formatCurrency(metrics.totalTaxLiability)}
            </p>
          </CardContent>
        </Card>
        <Card size='sm'>
          <CardHeader>
            <CardTitle className='text-xs font-medium tracking-wider text-muted-foreground uppercase'>
              Connected Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='font-heading text-2xl font-bold text-success'>
              {metrics.connectedAnalyticsChannels}
            </p>
          </CardContent>
        </Card>
        <Card size='sm'>
          <CardHeader>
            <CardTitle className='text-xs font-medium tracking-wider text-muted-foreground uppercase'>
              Channels Needing Review
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='font-heading text-2xl font-bold text-warning'>
              {metrics.actionRequiredChannels}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='font-heading text-sm font-semibold tracking-wider text-muted-foreground uppercase'>
              Track Coverage
            </CardTitle>
            <CardDescription>
              Public imports, manual inputs, and connected analytics stay separate.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trackData.some((item) => item.value > 0) ? (
              <ResponsiveContainer width='100%' height={280}>
                <BarChart data={trackData} layout='vertical'>
                  <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' horizontal={false} />
                  <XAxis type='number' tick={{ fontSize: 11 }} stroke='var(--muted-foreground)' />
                  <YAxis
                    dataKey='label'
                    type='category'
                    tick={{ fontSize: 11 }}
                    stroke='var(--muted-foreground)'
                    width={120}
                  />
                  <Tooltip
                    formatter={(value) => Number(Array.isArray(value) ? value[0] ?? 0 : value ?? 0)}
                    contentStyle={{
                      backgroundColor: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey='value' radius={[0, 4, 4, 0]}>
                    {trackData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className='flex h-64 items-center justify-center text-sm text-muted-foreground'>
                No source coverage data available yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='font-heading text-sm font-semibold tracking-wider text-muted-foreground uppercase'>
              Compliance Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {compliance.some((entry) => entry.count > 0) ? (
              <div className='flex flex-col items-center'>
                <ResponsiveContainer width='100%' height={220}>
                  <PieChart>
                    <Pie
                      data={compliance.filter((entry) => entry.count > 0)}
                      cx='50%'
                      cy='50%'
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey='count'
                      nameKey='status'
                      strokeWidth={0}
                    >
                      {compliance
                        .filter((entry) => entry.count > 0)
                        .map((entry) => (
                          <Cell
                            key={entry.status}
                            fill={COMPLIANCE_COLORS[entry.status] ?? 'oklch(0.5 0 0)'}
                          />
                        ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className='mt-2 flex flex-wrap justify-center gap-4 text-xs'>
                  {compliance
                    .filter((entry) => entry.count > 0)
                    .map((entry) => (
                      <div key={entry.status} className='flex items-center gap-2'>
                        <span
                          className='h-2.5 w-2.5 rounded-full'
                          style={{ backgroundColor: COMPLIANCE_COLORS[entry.status] }}
                        />
                        <span className='text-muted-foreground capitalize'>
                          {entry.status.replace('-', ' ')}: {entry.count}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className='flex h-48 items-center justify-center text-sm text-muted-foreground'>
                No compliance data yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle className='font-heading text-sm font-semibold tracking-wider text-muted-foreground uppercase'>
              Source Risk Review
            </CardTitle>
            <CardDescription>
              Prioritize channels where provenance, connection status, or missing data needs follow-up.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topChannels.length > 0 ? (
              <div className='space-y-3'>
                {topChannels.slice(0, 6).map((channel) => {
                  const score = channel.complianceScore ?? 50;
                  const risk = channel.actionRequired || score < 40 ? 'High' : score < 70 ? 'Medium' : 'Low';
                  const riskVariant =
                    risk === 'High'
                      ? 'destructive'
                      : risk === 'Medium'
                        ? ('secondary' as const)
                        : ('default' as const);

                  return (
                    <div
                      key={channel._id}
                      className='flex flex-col gap-3 rounded-lg px-3 py-3 hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between'
                    >
                      <div>
                        <p className='text-sm font-medium'>{channel.name}</p>
                        <p className='text-xs text-muted-foreground'>
                          {formatRevenueSource(channel.revenueSource)} • {formatAnalyticsStatus(channel.analyticsStatus)}
                        </p>
                        <p className='mt-1 text-xs text-muted-foreground'>
                          {channel.estimatedAnnualRevenue !== undefined
                            ? `${formatCurrency(channel.estimatedAnnualRevenue)} annual input tracked`
                            : 'No confirmed revenue input yet'}
                        </p>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Badge
                          variant={riskVariant}
                          className={
                            risk === 'Medium'
                              ? 'bg-warning/10 text-warning'
                              : risk === 'Low'
                                ? 'bg-success/10 text-success'
                                : undefined
                          }
                        >
                          {risk} Risk
                        </Badge>
                        <Badge variant='outline'>{formatAnalyticsStatus(channel.analyticsStatus)}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className='flex h-40 items-center justify-center text-sm text-muted-foreground'>
                No channels available for analytics review.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
