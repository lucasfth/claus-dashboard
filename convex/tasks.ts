import { internalMutation, internalQuery, mutation, query } from './_generated/server'
import { v } from 'convex/values'

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000

export const list = query({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - TWO_DAYS_MS
    return await ctx.db
      .query('tasks')
      .withIndex('by_createdAt', (q) => q.gte('createdAt', cutoff))
      .order('desc')
      .take(100)
  },
})

export const create = mutation({
  args: {
    name: v.string(),
    prompt: v.string(),
    runAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim().slice(0, 100) || 'task'
    const prompt = args.prompt.trim().slice(0, 10000)

    await ctx.db.insert('tasks', {
      name,
      prompt,
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
    const old = await ctx.db
      .query('tasks')
      .withIndex('by_createdAt', (q) => q.lt('createdAt', cutoff))
      .take(100)

    for (const task of old) {
      await ctx.db.delete(task._id)
    }
  },
})

export const updateTask = mutation({
  args: {
    id: v.id('tasks'),
    name: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id)
    if (!task) throw new Error('Task not found')
    if (task.status !== 'pending') throw new Error('Can only edit pending tasks')

    const THIRTY_MINUTES_MS = 30 * 60 * 1000
    if (task.runAt) {
      const timeUntilRun = task.runAt - Date.now()
      if (timeUntilRun < THIRTY_MINUTES_MS) {
        throw new Error('Can only edit tasks scheduled more than 30 minutes away')
      }
    } else {
      throw new Error('Cannot edit ASAP tasks')
    }

    const name = args.name.trim().slice(0, 100) || 'task'
    const prompt = args.prompt.trim().slice(0, 10000)

    await ctx.db.patch(args.id, {
      name,
      prompt,
    })
  },
})
