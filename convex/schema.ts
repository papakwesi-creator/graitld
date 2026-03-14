import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

const complianceStatus = v.union(
  v.literal('compliant'),
  v.literal('non-compliant'),
  v.literal('pending'),
  v.literal('under-review'),
);

const taxEstimateSourceType = v.union(
  v.literal('manual'),
  v.literal('analytics'),
  v.literal('blended'),
  v.literal('legacy_unknown'),
);

export default defineSchema({
  channels: defineTable({
    channelId: v.string(),
    handle: v.optional(v.string()),
    customUrl: v.optional(v.string()),
    name: v.string(),
    description: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    country: v.optional(v.string()),
    channelCreatedAt: v.optional(v.number()),
    topicCategories: v.optional(v.array(v.string())),
    uploadsPlaylistId: v.optional(v.string()),
    subscribers: v.optional(v.number()),
    subscriberCountHidden: v.optional(v.boolean()),
    totalViews: v.optional(v.number()),
    totalVideos: v.optional(v.number()),
    avgEngagementRate: v.optional(v.number()),
    sourceLookupValue: v.optional(v.string()),
    sourceResolvedAt: v.optional(v.number()),
    lastPublicRefresh: v.optional(v.number()),
    publicRefreshError: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    taxIdNumber: v.optional(v.string()),
    notes: v.optional(v.string()),
    complianceStatus: v.optional(complianceStatus),
    complianceScore: v.optional(v.number()),
    lastAssessedAt: v.optional(v.number()),
  })
    .index('by_channelId', ['channelId'])
    .index('by_complianceStatus', ['complianceStatus'])
    .searchIndex('search_name', {
      searchField: 'name',
      filterFields: ['complianceStatus'],
    }),

  oauthConnections: defineTable({
    channelId: v.string(),
    googleAccountId: v.optional(v.string()),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    accessTokenExpiresAt: v.number(),
    grantedScopes: v.array(v.string()),
    status: v.union(
      v.literal('active'),
      v.literal('expired'),
      v.literal('revoked'),
      v.literal('refresh_failed'),
      v.literal('scope_insufficient'),
    ),
    connectedAt: v.number(),
    lastTokenRefresh: v.optional(v.number()),
    lastRefreshError: v.optional(v.string()),
    disconnectedAt: v.optional(v.number()),
  })
    .index('by_channelId', ['channelId'])
    .index('by_status', ['status']),

  analyticsSyncs: defineTable({
    channelId: v.string(),
    connectionId: v.id('oauthConnections'),
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
    syncedAt: v.number(),
    syncStatus: v.union(
      v.literal('success'),
      v.literal('partial'),
      v.literal('failed'),
    ),
    syncError: v.optional(v.string()),
    rawResponseHash: v.optional(v.string()),
  })
    .index('by_channelId', ['channelId'])
    .index('by_channelId_period', ['channelId', 'periodStart'])
    .index('by_syncedAt', ['syncedAt']),

  manualFinancials: defineTable({
    channelId: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    periodType: v.union(v.literal('monthly'), v.literal('annual'), v.literal('custom')),
    declaredRevenue: v.optional(v.number()),
    estimatedRevenue: v.optional(v.number()),
    deductions: v.optional(v.number()),
    notes: v.optional(v.string()),
    evidenceRef: v.optional(v.string()),
    enteredBy: v.string(),
    enteredAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index('by_channelId', ['channelId'])
    .index('by_channelId_period', ['channelId', 'periodStart'])
    .index('by_enteredBy', ['enteredBy']),

  taxEstimates: defineTable({
    channelId: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    sourceType: taxEstimateSourceType,
    manualFinancialId: v.optional(v.id('manualFinancials')),
    analyticsSyncId: v.optional(v.id('analyticsSyncs')),
    grossRevenue: v.number(),
    allowableDeductions: v.optional(v.number()),
    taxableIncome: v.number(),
    taxRate: v.number(),
    currency: v.string(),
    estimatedTax: v.number(),
    calculatedAt: v.number(),
    calculatedBy: v.optional(v.string()),
    calculationVersion: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index('by_channelId', ['channelId'])
    .index('by_channelId_period', ['channelId', 'periodStart'])
    .index('by_calculatedAt', ['calculatedAt']),

  taxAssessments: defineTable({
    channelId: v.optional(v.string()),
    influencerId: v.optional(v.id('influencers')),
    taxEstimateId: v.optional(v.id('taxEstimates')),
    assessmentDate: v.number(),
    assessmentPeriodStart: v.number(),
    assessmentPeriodEnd: v.number(),
    taxableIncome: v.number(),
    taxRate: v.number(),
    taxAmount: v.number(),
    status: v.union(
      v.literal('draft'),
      v.literal('pending'),
      v.literal('approved'),
      v.literal('disputed'),
    ),
    assessedBy: v.optional(v.string()),
    notes: v.optional(v.string()),
  })
    .index('by_channelId', ['channelId'])
    .index('by_influencer', ['influencerId'])
    .index('by_status', ['status'])
    .index('by_date', ['assessmentDate']),

  auditLogs: defineTable({
    userId: v.optional(v.string()),
    userName: v.optional(v.string()),
    action: v.string(),
    entityType: v.string(),
    entityId: v.optional(v.string()),
    details: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index('by_timestamp', ['timestamp'])
    .index('by_entityType', ['entityType'])
    .index('by_userId', ['userId']),

  influencers: defineTable({
    name: v.string(),
    platform: v.literal('youtube'),
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
    complianceStatus: v.optional(complianceStatus),
    source: v.optional(v.union(v.literal('manual'), v.literal('youtube_api'))),
    sourceLookupValue: v.optional(v.string()),
    sourceResolvedAt: v.optional(v.number()),
    sourceRefreshError: v.optional(v.string()),
    country: v.optional(v.string()),
    channelCreatedAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    lastAssessedAt: v.optional(v.number()),
    lastDataRefresh: v.optional(v.number()),
  })
    .index('by_platform', ['platform'])
    .index('by_channelId', ['channelId'])
    .index('by_complianceStatus', ['complianceStatus'])
    .searchIndex('search_name', {
      searchField: 'name',
      filterFields: ['platform', 'complianceStatus'],
    }),
});
