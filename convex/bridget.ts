import { internalMutation, query } from './_generated/server'
import { v } from 'convex/values'

export const getStatus = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query('bridgetStatus').order('desc').first()
  },
})

export const getScheduledJobs = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query('jobs').collect()
  },
})

export const upsertStatus = internalMutation({
  args: {
    lastSync: v.number(),
    jobsPushed: v.optional(v.number()),
    commandsPushed: v.optional(v.number()),
    activitiesPushed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('bridgetStatus').order('desc').first()
    if (existing) {
      await ctx.db.patch(existing._id, args)
    } else {
      await ctx.db.insert('bridgetStatus', args)
    }
  },
})
