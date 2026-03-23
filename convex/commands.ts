import { internalMutation, internalQuery, query } from './_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query('commands').collect()
  },
})

export const listInternal = internalQuery({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query('commands').collect()
  },
})

export const replaceAll = internalMutation({
  args: {
    commands: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        type: v.union(v.literal('command'), v.literal('skill'), v.literal('claudeclaw'), v.literal('bridge')),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query('commands').collect()
    await Promise.all(existing.map(cmd => ctx.db.delete(cmd._id)))
    const now = Date.now()
    await Promise.all(args.commands.map(cmd => ctx.db.insert('commands', { ...cmd, updatedAt: now })))
  },
})

export const deleteByName = internalMutation({
  args: { name: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('commands')
      .withIndex('by_name', q => q.eq('name', args.name))
      .first()
    if (existing) {
      await ctx.db.delete(existing._id)
    }
  },
})
