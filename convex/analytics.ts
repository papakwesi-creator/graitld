import { query } from './_generated/server';
import { requireAuth } from './auth';

export const getDashboardMetrics = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const influencers = await ctx.db.query('influencers').collect();
    const assessments = await ctx.db.query('taxAssessments').collect();

    const totalInfluencers = influencers.length;
    const totalEstimatedRevenue = influencers.reduce(
      (sum, i) => sum + (i.estimatedAnnualRevenue ?? 0),
      0,
    );
    const totalTaxLiability = influencers.reduce((sum, i) => sum + (i.taxLiability ?? 0), 0);
    const compliant = influencers.filter((i) => i.complianceStatus === 'compliant').length;
    const complianceRate =
      totalInfluencers > 0 ? Math.round((compliant / totalInfluencers) * 100) : 0;
    const pendingAssessments = assessments.filter((a) => a.status === 'pending').length;

    return {
      totalInfluencers,
      totalEstimatedRevenue,
      totalTaxLiability,
      complianceRate,
      pendingAssessments,
      approvedAssessments: assessments.filter((a) => a.status === 'approved').length,
      disputedAssessments: assessments.filter((a) => a.status === 'disputed').length,
    };
  },
});

export const getPlatformDistribution = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const influencers = await ctx.db.query('influencers').collect();
    const youtube = influencers.filter((i) => i.platform === 'youtube').length;
    const tiktok = influencers.filter((i) => i.platform === 'tiktok').length;

    return [
      { name: 'YouTube', value: youtube, color: '#FF0000' },
      { name: 'TikTok', value: tiktok, color: '#00F2EA' },
    ];
  },
});

export const getRegionalDistribution = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const influencers = await ctx.db.query('influencers').collect();
    const regionMap: Record<string, number> = {};

    for (const inf of influencers) {
      const region = inf.region ?? 'Unknown';
      regionMap[region] = (regionMap[region] ?? 0) + 1;
    }

    return Object.entries(regionMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  },
});

export const getComplianceBreakdown = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const influencers = await ctx.db.query('influencers').collect();

    const statusMap: Record<string, number> = {
      'compliant': 0,
      'non-compliant': 0,
      'pending': 0,
      'under-review': 0,
    };

    for (const inf of influencers) {
      const status = inf.complianceStatus ?? 'pending';
      statusMap[status] = (statusMap[status] ?? 0) + 1;
    }

    return Object.entries(statusMap).map(([status, count]) => ({
      status,
      count,
    }));
  },
});

export const getTopInfluencers = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const influencers = await ctx.db.query('influencers').collect();
    return influencers
      .sort((a, b) => (b.estimatedAnnualRevenue ?? 0) - (a.estimatedAnnualRevenue ?? 0))
      .slice(0, 10);
  },
});

export const getRevenueByMonth = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    // Historical monthly series is not yet modeled in the database.
    // Return an empty dataset instead of synthetic values.
    return [];
  },
});
