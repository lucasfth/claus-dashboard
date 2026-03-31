import { internalMutation, internalQuery, mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { requireAuth } from './lib/requireAuth'

export const get = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx)
    return (await ctx.db.query('contextNotes').first()) ?? null
  },
})

export const getInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return (await ctx.db.query('contextNotes').first()) ?? null
  },
})

export const upsert = mutation({
  args: { content: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx)
    const existing = await ctx.db.query('contextNotes').first()
    if (existing) {
      await ctx.db.patch(existing._id, { content: args.content, updatedAt: Date.now() })
    } else {
      await ctx.db.insert('contextNotes', { content: args.content, updatedAt: Date.now() })
    }
  },
})

export const upsertInternal = internalMutation({
  args: { content: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('contextNotes').first()
    if (existing) {
      await ctx.db.patch(existing._id, { content: args.content, updatedAt: Date.now() })
    } else {
      await ctx.db.insert('contextNotes', { content: args.content, updatedAt: Date.now() })
    }
  },
})
