import { internalMutation, query } from './_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query('commands').collect()
  },
})

export const upsertMany = internalMutation({
  args: {
    commands: v.array(
      v.object({
        name: v.string(),
        description: v.string(),
        type: v.union(v.literal('command'), v.literal('skill'), v.literal('claudeclaw')),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const cmd of args.commands) {
      const existing = await ctx.db
        .query('commands')
        .withIndex('by_name', q => q.eq('name', cmd.name))
        .first()
      if (existing) {
        await ctx.db.patch(existing._id, { description: cmd.description, updatedAt: Date.now() })
      } else {
        await ctx.db.insert('commands', { ...cmd, updatedAt: Date.now() })
      }
    }
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
