import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';
import { mutation, query } from './_generated/server';
import { DEFAULT_TAX_RATE, loadChannelSummaries } from './channelData';
import { requireAuth } from './auth';

const complianceStatusValidator = v.union(
  v.literal('compliant'),
  v.literal('non-compliant'),
  v.literal('pending'),
  v.literal('under-review'),
);

const connectionStatusValidator = v.union(
  v.literal('active'),
  v.literal('expired'),
  v.literal('revoked'),
  v.literal('refresh_failed'),
  v.literal('scope_insufficient'),
);

const analyticsSyncStatusValidator = v.union(
  v.literal('success'),
  v.literal('partial'),
  v.literal('failed'),
);

const channelFields = {
  name: v.string(),
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
  taxIdNumber: v.optional(v.string()),
  complianceScore: v.optional(v.number()),
  complianceStatus: v.optional(complianceStatusValidator),
  country: v.optional(v.string()),
  channelCreatedAt: v.optional(v.number()),
  notes: v.optional(v.string()),
  estimatedMonthlyRevenue: v.optional(v.number()),
  estimatedAnnualRevenue: v.optional(v.number()),
};

type ChannelMutationArgs = {
  name: string;
  handle: string;
  channelId?: string;
  customUrl?: string;
  profileImageUrl?: string;
  description?: string;
  email?: string;
  phone?: string;
  subscribers?: number;
  subscriberCountHidden?: boolean;
  totalViews?: number;
  avgEngagementRate?: number;
  totalVideos?: number;
  uploadsPlaylistId?: string;
  topicCategories?: string[];
  taxIdNumber?: string;
  complianceScore?: number;
  complianceStatus?: 'compliant' | 'non-compliant' | 'pending' | 'under-review';
  country?: string;
  channelCreatedAt?: number;
  notes?: string;
  estimatedMonthlyRevenue?: number;
  estimatedAnnualRevenue?: number;
};

function normalizeHandle(handle: string) {
  return handle.trim().replace(/^@/, '');
}

function getBusinessChannelId(channelId: string | undefined, handle: string) {
  const normalizedChannelId = channelId?.trim();
  if (normalizedChannelId) return normalizedChannelId;
  return `manual:${normalizeHandle(handle)}`;
}

function getActorId(user: { userId?: string | null; _id: string }) {
  return user.userId ?? user._id;
}

function isConnectableBusinessChannelId(channelId: string) {
  return !channelId.startsWith('manual:') && !channelId.startsWith('legacy:');
}

async function upsertManualFinancialSnapshot(
  ctx: MutationCtx,
  args: {
    channelId: string;
    monthlyRevenue?: number;
    annualRevenue?: number;
    enteredBy: string;
  },
) {
  const now = Date.now();
  const existing = await ctx.db
    .query('manualFinancials')
    .withIndex('by_channelId', (q) => q.eq('channelId', args.channelId))
    .collect();

  if (args.monthlyRevenue !== undefined) {
    const monthlyRecord = existing.find((entry) => entry.periodType === 'monthly');
    const payload = {
      channelId: args.channelId,
      periodStart: 0,
      periodEnd: 0,
      periodType: 'monthly' as const,
      estimatedRevenue: args.monthlyRevenue,
      notes: 'Manual financial input',
      evidenceRef: undefined,
      enteredBy: monthlyRecord?.enteredBy ?? args.enteredBy,
      enteredAt: monthlyRecord?.enteredAt ?? now,
      updatedAt: monthlyRecord ? now : undefined,
    };

    if (monthlyRecord) {
      await ctx.db.patch(monthlyRecord._id, payload);
    } else {
      await ctx.db.insert('manualFinancials', payload);
    }
  }

  if (args.annualRevenue !== undefined) {
    const annualRecord = existing.find((entry) => entry.periodType === 'annual');
    const payload = {
      channelId: args.channelId,
      periodStart: 1,
      periodEnd: 1,
      periodType: 'annual' as const,
      estimatedRevenue: args.annualRevenue,
      notes: 'Manual financial input',
      evidenceRef: undefined,
      enteredBy: annualRecord?.enteredBy ?? args.enteredBy,
      enteredAt: annualRecord?.enteredAt ?? now,
      updatedAt: annualRecord ? now : undefined,
    };

    if (annualRecord) {
      await ctx.db.patch(annualRecord._id, payload);
    } else {
      await ctx.db.insert('manualFinancials', payload);
    }
  }
}

