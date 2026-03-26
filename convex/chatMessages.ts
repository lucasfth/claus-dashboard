import { mutation, query, internalMutation } from './_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('chatMessages')
      .withIndex('by_timestamp')
      .order('asc')
      .take(200)
  },
})

export const listPinned = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('chatMessages')
      .withIndex('by_timestamp')
      .order('desc')
      .collect()
    return all.filter(m => m.pinned)
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
    const msg = await ctx.db.get(args.id)
    if (!msg) return
    await ctx.db.patch(args.id, { pinned: !msg.pinned })
  },
})
