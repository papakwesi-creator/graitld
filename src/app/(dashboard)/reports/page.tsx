'use client';

import { Download01Icon, File01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { useQuery } from 'convex/react';
import { useState } from 'react';
import { api } from '~convex/_generated/api';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type ReportType = 'tax-summary' | 'compliance-overview' | 'influencer-list' | 'revenue-analysis';

const REPORT_TYPES: { value: ReportType; label: string; description: string }[] = [
  {
    value: 'tax-summary',
    label: 'Tax Summary Report',
    description: 'Comprehensive overview of tax liabilities and collections',
  },
  {
    value: 'compliance-overview',
    label: 'Compliance Overview',
    description: 'Breakdown of compliance status across all influencers',
  },
  {
    value: 'influencer-list',
    label: 'Influencer Registry',
    description: 'Complete list of registered influencers with details',
  },
  {
    value: 'revenue-analysis',
    label: 'Revenue Analysis',
    description: 'Estimated revenue breakdown by platform and region',
  },
];

/**
 * Render the Reports page and provide UI for generating and downloading predefined reports.
 *
 * Fetches dashboard metrics, influencer records, and compliance breakdown; displays skeletons while loading,
 * renders a card for each report type with a "Generate & Download" action, and shows a report history placeholder.
 * The page includes a handler that builds a plain-text report for the selected type and triggers a client-side download.
 *
 * @returns The Reports page React element
 */
export default function ReportsPage() {
  const metrics = useQuery(api.analytics.getDashboardMetrics);
  const influencers = useQuery(api.influencers.getInfluencers, {});
  const compliance = useQuery(api.analytics.getComplianceBreakdown);

  const [generating, setGenerating] = useState(false);

  // Show skeleton while data is loading
  if (metrics === undefined || influencers === undefined || compliance === undefined) {
    return (
      <div className='space-y-6'>
        <Skeleton className='h-5 w-80' />
        <div className='grid gap-4 sm:grid-cols-2'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className='h-36 rounded-xl' />
          ))}
        </div>
        <Skeleton className='h-40 rounded-xl' />
      </div>
    );
  }

  const generateReport = async (type: ReportType) => {
    setGenerating(true);

    // Build report content based on type
    let reportContent = '';
    const now = new Date().toLocaleDateString('en-GH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const header = `
GHANA REVENUE AUTHORITY
Influencer Tax Liability Dashboard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated: ${now}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

    if (type === 'tax-summary' && metrics) {
      reportContent = `${header}TAX SUMMARY REPORT

Total Registered Influencers: ${metrics.totalInfluencers}
Total Estimated Revenue: GH₵${metrics.totalEstimatedRevenue.toLocaleString()}
Total Tax Liability: GH₵${metrics.totalTaxLiability.toLocaleString()}
Compliance Rate: ${metrics.complianceRate}%
Pending Assessments: ${metrics.pendingAssessments}
Approved Assessments: ${metrics.approvedAssessments}
Disputed Assessments: ${metrics.disputedAssessments}
`;
    } else if (type === 'compliance-overview' && compliance) {
      reportContent = `${header}COMPLIANCE OVERVIEW

Status Breakdown:
${compliance.map((c) => `  ${c.status.toUpperCase().padEnd(16)} ${c.count} influencer(s)`).join('\n')}
`;
    } else if (type === 'influencer-list' && influencers) {
      reportContent = `${header}INFLUENCER REGISTRY

Total Records: ${influencers.length}

${'Name'.padEnd(25)} ${'Platform'.padEnd(10)} ${'Handle'.padEnd(20)} ${'Status'.padEnd(15)} Est. Revenue
${'─'.repeat(90)}
${influencers
  .map(
    (i) =>
      `${i.name.padEnd(25)} ${i.platform.padEnd(10)} @${i.handle.padEnd(19)} ${(i.complianceStatus ?? 'pending').padEnd(15)} GH₵${(i.estimatedAnnualRevenue ?? 0).toLocaleString()}`,
  )
  .join('\n')}
`;
    } else if (type === 'revenue-analysis' && influencers) {
      const youtubeRev = influencers
        .filter((i) => i.platform === 'youtube')
        .reduce((s, i) => s + (i.estimatedAnnualRevenue ?? 0), 0);
      const tiktokRev = influencers
        .filter((i) => i.platform === 'tiktok')
        .reduce((s, i) => s + (i.estimatedAnnualRevenue ?? 0), 0);

      reportContent = `${header}REVENUE ANALYSIS

By Platform:
  YouTube:  GH₵${youtubeRev.toLocaleString()}
  TikTok:   GH₵${tiktokRev.toLocaleString()}
  Total:    GH₵${(youtubeRev + tiktokRev).toLocaleString()}
`;
    }

    // Trigger download as text file (PDF could be added with jspdf)
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gra-${type}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    setGenerating(false);
  };

  return (
    <div className='stagger-children space-y-6'>
      <p className='text-sm text-muted-foreground'>
        Generate and download reports for tax analysis, compliance tracking, and influencer
        management.
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
                  disabled={generating || metrics === undefined}
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

      {/* Recently generated placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className='font-heading text-sm font-semibold tracking-wider text-muted-foreground uppercase'>
            Report History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className='py-8 text-center text-sm text-muted-foreground'>
            Generated reports will appear here. Reports are downloaded directly to your device.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
