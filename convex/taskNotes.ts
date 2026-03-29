import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const listForTask = query({
  args: { taskId: v.id('tasks') },
  handler: async (ctx, args) => {
    return ctx.db
      .query('taskNotes')
      .withIndex('by_taskId', (q) => q.eq('taskId', args.taskId))
      .order('asc')
      .collect()
  },
})

export const add = mutation({
  args: {
    taskId: v.id('tasks'),
    content: v.string(),
    author: v.union(v.literal('lucas'), v.literal('claus')),
  },
  handler: async (ctx, args) => {
    const now = Date.now()
    return ctx.db.insert('taskNotes', {
      taskId: args.taskId,
      content: args.content.trim(),
      author: args.author,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const edit = mutation({
  args: {
    id: v.id('taskNotes'),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.id)
    if (!note) throw new Error('Note not found')
    await ctx.db.patch(args.id, {
      content: args.content.trim(),
      updatedAt: Date.now(),
    })
  },
})

export const remove = mutation({
  args: { id: v.id('taskNotes') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id)
  },
})
