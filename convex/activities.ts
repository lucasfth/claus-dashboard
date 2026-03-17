import { internalMutation, query } from './_generated/server'
import { v } from 'convex/values'

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
