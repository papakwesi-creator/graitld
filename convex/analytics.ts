import { query } from './_generated/server';
import { loadChannelSummaries } from './channelData';
import { requireAuth } from './auth';

function monthKey(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key: string) {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(Date.UTC(year, (month ?? 1) - 1, 1));
  return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
}

export const getDashboardMetrics = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);

    const channels = await loadChannelSummaries(ctx.db);
    const assessments = await ctx.db.query('taxAssessments').collect();

    const totalChannels = channels.length;
    const totalEstimatedRevenue = channels.reduce(
      (sum, channel) => sum + (channel.estimatedAnnualRevenue ?? 0),
      0,
    );
    const totalTaxLiability = channels.reduce((sum, channel) => sum + (channel.estimatedTax ?? 0), 0);
    const compliant = channels.filter((channel) => channel.complianceStatus === 'compliant').length;
    const complianceRate = totalChannels > 0 ? Math.round((compliant / totalChannels) * 100) : 0;

    return {
      totalInfluencers: totalChannels,
      totalChannels,
      totalEstimatedRevenue,
      totalTaxLiability,
      complianceRate,
      pendingAssessments: assessments.filter((assessment) => assessment.status === 'pending').length,
      approvedAssessments: assessments.filter((assessment) => assessment.status === 'approved').length,
      disputedAssessments: assessments.filter((assessment) => assessment.status === 'disputed').length,
      publicOnlyChannels: channels.filter(
        (channel) =>
          channel.hasPublicData &&
          !channel.hasConnectedAnalytics &&
          !channel.hasManualFinancials &&
          !channel.hasTaxEstimate,
      ).length,
      connectedAnalyticsChannels: channels.filter((channel) => channel.hasConnectedAnalytics).length,
      manualInputChannels: channels.filter((channel) => channel.hasManualFinancials).length,
      actionRequiredChannels: channels.filter((channel) => channel.actionRequired).length,
    };
  },
});

export const getComplianceBreakdown = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const channels = await loadChannelSummaries(ctx.db);

    const statusMap: Record<string, number> = {
      compliant: 0,
      'non-compliant': 0,
      pending: 0,
      'under-review': 0,
    };

    for (const channel of channels) {
      const status = channel.complianceStatus ?? 'pending';
      statusMap[status] = (statusMap[status] ?? 0) + 1;
    }

    return Object.entries(statusMap).map(([status, count]) => ({ status, count }));
  },
});

export const getTopInfluencers = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const channels = await loadChannelSummaries(ctx.db);

    return channels
      .sort((left, right) => {
        const leftValue = left.estimatedAnnualRevenue ?? left.totalViews ?? 0;
        const rightValue = right.estimatedAnnualRevenue ?? right.totalViews ?? 0;
        return rightValue - leftValue;
      })
      .slice(0, 10);
  },
});

export const getRevenueByMonth = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);

    const taxEstimates = await ctx.db.query('taxEstimates').collect();
    const manualFinancials = await ctx.db.query('manualFinancials').collect();

    const buckets = new Map<string, { revenue: number; tax: number }>();

    for (const estimate of taxEstimates) {
      const key = monthKey(estimate.calculatedAt);
      const current = buckets.get(key) ?? { revenue: 0, tax: 0 };
      current.revenue += estimate.grossRevenue;
      current.tax += estimate.estimatedTax;
      buckets.set(key, current);
    }

    for (const manual of manualFinancials) {
      const revenue = manual.declaredRevenue ?? manual.estimatedRevenue;
      if (revenue === undefined) continue;

      const key = monthKey(manual.updatedAt ?? manual.enteredAt);
      const current = buckets.get(key) ?? { revenue: 0, tax: 0 };
      if (!buckets.has(key)) {
        current.revenue += revenue;
        buckets.set(key, current);
      }
    }

    return Array.from(buckets.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(-12)
      .map(([key, value]) => ({
        month: monthLabel(key),
        revenue: Math.round(value.revenue),
        tax: Math.round(value.tax),
      }));
  },
});
