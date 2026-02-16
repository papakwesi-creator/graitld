import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { requireAuth } from './auth';

export const getInfluencers = query({
  args: {
    platform: v.optional(v.union(v.literal('youtube'), v.literal('tiktok'))),
    complianceStatus: v.optional(
      v.union(
        v.literal('compliant'),
        v.literal('non-compliant'),
        v.literal('pending'),
        v.literal('under-review'),
      ),
    ),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const influencers = args.platform
      ? await ctx.db
          .query('influencers')
          .withIndex('by_platform', (q) => q.eq('platform', args.platform!))
          .collect()
      : await ctx.db.query('influencers').collect();

    // Apply additional filters in memory
    let filtered = influencers;
    if (args.complianceStatus) {
      filtered = filtered.filter((i) => i.complianceStatus === args.complianceStatus);
    }
    if (args.region) {
      filtered = filtered.filter((i) => i.region === args.region);
    }

    return filtered;
  },
});

export const getInfluencer = query({
  args: { id: v.id('influencers') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    return await ctx.db.get(args.id);
  },
});

export const searchInfluencers = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    if (!args.searchTerm.trim()) {
      return await ctx.db.query('influencers').collect();
    }
    return await ctx.db
      .query('influencers')
      .withSearchIndex('search_name', (q) => q.search('name', args.searchTerm))
      .collect();
  },
});

export const getInfluencerStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const all = await ctx.db.query('influencers').collect();

    const totalInfluencers = all.length;
    const totalEstimatedTax = all.reduce((sum, i) => sum + (i.taxLiability ?? 0), 0);
    const totalEstimatedRevenue = all.reduce((sum, i) => sum + (i.estimatedAnnualRevenue ?? 0), 0);
    const compliant = all.filter((i) => i.complianceStatus === 'compliant').length;
    const complianceRate =
      totalInfluencers > 0 ? Math.round((compliant / totalInfluencers) * 100) : 0;
    const pendingAssessments = all.filter(
      (i) => i.complianceStatus === 'pending' || i.complianceStatus === 'under-review',
    ).length;
    const youtubeCount = all.filter((i) => i.platform === 'youtube').length;
    const tiktokCount = all.filter((i) => i.platform === 'tiktok').length;

    return {
      totalInfluencers,
      totalEstimatedTax,
      totalEstimatedRevenue,
      complianceRate,
      pendingAssessments,
      youtubeCount,
      tiktokCount,
    };
  },
});

export const createInfluencer = mutation({
  args: {
    name: v.string(),
    platform: v.union(v.literal('youtube'), v.literal('tiktok')),
    handle: v.string(),
    channelId: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    subscribers: v.optional(v.number()),
    totalViews: v.optional(v.number()),
    avgEngagementRate: v.optional(v.number()),
    totalVideos: v.optional(v.number()),
    estimatedMonthlyRevenue: v.optional(v.number()),
    estimatedAnnualRevenue: v.optional(v.number()),
    taxLiability: v.optional(v.number()),
    taxIdNumber: v.optional(v.string()),
    complianceScore: v.optional(v.number()),
    complianceStatus: v.optional(
      v.union(
        v.literal('compliant'),
        v.literal('non-compliant'),
        v.literal('pending'),
        v.literal('under-review'),
      ),
    ),
    region: v.optional(
      v.union(
        v.literal('Greater Accra'),
        v.literal('Ashanti'),
        v.literal('Western'),
        v.literal('Eastern'),
        v.literal('Central'),
        v.literal('Northern'),
        v.literal('Volta'),
        v.literal('Upper East'),
        v.literal('Upper West'),
        v.literal('Bono'),
        v.literal('Bono East'),
        v.literal('Ahafo'),
        v.literal('Western North'),
        v.literal('Oti'),
        v.literal('North East'),
        v.literal('Savannah'),
      ),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const influencerId = await ctx.db.insert('influencers', {
      ...args,
      complianceStatus: args.complianceStatus ?? 'pending',
      lastDataRefresh: Date.now(),
    });
    return influencerId;
  },
});

export const updateInfluencer = mutation({
  args: {
    id: v.id('influencers'),
    name: v.optional(v.string()),
    platform: v.optional(v.union(v.literal('youtube'), v.literal('tiktok'))),
    handle: v.optional(v.string()),
    channelId: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    subscribers: v.optional(v.number()),
    totalViews: v.optional(v.number()),
    avgEngagementRate: v.optional(v.number()),
    totalVideos: v.optional(v.number()),
    estimatedMonthlyRevenue: v.optional(v.number()),
    estimatedAnnualRevenue: v.optional(v.number()),
    taxLiability: v.optional(v.number()),
    taxIdNumber: v.optional(v.string()),
    complianceScore: v.optional(v.number()),
    complianceStatus: v.optional(
      v.union(
        v.literal('compliant'),
        v.literal('non-compliant'),
        v.literal('pending'),
        v.literal('under-review'),
      ),
    ),
    region: v.optional(
      v.union(
        v.literal('Greater Accra'),
        v.literal('Ashanti'),
        v.literal('Western'),
        v.literal('Eastern'),
        v.literal('Central'),
        v.literal('Northern'),
        v.literal('Volta'),
        v.literal('Upper East'),
        v.literal('Upper West'),
        v.literal('Bono'),
        v.literal('Bono East'),
        v.literal('Ahafo'),
        v.literal('Western North'),
        v.literal('Oti'),
        v.literal('North East'),
        v.literal('Savannah'),
      ),
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const { id, ...updates } = args;
    // Remove undefined values
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined),
    );
    await ctx.db.patch(id, cleanUpdates);
  },
});

export const deleteInfluencer = mutation({
  args: { id: v.id('influencers') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await ctx.db.delete(args.id);
  },
});
