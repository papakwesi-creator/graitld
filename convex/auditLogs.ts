import { v } from 'convex/values';

import { requireAuth } from './auth';
import { mutation, query } from './_generated/server';

export const logActivity = mutation({
  args: {
    userId: v.optional(v.string()),
    userName: v.optional(v.string()),
    action: v.string(),
    entityType: v.string(),
    entityId: v.optional(v.string()),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    await ctx.db.insert('auditLogs', {
      ...args,
      timestamp: Date.now(),
    });
  },
});

export const getRecentLogs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const limit = args.limit ?? 20;
    return await ctx.db
      .query('auditLogs')
      .withIndex('by_timestamp')
      .order('desc')
      .take(limit);
  },
});

export const getLogsByEntity = query({
  args: {
    entityType: v.string(),
    entityId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    let logs = await ctx.db
      .query('auditLogs')
      .withIndex('by_entityType', (q) => q.eq('entityType', args.entityType))
      .collect();

    if (args.entityId) {
      logs = logs.filter((l) => l.entityId === args.entityId);
    }

    return logs.sort((a, b) => b.timestamp - a.timestamp);
  },
});
