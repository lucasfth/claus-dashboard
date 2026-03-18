import { internalMutation, internalQuery, mutation, query } from './_generated/server'
import { v } from 'convex/values'

const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000

function insertionSort<T extends { createdAt: number }>(tasks: T[]): T[] {
  const sorted = [...tasks]
  for (let i = 1; i < sorted.length; i++) {
    const key = sorted[i]
    let j = i - 1
    while (j >= 0 && sorted[j].createdAt < key.createdAt) {
      sorted[j + 1] = sorted[j]
      j--
    }
    sorted[j + 1] = key
  }
  return sorted
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - TWO_DAYS_MS
    const all = await ctx.db.query('tasks').collect()
    return insertionSort(all.filter(t => t.createdAt >= cutoff))
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

    await ctx.db.patch(args.id, {
      name: args.name.trim() || 'task',
      prompt: args.prompt.trim(),
    })
  },
})
