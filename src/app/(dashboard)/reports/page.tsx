'use client';

import { Download01Icon, File01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useQuery } from 'convex/react';
import { useState } from 'react';
import { api } from '~convex/_generated/api';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { currencyConfig, formatCurrency } from '@/lib/product';

type ReportType = 'tax-summary' | 'compliance-overview' | 'channel-registry' | 'source-readiness';

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  {
    value: 'tax-summary',
    label: 'Tax Summary Report',
    description: 'Overview of current source-backed revenue inputs and estimated tax output',
  },
  {
    value: 'compliance-overview',
    label: 'Compliance Overview',
    description: 'Breakdown of compliance status across tracked YouTube channels',
  },
  {
    value: 'channel-registry',
    label: 'Channel Registry',
    description: 'Channel list with public, analytics, and manual source visibility',
  },
  {
    value: 'source-readiness',
    label: 'Source Readiness',
    description: 'Operational view of public imports, connected analytics, and action-required states',
  },
];

export default function ReportsPage() {
  const metrics = useQuery(api.analytics.getDashboardMetrics);
  const channels = useQuery(api.influencers.getInfluencers, {});
  const compliance = useQuery(api.analytics.getComplianceBreakdown);

  const [generating, setGenerating] = useState(false);

  if (metrics === undefined || channels === undefined || compliance === undefined) {
    return (
      <div className='space-y-6'>
        <Skeleton className='h-5 w-80' />
        <div className='grid gap-4 sm:grid-cols-2'>
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className='h-36 rounded-xl' />
          ))}
        </div>
        <Skeleton className='h-40 rounded-xl' />
      </div>
    );
  }

  const generateReport = async (type: ReportType) => {
    setGenerating(true);

    const now = new Date().toLocaleDateString(currencyConfig.locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const header = `
GHANA REVENUE AUTHORITY
GRA YOUTUBE TAX DASHBOARD
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated: ${now}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

    let reportContent = '';

    if (type === 'tax-summary') {
      reportContent = `${header}TAX SUMMARY REPORT

Tracked Channels: ${metrics.totalChannels}
Estimated Revenue Inputs: ${formatCurrency(metrics.totalEstimatedRevenue)}
Estimated Tax Output: ${formatCurrency(metrics.totalTaxLiability)}
Compliance Rate: ${metrics.complianceRate}%
Public-only Channels: ${metrics.publicOnlyChannels}
Connected Analytics Channels: ${metrics.connectedAnalyticsChannels}
Manual Input Channels: ${metrics.manualInputChannels}
Action Required: ${metrics.actionRequiredChannels}
`;
    } else if (type === 'compliance-overview') {
      reportContent = `${header}COMPLIANCE OVERVIEW

Status Breakdown:
${compliance.map((entry) => `  ${entry.status.toUpperCase().padEnd(16)} ${entry.count} channel(s)`).join('\n')}
`;
    } else if (type === 'channel-registry') {
      reportContent = `${header}CHANNEL REGISTRY

Total Records: ${channels.length}

${'Name'.padEnd(24)} ${'Handle'.padEnd(20)} ${'Revenue Source'.padEnd(25)} Tax Estimate
${'─'.repeat(92)}
${channels
  .map(
    (channel) =>
      `${channel.name.padEnd(24)} @${channel.handle.padEnd(19)} ${channel.revenueSource.padEnd(25)} ${channel.estimatedTax !== undefined ? formatCurrency(channel.estimatedTax) : 'Not calculated'}`,
  )
  .join('\n')}
`;
    } else if (type === 'source-readiness') {
      reportContent = `${header}SOURCE READINESS REPORT

Public imports active: ${channels.filter((channel) => channel.publicDataStatus === 'public_imported').length}
Manual-only records: ${channels.filter((channel) => channel.publicDataStatus === 'manual_only').length}
Public refresh failures: ${channels.filter((channel) => channel.publicDataStatus === 'refresh_failed').length}
Connected analytics active: ${channels.filter((channel) => channel.analyticsStatus === 'active').length}
Analytics reconnect or review needed: ${channels.filter((channel) => channel.actionRequired).length}

Channels requiring follow-up:
${channels
  .filter((channel) => channel.actionRequired)
  .map((channel) => `  - ${channel.name} (@${channel.handle}) — ${channel.analyticsStatus}`)
  .join('\n') || '  None'}
`;
    }

    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `gra-${type}-${new Date().toISOString().split('T')[0]}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);

    setGenerating(false);
  };

  return (
    <div className='stagger-children space-y-6'>
      <p className='text-sm text-muted-foreground'>
        Generate source-aware reports for public YouTube imports, optional connected analytics,
        manual financial inputs, and tax estimates. Public lookup never implies private revenue
        access.
      </p>

      <div className='grid gap-4 sm:grid-cols-2'>
        {REPORT_TYPES.map((report) => (
          <Card
            key={report.value}
            className='group transition-all hover:border-accent/30 hover:shadow-md'
          >
            <CardContent className='flex items-start gap-4'>
              <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-accent/10 group-hover:text-accent'>
                <HugeiconsIcon icon={File01Icon} size={20} />
              </div>
              <div className='flex-1'>
                <h3 className='font-heading text-sm font-semibold'>{report.label}</h3>
                <p className='mt-1 text-xs text-muted-foreground'>{report.description}</p>
                <Button
                  onClick={() => generateReport(report.value)}
                  disabled={generating}
                  variant='outline'
                  className='mt-4 gap-2 text-xs'
                  size='sm'
                >
                  <HugeiconsIcon icon={Download01Icon} size={14} />
                  Generate &amp; Download
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='font-heading text-sm font-semibold tracking-wider text-muted-foreground uppercase'>
            Report Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-sm text-muted-foreground'>
            Downloaded reports reflect the current distinction between public channel metadata,
            owner-authorized analytics, manual financial inputs, and internal tax estimates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