async function upsertTaxEstimateFromRevenue(
  ctx: MutationCtx,
  args: {
    channelId: string;
    annualRevenue?: number;
    calculatedBy: string;
  },
) {
  if (args.annualRevenue === undefined) {
    return;
  }

  const existing = await ctx.db
    .query('taxEstimates')
    .withIndex('by_channelId', (q) => q.eq('channelId', args.channelId))
    .collect();
  const annualEstimate = existing.find(
    (entry) => entry.periodStart === 1 && entry.periodEnd === 1 && entry.sourceType === 'manual',
  );
  const now = Date.now();

  const payload = {
    channelId: args.channelId,
    periodStart: 1,
    periodEnd: 1,
    sourceType: 'manual' as const,
    manualFinancialId: undefined,
    analyticsSyncId: undefined,
    grossRevenue: args.annualRevenue,
    allowableDeductions: undefined,
    taxableIncome: args.annualRevenue,
    taxRate: DEFAULT_TAX_RATE,
    currency: 'GHS',
    estimatedTax: Math.round(args.annualRevenue * DEFAULT_TAX_RATE),
    calculatedAt: now,
    calculatedBy: args.calculatedBy,
    calculationVersion: 'wave-1',
    notes: 'Derived from manual financial input',
  };

  if (annualEstimate) {
    await ctx.db.patch(annualEstimate._id, payload);
  } else {
    await ctx.db.insert('taxEstimates', payload);
  }
}

async function upsertAnalyticsSyncSnapshot(
  ctx: MutationCtx,
  args: {
    channelId: string;
    connectionId: Id<'oauthConnections'>;
    periodStart: number;
    periodEnd: number;
    estimatedRevenue?: number;
    estimatedAdRevenue?: number;
    estimatedRedRevenue?: number;
    monetizedPlaybacks?: number;
    cpm?: number;
    views?: number;
    watchTimeMinutes?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    subscribersGained?: number;
    subscribersLost?: number;
    syncStatus: 'success' | 'partial' | 'failed';
    syncError?: string;
    calculatedBy: string;
  },
) {
  const existingSyncs = await ctx.db
    .query('analyticsSyncs')
    .withIndex('by_channelId_period', (q) => q.eq('channelId', args.channelId).eq('periodStart', args.periodStart))
    .collect();

  const matchingSync = existingSyncs.find((entry) => entry.periodEnd === args.periodEnd);
  const syncPayload = {
    channelId: args.channelId,
    connectionId: args.connectionId,
    periodStart: args.periodStart,
    periodEnd: args.periodEnd,
    estimatedRevenue: args.estimatedRevenue,
    estimatedAdRevenue: args.estimatedAdRevenue,
    estimatedRedRevenue: args.estimatedRedRevenue,
    monetizedPlaybacks: args.monetizedPlaybacks,
    cpm: args.cpm,
    views: args.views,
    watchTimeMinutes: args.watchTimeMinutes,
    likes: args.likes,
    comments: args.comments,
    shares: args.shares,
    subscribersGained: args.subscribersGained,
    subscribersLost: args.subscribersLost,
    syncedAt: Date.now(),
    syncStatus: args.syncStatus,
    syncError: args.syncError,
    rawResponseHash: undefined,
  };

  const syncId = matchingSync
    ? (await ctx.db.patch(matchingSync._id, syncPayload), matchingSync._id)
    : await ctx.db.insert('analyticsSyncs', syncPayload);

  if (args.estimatedRevenue !== undefined) {
    const existingTaxEstimates = await ctx.db
      .query('taxEstimates')
      .withIndex('by_channelId_period', (q) => q.eq('channelId', args.channelId).eq('periodStart', args.periodStart))
      .collect();

    const analyticsEstimate = existingTaxEstimates.find(
      (entry) =>
        entry.periodEnd === args.periodEnd &&
        entry.sourceType === 'analytics',
    );

    const taxPayload = {
      channelId: args.channelId,
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      sourceType: 'analytics' as const,
      manualFinancialId: undefined,
      analyticsSyncId: syncId,
      grossRevenue: args.estimatedRevenue,
      allowableDeductions: undefined,
      taxableIncome: args.estimatedRevenue,
      taxRate: DEFAULT_TAX_RATE,
      currency: 'GHS',
      estimatedTax: Math.round(args.estimatedRevenue * DEFAULT_TAX_RATE),
      calculatedAt: Date.now(),
      calculatedBy: args.calculatedBy,
      calculationVersion: 'wave-1',
      notes: 'Derived from connected YouTube analytics',
    };

    if (analyticsEstimate) {
      await ctx.db.patch(analyticsEstimate._id, taxPayload);
    } else {
      await ctx.db.insert('taxEstimates', taxPayload);
    }
  }

  return syncId;
}

