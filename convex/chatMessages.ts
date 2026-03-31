import { query, internalMutation, mutation } from './_generated/server'
import { v } from 'convex/values'
import { requireAuth } from './lib/requireAuth'

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx)
    return await ctx.db.query('chatMessages')
      .withIndex('by_timestamp')
      .order('desc')
      .take(200)
  },
})

export const insert = internalMutation({
  args: {
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('chatMessages', {
      role: args.role,
      content: args.content,
      timestamp: args.timestamp,
      pinned: false,
    })
  },
})

export const togglePin = mutation({
  args: { id: v.id('chatMessages') },
  handler: async (ctx, args) => {
    await requireAuth(ctx)
    const msg = await ctx.db.get(args.id)
    if (!msg) return
    await ctx.db.patch(args.id, { pinned: !msg.pinned })
  },
})

export const clearAll = internalMutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('chatMessages').collect()
    for (const doc of all) await ctx.db.delete(doc._id)
    return { deleted: all.length }
  },
})
