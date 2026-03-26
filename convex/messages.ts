import { internalMutation, internalQuery, mutation } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'

export const send = mutation({
  args: { content: v.string() },
  handler: async (ctx, args) => {
    const content = args.content.trim()
    const now = Date.now()
    await ctx.db.insert('messages', {
      content,
      createdAt: now,
      processed: false,
    })
    // Also show immediately in the conversation feed
    await ctx.runMutation(internal.chatMessages.insert, {
      role: 'user',
      content,
      timestamp: now,
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
