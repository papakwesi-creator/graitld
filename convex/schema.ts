import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  influencers: defineTable({
    // Basic info
    name: v.string(),
    platform: v.union(v.literal('youtube'), v.literal('tiktok')),
    handle: v.string(),
    channelId: v.optional(v.string()),
    profileImageUrl: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),

    // Channel metrics
    subscribers: v.optional(v.number()),
    totalViews: v.optional(v.number()),
    avgEngagementRate: v.optional(v.number()),
    totalVideos: v.optional(v.number()),

    // Revenue & tax
    estimatedMonthlyRevenue: v.optional(v.number()),
    estimatedAnnualRevenue: v.optional(v.number()),
    taxLiability: v.optional(v.number()),
    taxIdNumber: v.optional(v.string()),

    // Compliance
    complianceScore: v.optional(v.number()), // 0-100
    complianceStatus: v.optional(
      v.union(
        v.literal('compliant'),
        v.literal('non-compliant'),
        v.literal('pending'),
        v.literal('under-review')
      )
    ),

    // Location
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
        v.literal('Savannah')
      )
    ),

    // Metadata
    notes: v.optional(v.string()),
    lastAssessedAt: v.optional(v.number()),
    lastDataRefresh: v.optional(v.number()),
  })
    .index('by_platform', ['platform'])
    .index('by_complianceStatus', ['complianceStatus'])
    .index('by_region', ['region'])
    .searchIndex('search_name', {
      searchField: 'name',
      filterFields: ['platform', 'complianceStatus', 'region'],
    }),

  taxAssessments: defineTable({
    influencerId: v.id('influencers'),
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
      v.literal('disputed')
    ),
    assessedBy: v.optional(v.string()), // user ID of the officer
    notes: v.optional(v.string()),
  })
    .index('by_influencer', ['influencerId'])
    .index('by_status', ['status'])
    .index('by_date', ['assessmentDate']),

  auditLogs: defineTable({
    userId: v.optional(v.string()),
    userName: v.optional(v.string()),
    action: v.string(), // e.g., "created_influencer", "updated_assessment"
    entityType: v.string(), // e.g., "influencer", "assessment"
    entityId: v.optional(v.string()),
    details: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index('by_timestamp', ['timestamp'])
    .index('by_entityType', ['entityType'])
    .index('by_userId', ['userId']),
});
