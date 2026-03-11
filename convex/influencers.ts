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

const platformValidator = v.union(v.literal('youtube'), v.literal('tiktok'));

const influencerFields = {
  name: v.string(),
  platform: platformValidator,
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
    platform: v.optional(platformValidator),
    complianceStatus: v.optional(complianceStatusValidator),
    region: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    let influencers;
    if (args.platform === 'youtube') {
      influencers = await ctx.db
        .query('influencers')
        .withIndex('by_platform', (q) => q.eq('platform', 'youtube'))
        .collect();
    } else if (args.platform === 'tiktok') {
      influencers = await ctx.db
        .query('influencers')
        .withIndex('by_platform', (q) => q.eq('platform', 'tiktok'))
        .collect();
    } else {
      influencers = await ctx.db.query('influencers').collect();
    }

    let filtered = influencers;

    if (args.complianceStatus) {
      filtered = filtered.filter(
        (influencer) => influencer.complianceStatus === args.complianceStatus,
      );
    }

    if (args.region) {
      filtered = filtered.filter((influencer) => influencer.region === args.region);
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
    const totalEstimatedTax = all.reduce(
      (sum, influencer) => sum + (influencer.taxLiability ?? 0),
      0,
    );
    const totalEstimatedRevenue = all.reduce(
      (sum, influencer) => sum + (influencer.estimatedAnnualRevenue ?? 0),
      0,
    );
    const compliant = all.filter(
      (influencer) => influencer.complianceStatus === 'compliant',
    ).length;
    const complianceRate =
      totalInfluencers > 0 ? Math.round((compliant / totalInfluencers) * 100) : 0;
    const pendingAssessments = all.filter(
      (influencer) =>
        influencer.complianceStatus === 'pending' || influencer.complianceStatus === 'under-review',
    ).length;
    const youtubeCount = all.filter((influencer) => influencer.platform === 'youtube').length;
    const tiktokCount = all.filter((influencer) => influencer.platform === 'tiktok').length;

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

    return await ctx.db.insert('influencers', {
      ...args,
      complianceStatus: args.complianceStatus ?? 'pending',
      source: 'manual',
      lastDataRefresh: Date.now(),
    });
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
    const cleanUpdates = removeUndefined(updates);

    await ctx.db.patch(id, cleanUpdates);
  },
});

export const upsertYoutubeInfluencer = mutation({
  args: {
    name: v.string(),
    handle: v.string(),
    channelId: v.string(),
    sourceLookupValue: v.string(),
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
    const complianceStatus = existing?.complianceStatus ?? ('pending' as const);

    const baseFields = {
      name: args.name,
      platform: 'youtube' as const,
      handle: args.handle,
      channelId: args.channelId,
      source: 'youtube_api' as const,
      sourceLookupValue: args.sourceLookupValue,
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
        ...baseFields,
        ...optionalFields,
      });
      return existing._id;
    }

    return await ctx.db.insert('influencers', {
      ...baseFields,
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