async function createOrUpdateManualChannel(
  ctx: MutationCtx,
  args: ChannelMutationArgs,
  actorId: string,
) {
  const handle = normalizeHandle(args.handle);
  const channelId = getBusinessChannelId(args.channelId, handle);
  const now = Date.now();

  const existing = await ctx.db
    .query('channels')
    .withIndex('by_channelId', (q) => q.eq('channelId', channelId))
    .unique();

  const annualRevenue =
    args.estimatedAnnualRevenue ??
    (args.estimatedMonthlyRevenue !== undefined ? args.estimatedMonthlyRevenue * 12 : undefined);

  const channelPayload = {
    channelId,
    handle,
    customUrl: args.customUrl,
    profileImageUrl: args.profileImageUrl,
    name: args.name,
    description: args.description,
    country: args.country,
    channelCreatedAt: args.channelCreatedAt,
    topicCategories: args.topicCategories,
    uploadsPlaylistId: args.uploadsPlaylistId,
    subscribers: args.subscribers,
    subscriberCountHidden: args.subscriberCountHidden,
    totalViews: args.totalViews,
    totalVideos: args.totalVideos,
    avgEngagementRate: args.avgEngagementRate,
    sourceLookupValue: args.channelId ? channelId : undefined,
    sourceResolvedAt: args.channelId ? now : undefined,
    lastPublicRefresh: args.channelId ? now : undefined,
    publicRefreshError: undefined,
    email: args.email,
    phone: args.phone,
    taxIdNumber: args.taxIdNumber,
    notes: args.notes,
    complianceStatus: args.complianceStatus ?? 'pending',
    complianceScore: args.complianceScore,
    lastAssessedAt: existing?.lastAssessedAt,
  };

  const id = existing
    ? (await ctx.db.patch(existing._id, channelPayload), existing._id)
    : await ctx.db.insert('channels', channelPayload);

  await upsertManualFinancialSnapshot(ctx, {
    channelId,
    monthlyRevenue: args.estimatedMonthlyRevenue,
    annualRevenue,
    enteredBy: actorId,
  });

  await upsertTaxEstimateFromRevenue(ctx, {
    channelId,
    annualRevenue,
    calculatedBy: actorId,
  });

  return id;
}

export const getInfluencers = query({
  args: {
    platform: v.optional(v.literal('youtube')),
    complianceStatus: v.optional(complianceStatusValidator),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const channels = await loadChannelSummaries(ctx.db);
    return args.complianceStatus
      ? channels.filter((channel) => channel.complianceStatus === args.complianceStatus)
      : channels;
  },
});

export const getChannels = getInfluencers;

export const getChannelConnectionTarget = query({
  args: {
    channelId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const channels = await loadChannelSummaries(ctx.db);
    const channel = channels.find((entry) => entry.channelId === args.channelId);

    if (!channel) {
      return null;
    }

    return {
      channelId: channel.channelId,
      name: channel.name,
      analyticsStatus: channel.analyticsStatus,
      hasConnectedAnalytics: channel.hasConnectedAnalytics,
      connectable: isConnectableBusinessChannelId(channel.channelId),
    };
  },
});

export const getInfluencerStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);
    const channels = await loadChannelSummaries(ctx.db);

    const totalChannels = channels.length;
    const totalEstimatedTax = channels.reduce((sum, channel) => sum + (channel.estimatedTax ?? 0), 0);
    const totalEstimatedRevenue = channels.reduce(
      (sum, channel) => sum + (channel.estimatedAnnualRevenue ?? 0),
      0,
    );
    const compliant = channels.filter((channel) => channel.complianceStatus === 'compliant').length;
    const complianceRate = totalChannels > 0 ? Math.round((compliant / totalChannels) * 100) : 0;
    const pendingAssessments = channels.filter(
      (channel) =>
        channel.complianceStatus === 'pending' || channel.complianceStatus === 'under-review',
    ).length;

    return {
      totalInfluencers: totalChannels,
      totalChannels,
      totalEstimatedTax,
      totalEstimatedRevenue,
      complianceRate,
      pendingAssessments,
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

export const createChannel = mutation({
  args: channelFields,
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const actorId = getActorId({ userId: user.userId, _id: String(user._id) });
    return await createOrUpdateManualChannel(ctx, args, actorId);
  },
});

