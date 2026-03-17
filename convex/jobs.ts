import { internalMutation, internalQuery, mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query('jobs').collect()
  },
})

export const setSchedule = mutation({
  args: { name: v.string(), schedule: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('jobs')
      .withIndex('by_name', q => q.eq('name', args.name))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, { pendingSchedule: args.schedule })
    }
  },
})

export const listPending = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('jobs').collect()
    return all.filter(j => j.pendingSchedule !== undefined)
  },
})

export const clearPending = internalMutation({
  args: { name: v.string(), appliedSchedule: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('jobs')
      .withIndex('by_name', q => q.eq('name', args.name))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, {
        schedule: args.appliedSchedule,
        pendingSchedule: undefined,
        updatedAt: Date.now(),
      })
    }
  },
})

export const upsertMany = internalMutation({
  args: {
    jobs: v.array(
      v.object({
        name: v.string(),
        schedule: v.string(),
        prompt: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const job of args.jobs) {
      const existing = await ctx.db
        .query('jobs')
        .withIndex('by_name', q => q.eq('name', job.name))
        .first()
      if (existing) {
        // Don't overwrite a pending schedule the user just set
        const patch: Record<string, unknown> = {
          prompt: job.prompt,
          updatedAt: Date.now(),
        }
        if (!existing.pendingSchedule) {
          patch.schedule = job.schedule
        }
        await ctx.db.patch(existing._id, patch)
      } else {
        await ctx.db.insert('jobs', { ...job, updatedAt: Date.now() })
      }
    }
  },
})
