import { internalMutation, query } from './_generated/server'
import { v } from 'convex/values'

export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query('jobs').collect()
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
        await ctx.db.patch(existing._id, {
          schedule: job.schedule,
          prompt: job.prompt,
          updatedAt: Date.now(),
        })
      } else {
        await ctx.db.insert('jobs', { ...job, updatedAt: Date.now() })
      }
    }
  },
})
