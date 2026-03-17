import { internalMutation, query } from './_generated/server'
import { v } from 'convex/values'

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000
const CLEANUP_BATCH_SIZE = 200

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query('activities')
      .withIndex('by_timestamp')
      .order('desc')
      .take(50)
  },
})

export const insertInternal = internalMutation({
  args: {
    type: v.union(
      v.literal('telegram'),
      v.literal('cron'),
      v.literal('github'),
      v.literal('briefing'),
      v.literal('misc'),
    ),
    summary: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('activities', {
      timestamp: Date.now(),
      type: args.type,
      summary: args.summary,
      details: args.details,
    })
  },
})

export const deleteOlderThanTwoDays = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - TWO_DAYS_MS
    const oldActivities = await ctx.db
      .query('activities')
      .withIndex('by_timestamp', q => q.lt('timestamp', cutoff))
      .take(CLEANUP_BATCH_SIZE)

    for (const activity of oldActivities) {
      await ctx.db.delete(activity._id)
    }

    return { deletedCount: oldActivities.length }
  },
})
