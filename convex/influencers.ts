import { v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { requireAuth } from './auth';

function removeUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as Partial<T>;
}

const complianceStatusValidator = v.union(
  v.literal('compliant'),
  v.literal('non-compliant'),
  v.literal('pending'),
  v.literal('under-review'),
);

const regionValidator = v.union(
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
);

const influencerFields = {
  name: v.string(),
  platform: v.union(v.literal('youtube'), v.literal('tiktok')),
  handle: v.string(),
  channelId: v.optional(v.string()),
  customUrl: v.optional(v.string()),
  profileImageUrl: v.optional(v.string()),
  description: v.optional(v.string()),
  email: v.optional(v.string()),
  phone: v.optional(v.string()),
  subscribers: v.optional(v.number()),
  subscriberCountHidden: v.optional(v.boolean()),
  totalViews: v.optional(v.number()),
  avgEngagementRate: v.optional(v.number()),
  totalVideos: v.optional(v.number()),
  uploadsPlaylistId: v.optional(v.string()),
  topicCategories: v.optional(v.array(v.string())),
  estimatedMonthlyRevenue: v.optional(v.number()),
  estimatedAnnualRevenue: v.optional(v.number()),
  taxLiability: v.optional(v.number()),
  taxIdNumber: v.optional(v.string()),
  complianceScore: v.optional(v.number()),
  complianceStatus: v.optional(complianceStatusValidator),
  region: v.optional(regionValidator),
  country: v.optional(v.string()),
  channelCreatedAt: v.optional(v.number()),
  notes: v.optional(v.string()),
};

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
  args: influencerFields,
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const influencerId = await ctx.db.insert('influencers', {
      ...args,
      complianceStatus: args.complianceStatus ?? 'pending',
      source: 'manual',
      lastDataRefresh: Date.now(),
    });
    return influencerId;
  },
});

export const updateInfluencer = mutation({
  args: {
    id: v.id('influencers'),
    ...Object.fromEntries(
      Object.entries(influencerFields).map(([key, value]) => [key, v.optional(value)]),
    ),
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

export const upsertYoutubeInfluencer = mutation({
  args: {
    name: v.string(),
    handle: v.string(),
    channelId: v.string(),
    customUrl: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    subscribers: v.optional(v.number()),
    subscriberCountHidden: v.optional(v.boolean()),
    totalViews: v.optional(v.number()),
    avgEngagementRate: v.optional(v.number()),
    totalVideos: v.optional(v.number()),
    uploadsPlaylistId: v.optional(v.string()),
    topicCategories: v.optional(v.array(v.string())),
    country: v.optional(v.string()),
    channelCreatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const existing = await ctx.db
      .query('influencers')
      .withIndex('by_channelId', (q) => q.eq('channelId', args.channelId))
      .unique();

    const now = Date.now();
    const complianceStatus: 'compliant' | 'non-compliant' | 'pending' | 'under-review' =
      existing?.complianceStatus ?? 'pending';
    const sourceLookupValue = args.channelId;
    const requiredFields = {
      name: args.name,
      platform: 'youtube' as const,
      handle: args.handle,
      channelId: args.channelId,
      source: 'youtube_api' as const,
      sourceLookupValue,
      sourceResolvedAt: now,
      lastDataRefresh: now,
      complianceStatus,
    };

    const optionalFields = removeUndefined({
      customUrl: args.customUrl,
      profileImageUrl: args.profileImageUrl,
      description: args.description,
      subscribers: args.subscribers,
      subscriberCountHidden: args.subscriberCountHidden,
      totalViews: args.totalViews,
      avgEngagementRate: args.avgEngagementRate,
      totalVideos: args.totalVideos,
      uploadsPlaylistId: args.uploadsPlaylistId,
      topicCategories: args.topicCategories,
      country: args.country,
      channelCreatedAt: args.channelCreatedAt,
    });

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...requiredFields,
        ...optionalFields,
      });
      return existing._id;
    }

    return await ctx.db.insert('influencers', {
      name: args.name,
      platform: 'youtube',
      handle: args.handle,
      channelId: args.channelId,
      source: 'youtube_api',
      sourceLookupValue,
      sourceResolvedAt: now,
      lastDataRefresh: now,
      complianceStatus,
      ...optionalFields,
    });
  },
});

export const deleteInfluencer = mutation({
  args: { id: v.id('influencers') },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await ctx.db.delete(args.id);
  },
});
