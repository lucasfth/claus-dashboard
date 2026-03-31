import { internalMutation, internalQuery, mutation, query } from './_generated/server'
import { v } from 'convex/values'
import { requireAuth } from './lib/requireAuth'

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx)
    return ctx.db.query('jobs').collect()
  },
})

export const setSchedule = mutation({
  args: { name: v.string(), schedule: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx)
    const existing = await ctx.db
      .query('jobs')
      .withIndex('by_name', q => q.eq('name', args.name))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, { pendingSchedule: args.schedule })
    }
  },
})

export const setPrompt = mutation({
  args: { name: v.string(), prompt: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx)
    const existing = await ctx.db
      .query('jobs')
      .withIndex('by_name', q => q.eq('name', args.name))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, { pendingPrompt: args.prompt, updatedAt: Date.now() })
    }
  },
})

export const listPending = internalQuery({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query('jobs').collect()
    return all.filter(j => j.pendingSchedule !== undefined || j.pendingPrompt !== undefined)
  },
})

export const clearPending = internalMutation({
  args: { name: v.string(), appliedSchedule: v.optional(v.string()), appliedPrompt: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('jobs')
      .withIndex('by_name', q => q.eq('name', args.name))
      .first()
    if (existing) {
      const patch: Record<string, unknown> = {
        pendingSchedule: undefined,
        pendingPrompt: undefined,
        updatedAt: Date.now(),
      }
      if (args.appliedSchedule) patch.schedule = args.appliedSchedule
      if (args.appliedPrompt) patch.prompt = args.appliedPrompt
      await ctx.db.patch(existing._id, patch)
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
        code: v.optional(v.string()),
        runner: v.optional(v.union(v.literal('claude'), v.literal('python'))),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const incomingNames = new Set(args.jobs.map(j => j.name))

    for (const job of args.jobs) {
      const existing = await ctx.db
        .query('jobs')
        .withIndex('by_name', q => q.eq('name', job.name))
        .first()
      if (existing) {
        const patch: Record<string, unknown> = { updatedAt: Date.now() }
        if (!existing.pendingSchedule) patch.schedule = job.schedule
        if (!existing.pendingPrompt) patch.prompt = job.prompt
        if (job.runner) patch.runner = job.runner
        if (job.code !== undefined) patch.code = job.code
        await ctx.db.patch(existing._id, patch)
      } else {
        await ctx.db.insert('jobs', { ...job, updatedAt: Date.now() })
      }
    }

    // Prune jobs no longer present in the local filesystem snapshot
    const all = await ctx.db.query('jobs').collect()
    for (const job of all) {
      if (!incomingNames.has(job.name)) {
        await ctx.db.delete(job._id)
      }
    }
  },
})
