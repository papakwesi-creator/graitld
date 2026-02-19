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

const COMPLIANCE_COLORS: Record<string, string> = {
  'compliant': 'oklch(0.55 0.16 150)',
  'non-compliant': 'oklch(0.55 0.22 27)',
  'pending': 'oklch(0.72 0.12 80)',
  'under-review': 'oklch(0.6 0.12 200)',
};

/**
 * Render a placeholder layout showing four skeleton cards used during loading.
 *
 * @returns A React element containing a responsive two-column grid with four large skeleton blocks
 */
function AnalyticsSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='grid gap-6 lg:grid-cols-2'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-80 rounded-xl' />
        ))}
      </div>
    </div>
  );
}

/**
 * Render the analytics dashboard with summary metrics, charts, and risk assessments.
 *
 * Renders summary cards for key metrics, a tax-gap vertical bar chart, a compliance distribution pie chart,
 * a regional distribution bar list, and an audit risk assessment list of top influencers. Shows skeleton UI
 * while metrics are loading and contextual placeholder messages when specific datasets are empty.
 *
 * @returns The page JSX element containing summary cards, tax-gap analysis, compliance distribution, regional distribution, and audit risk assessment.
 */
export default function AnalyticsPage() {
  const metrics = useQuery(api.analytics.getDashboardMetrics);
  const compliance = useQuery(api.analytics.getComplianceBreakdown);
  const regional = useQuery(api.analytics.getRegionalDistribution);
  const revenueData = useQuery(api.analytics.getRevenueByMonth);
  const topInfluencers = useQuery(api.analytics.getTopInfluencers);

  if (metrics === undefined) {
    return <AnalyticsSkeleton />;
  }

  const assessmentData = [
    {
      label: 'Approved',
      value: metrics.approvedAssessments,
      fill: 'var(--success)',
    },
    {
      label: 'Pending',
      value: metrics.pendingAssessments,
      fill: 'var(--warning)',
    },
    {
      label: 'Disputed',
      value: metrics.disputedAssessments,
      fill: 'var(--destructive)',
    },
  ];

  return (
    <div className='stagger-children space-y-6'>
      {/* Summary cards */}
      <div className='grid gap-4 sm:grid-cols-3'>
        <Card size='sm'>
          <CardHeader>
            <CardTitle className='text-xs font-medium tracking-wider text-muted-foreground uppercase'>
              Total Tax Liability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='font-heading text-2xl font-bold text-accent'>
              GH&#8373;{metrics.totalTaxLiability.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card size='sm'>
          <CardHeader>
            <CardTitle className='text-xs font-medium tracking-wider text-muted-foreground uppercase'>
              Approved Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='font-heading text-2xl font-bold text-success'>
              {metrics.approvedAssessments}
            </p>
          </CardContent>
        </Card>
        <Card size='sm'>
          <CardHeader>
            <CardTitle className='text-xs font-medium tracking-wider text-muted-foreground uppercase'>
              Disputed Cases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className='font-heading text-2xl font-bold text-destructive'>
              {metrics.disputedAssessments}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className='grid gap-6 lg:grid-cols-2'>
        {/* Assessment status */}
        <Card>
          <CardHeader>
            <CardTitle className='font-heading text-sm font-semibold tracking-wider text-muted-foreground uppercase'>
              Assessment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assessmentData.some((item) => item.value > 0) ? (
              <ResponsiveContainer width='100%' height={280}>
                <BarChart data={assessmentData} layout='vertical'>
                  <CartesianGrid strokeDasharray='3 3' stroke='var(--border)' horizontal={false} />
                  <XAxis type='number' tick={{ fontSize: 11 }} stroke='var(--muted-foreground)' />
                  <YAxis
                    dataKey='label'
                    type='category'
                    tick={{ fontSize: 11 }}
                    stroke='var(--muted-foreground)'
                    width={100}
                  />
                  <Tooltip
                    formatter={(value: number | string | undefined) => Number(value ?? 0)}
                    contentStyle={{
                      backgroundColor: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey='value' radius={[0, 4, 4, 0]}>
                    {assessmentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className='flex h-64 items-center justify-center text-sm text-muted-foreground'>
                No assessment data available yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compliance breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className='font-heading text-sm font-semibold tracking-wider text-muted-foreground uppercase'>
              Compliance Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {compliance && compliance.some((c) => c.count > 0) ? (
              <div className='flex flex-col items-center'>
                <ResponsiveContainer width='100%' height={220}>
                  <PieChart>
                    <Pie
                      data={compliance.filter((c) => c.count > 0)}
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
                        .filter((c) => c.count > 0)
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
                    .filter((c) => c.count > 0)
                    .map((c) => (
                      <div key={c.status} className='flex items-center gap-2'>
                        <span
                          className='h-2.5 w-2.5 rounded-full'
                          style={{ backgroundColor: COMPLIANCE_COLORS[c.status] }}
                        />
                        <span className='text-muted-foreground capitalize'>
                          {c.status.replace('-', ' ')}: {c.count}
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

        {/* Regional distribution */}
        <Card>
          <CardHeader>
            <CardTitle className='font-heading text-sm font-semibold tracking-wider text-muted-foreground uppercase'>
              Regional Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {regional && regional.length > 0 ? (
              <div className='space-y-2'>
                {regional.slice(0, 8).map((r) => {
                  const max = regional[0].value;
                  const pct = max > 0 ? (r.value / max) * 100 : 0;
                  return (
                    <div key={r.name} className='flex items-center gap-3'>
                      <span className='w-28 shrink-0 text-xs text-muted-foreground'>{r.name}</span>
                      <div className='flex-1'>
                        <div className='h-5 w-full overflow-hidden rounded-full bg-muted'>
                          <div
                            className='h-full rounded-full bg-accent transition-all duration-500'
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                      <span className='w-8 text-right text-xs font-medium'>{r.value}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className='flex h-48 items-center justify-center text-sm text-muted-foreground'>
                No regional data yet.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit risk — top influencers by revenue (risk proxy) */}
        <Card>
          <CardHeader>
            <CardTitle className='font-heading text-sm font-semibold tracking-wider text-muted-foreground uppercase'>
              Audit Risk Assessment
            </CardTitle>
            <CardDescription>
              Higher revenue with lower compliance scores indicate higher audit priority.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topInfluencers && topInfluencers.length > 0 ? (
              <div className='space-y-2'>
                {topInfluencers.slice(0, 6).map((inf) => {
                  const score = inf.complianceScore ?? 50;
                  const risk = score < 40 ? 'High' : score < 70 ? 'Medium' : 'Low';
                  const riskVariant =
                    risk === 'High'
                      ? 'destructive'
                      : risk === 'Medium'
                        ? ('secondary' as const)
                        : ('default' as const);
                  return (
                    <div
                      key={inf._id}
                      className='flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/30'
                    >
                      <div>
                        <p className='text-sm font-medium'>{inf.name}</p>
                        <p className='text-xs text-muted-foreground'>Score: {score}/100</p>
                      </div>
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
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className='flex h-40 items-center justify-center text-sm text-muted-foreground'>
                No data for risk assessment.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