export const createInfluencer = mutation({
  args: {
    ...channelFields,
    platform: v.literal('youtube'),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const actorId = getActorId({ userId: user.userId, _id: String(user._id) });
    const { platform: _platform, ...channelArgs } = args;
    return await createOrUpdateManualChannel(ctx, channelArgs, actorId);
  },
});

export const updateChannel = mutation({
  args: {
    id: v.id('channels'),
    name: v.optional(v.string()),
    handle: v.optional(v.string()),
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
    taxIdNumber: v.optional(v.string()),
    complianceScore: v.optional(v.number()),
    complianceStatus: v.optional(complianceStatusValidator),
    country: v.optional(v.string()),
    channelCreatedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    estimatedMonthlyRevenue: v.optional(v.number()),
    estimatedAnnualRevenue: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const existing = await ctx.db.get(args.id);

    if (!existing) {
      throw new Error('Channel not found');
    }

    const channelId = getBusinessChannelId(
      args.channelId ?? existing.channelId,
      args.handle ?? existing.handle ?? existing.name,
    );
    const handle = args.handle ? normalizeHandle(args.handle) : existing.handle ?? existing.name;
    const annualRevenue =
      args.estimatedAnnualRevenue ??
      (args.estimatedMonthlyRevenue !== undefined ? args.estimatedMonthlyRevenue * 12 : undefined);

    await ctx.db.patch(args.id, {
      channelId,
      handle,
      customUrl: args.customUrl,
      profileImageUrl: args.profileImageUrl,
      name: args.name,
      description: args.description,
      country: args.country,
      channelCreatedAt: args.channelCreatedAt,
      topicCategories: args.topicCategories,
      uploadsPlaylistId: args.uploadsPlaylistId,
      subscribers: args.subscribers,
      subscriberCountHidden: args.subscriberCountHidden,
      totalViews: args.totalViews,
      totalVideos: args.totalVideos,
      avgEngagementRate: args.avgEngagementRate,
      email: args.email,
      phone: args.phone,
      taxIdNumber: args.taxIdNumber,
      notes: args.notes,
      complianceStatus: args.complianceStatus,
      complianceScore: args.complianceScore,
    });

    const actorId = getActorId({ userId: user.userId, _id: String(user._id) });

    await upsertManualFinancialSnapshot(ctx, {
      channelId,
      monthlyRevenue: args.estimatedMonthlyRevenue,
      annualRevenue,
      enteredBy: actorId,
    });

    await upsertTaxEstimateFromRevenue(ctx, {
      channelId,
      annualRevenue,
      calculatedBy: actorId,
    });
  },
});

export const updateInfluencer = updateChannel;

export const upsertChannel = mutation({
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
    const now = Date.now();
    const existing = await ctx.db
      .query('channels')
      .withIndex('by_channelId', (q) => q.eq('channelId', args.channelId))
      .unique();

    const payload = {
      channelId: args.channelId,
      handle: normalizeHandle(args.handle),
      customUrl: args.customUrl,
      profileImageUrl: args.profileImageUrl,
      name: args.name,
      description: args.description,
      country: args.country,
      channelCreatedAt: args.channelCreatedAt,
      topicCategories: args.topicCategories,
      uploadsPlaylistId: args.uploadsPlaylistId,
      subscribers: args.subscribers,
      subscriberCountHidden: args.subscriberCountHidden,
      totalViews: args.totalViews,
      totalVideos: args.totalVideos,
      avgEngagementRate: args.avgEngagementRate,
      sourceLookupValue: args.sourceLookupValue,
      sourceResolvedAt: now,
      lastPublicRefresh: now,
      publicRefreshError: undefined,
      complianceStatus: existing?.complianceStatus ?? 'pending',
    };

    if (existing) {
      await ctx.db.patch(existing._id, payload);
      return existing._id;
    }

    return await ctx.db.insert('channels', payload);
  },
});

export const upsertYoutubeInfluencer = upsertChannel;

