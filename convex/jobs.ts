import { internalMutation, internalQuery, mutation, query } from './_generated/server'
import { v, ConvexError } from 'convex/values'
import { requireAuth } from './lib/requireAuth'

const MAX_JOBS = 100
const MAX_NAME_LEN = 100
const MAX_SCHEDULE_LEN = 100
const MAX_PROMPT_LEN = 10000
const MAX_CODE_LEN = 50000

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
    if (args.schedule.length > MAX_SCHEDULE_LEN) {
      throw new ConvexError(`Schedule too long (max ${MAX_SCHEDULE_LEN} chars)`)
    }
    const existing = await ctx.db
      .query('jobs')
      .withIndex('by_name', q => q.eq('name', args.name))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, {
        pendingSchedule: args.schedule.trim(),
      })
    }
  },
})

export const setPrompt = mutation({
  args: { name: v.string(), prompt: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx)
    if (args.prompt.length > MAX_PROMPT_LEN) {
      throw new ConvexError(`Prompt too long (max ${MAX_PROMPT_LEN} chars)`)
    }
    const existing = await ctx.db
      .query('jobs')
      .withIndex('by_name', q => q.eq('name', args.name))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, {
        pendingPrompt: args.prompt.trim(),
        updatedAt: Date.now(),
      })
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
  args: {
    name: v.string(),
    appliedSchedule: v.optional(v.string()),
    appliedPrompt: v.optional(v.string()),
  },
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
      if (args.appliedSchedule) {
        if (args.appliedSchedule.length > MAX_SCHEDULE_LEN) {
          throw new ConvexError('Applied schedule too long')
        }
        patch.schedule = args.appliedSchedule.trim()
      }
      if (args.appliedPrompt) {
        if (args.appliedPrompt.length > MAX_PROMPT_LEN) {
          throw new ConvexError('Applied prompt too long')
        }
        patch.prompt = args.appliedPrompt.trim()
      }
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
    if (args.jobs.length > MAX_JOBS) {
      throw new ConvexError(`Too many jobs (max ${MAX_JOBS})`)
    }
    const incomingNames = new Set(args.jobs.map(j => j.name))

    for (const job of args.jobs) {
      if (job.name.length > MAX_NAME_LEN) throw new ConvexError('Job name too long')
      if (job.schedule.length > MAX_SCHEDULE_LEN) throw new ConvexError('Job schedule too long')
      if (job.prompt.length > MAX_PROMPT_LEN) throw new ConvexError('Job prompt too long')
      if (job.code && job.code.length > MAX_CODE_LEN) throw new ConvexError('Job code too long')

      const existing = await ctx.db
        .query('jobs')
        .withIndex('by_name', q => q.eq('name', job.name))
        .first()

      const schedule = job.schedule.trim()
      const prompt = job.prompt.trim()

      if (existing) {
        const patch: Record<string, unknown> = { updatedAt: Date.now() }
        if (!existing.pendingSchedule) patch.schedule = schedule
        if (!existing.pendingPrompt) patch.prompt = prompt
        if (job.runner) patch.runner = job.runner
        if (job.code !== undefined) patch.code = job.code
        await ctx.db.patch(existing._id, patch)
      } else {
        await ctx.db.insert('jobs', {
          name: job.name.trim(),
          schedule,
          prompt,
          code: job.code,
          runner: job.runner,
          updatedAt: Date.now(),
        })
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
