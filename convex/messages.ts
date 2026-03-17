import { internalMutation, internalQuery, mutation } from './_generated/server'
import { v } from 'convex/values'

export const send = mutation({
  args: { content: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert('messages', {
      content: args.content.trim(),
      createdAt: Date.now(),
      processed: false,
    })
  },
})

export const listUnprocessed = internalQuery({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query('messages')
      .withIndex('by_processed', q => q.eq('processed', false))
      .collect()
  },
})

export const markProcessed = internalMutation({
  args: { id: v.id('messages') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { processed: true })
  },
})