export const completeChannelAnalyticsConnection = mutation({
  args: {
    channelId: v.string(),
    googleAccountId: v.optional(v.string()),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    accessTokenExpiresAt: v.number(),
    grantedScopes: v.array(v.string()),
    status: connectionStatusValidator,
    lastRefreshError: v.optional(v.string()),
    analytics: v.optional(
      v.object({
        periodStart: v.number(),
        periodEnd: v.number(),
        estimatedRevenue: v.optional(v.number()),
        estimatedAdRevenue: v.optional(v.number()),
        estimatedRedRevenue: v.optional(v.number()),
        monetizedPlaybacks: v.optional(v.number()),
        cpm: v.optional(v.number()),
        views: v.optional(v.number()),
        watchTimeMinutes: v.optional(v.number()),
        likes: v.optional(v.number()),
        comments: v.optional(v.number()),
        shares: v.optional(v.number()),
        subscribersGained: v.optional(v.number()),
        subscribersLost: v.optional(v.number()),
        syncStatus: analyticsSyncStatusValidator,
        syncError: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const actorId = getActorId({ userId: user.userId, _id: String(user._id) });
    const channels = await loadChannelSummaries(ctx.db);
    const channel = channels.find((entry) => entry.channelId === args.channelId);

    if (!channel) {
      throw new Error('Channel not found');
    }

    if (!isConnectableBusinessChannelId(args.channelId)) {
      throw new Error('Public channel data is required before analytics can be connected');
    }

    const existingConnections = await ctx.db
      .query('oauthConnections')
      .withIndex('by_channelId', (q) => q.eq('channelId', args.channelId))
      .collect();

    const latestConnection = existingConnections.sort(
      (left, right) =>
        (right.lastTokenRefresh ?? right.connectedAt) - (left.lastTokenRefresh ?? left.connectedAt),
    )[0];

    const now = Date.now();
    const connectionPayload = {
      channelId: args.channelId,
      googleAccountId: args.googleAccountId ?? latestConnection?.googleAccountId,
      accessToken: args.accessToken,
      refreshToken: args.refreshToken ?? latestConnection?.refreshToken,
      accessTokenExpiresAt: args.accessTokenExpiresAt,
      grantedScopes: args.grantedScopes,
      status: args.status,
      connectedAt: latestConnection?.connectedAt ?? now,
      lastTokenRefresh: now,
      lastRefreshError: args.lastRefreshError,
      disconnectedAt: undefined,
    };

    const connectionId = latestConnection
      ? (await ctx.db.patch(latestConnection._id, connectionPayload), latestConnection._id)
      : await ctx.db.insert('oauthConnections', connectionPayload);

    if (args.analytics) {
      await upsertAnalyticsSyncSnapshot(ctx, {
        channelId: args.channelId,
        connectionId,
        periodStart: args.analytics.periodStart,
        periodEnd: args.analytics.periodEnd,
        estimatedRevenue: args.analytics.estimatedRevenue,
        estimatedAdRevenue: args.analytics.estimatedAdRevenue,
        estimatedRedRevenue: args.analytics.estimatedRedRevenue,
        monetizedPlaybacks: args.analytics.monetizedPlaybacks,
        cpm: args.analytics.cpm,
        views: args.analytics.views,
        watchTimeMinutes: args.analytics.watchTimeMinutes,
        likes: args.analytics.likes,
        comments: args.analytics.comments,
        shares: args.analytics.shares,
        subscribersGained: args.analytics.subscribersGained,
        subscribersLost: args.analytics.subscribersLost,
        syncStatus: args.analytics.syncStatus,
        syncError: args.analytics.syncError,
        calculatedBy: actorId,
      });
    }

    await ctx.db.insert('auditLogs', {
      userId: actorId,
      userName: user.name ?? user.email ?? 'Officer',
      action: 'channel_analytics_connected',
      entityType: 'channel',
      entityId: args.channelId,
      details:
        args.analytics?.syncStatus === 'success'
          ? `Connected Google analytics for ${channel.name}`
          : `Connected Google analytics for ${channel.name} with ${args.analytics?.syncStatus ?? 'no'} sync result`,
      timestamp: now,
    });

    return {
      connectionId,
      synced: Boolean(args.analytics),
    };
  },
});

export const deleteChannel = mutation({
  args: {
    id: v.string(),
    table: v.union(v.literal('channels'), v.literal('influencers')),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    if (args.table === 'channels') {
      await ctx.db.delete(args.id as never);
      return;
    }

    await ctx.db.delete(args.id as never);
  },
});

export const deleteInfluencer = mutation({
  args: {
    id: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await ctx.db.delete(args.id as never);
  },
});
