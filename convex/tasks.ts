import { internalMutation, internalQuery, mutation, query } from './_generated/server'
import { v } from 'convex/values'

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000

export const list = query({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - TWO_DAYS_MS
    const all = await ctx.db.query('tasks').collect()
    return all
      .filter(t => t.createdAt >= cutoff)
      .sort((a, b) => b.createdAt - a.createdAt)
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    prompt: v.string(),
    runAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('tasks', {
      name: args.name.trim() || 'task',
      prompt: args.prompt.trim(),
      runAt: args.runAt,
      status: 'pending',
      createdAt: Date.now(),
    })
  },
})

export const cancel = mutation({
  args: { id: v.id('tasks') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: 'cancelled' })
  },
})

export const listPending = internalQuery({
  args: {},
  handler: async (ctx) => {
    return ctx.db
      .query('tasks')
      .withIndex('by_status', q => q.eq('status', 'pending'))
      .collect()
  },
})

export const markDone = internalMutation({
  args: { id: v.id('tasks') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: 'done' })
  },
})

export const deleteOlderThanTwoDays = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - TWO_DAYS_MS
    const old = await ctx.db.query('tasks').collect()
    for (const task of old) {
      if (task.createdAt < cutoff) {
        await ctx.db.delete(task._id)
      }
    }
  },
})
