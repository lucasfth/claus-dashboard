import { mutation, query, internalMutation, internalQuery } from './_generated/server'
import { internal } from './_generated/api'
import { v } from 'convex/values'

// Public queries for the Vue page
export const listRuns = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('polybotRuns')
      .withIndex('by_startedAt')
      .order('desc')
      .take(50)
  },
})

export const latestTopMarkets = query({
  args: {},
  handler: async (ctx) => {
    const latestRun = await ctx.db.query('polybotRuns')
      .withIndex('by_startedAt')
      .order('desc')
      .first()
    if (!latestRun) return []
    return await ctx.db.query('polybotTopMarkets')
      .withIndex('by_runId', q => q.eq('runId', latestRun.runId))
      .collect()
      .then(rows => rows.sort((a, b) => b.score - a.score).slice(0, 20))
  },
})

// Internal mutation called from HTTP action
export const upsertRun = internalMutation({
  args: {
    runId: v.string(),
    startedAt: v.number(),
    finishedAt: v.number(),
    dryRun: v.boolean(),
    totalMarkets: v.number(),
    analysesGenerated: v.number(),
    tradesExecuted: v.number(),
    successfulTrades: v.number(),
    topMarkets: v.array(v.object({
      marketId: v.string(),
      marketQuestion: v.string(),
      score: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    // Upsert the run
    const existing = await ctx.db.query('polybotRuns')
      .filter(q => q.eq(q.field('runId'), args.runId))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, {
        finishedAt: args.finishedAt,
        tradesExecuted: args.tradesExecuted,
        successfulTrades: args.successfulTrades,
      })
    } else {
      await ctx.db.insert('polybotRuns', {
        runId: args.runId,
        startedAt: args.startedAt,
        finishedAt: args.finishedAt,
        dryRun: args.dryRun,
        totalMarkets: args.totalMarkets,
        analysesGenerated: args.analysesGenerated,
        tradesExecuted: args.tradesExecuted,
        successfulTrades: args.successfulTrades,
      })
      // Insert top markets for this run
      for (const m of args.topMarkets) {
        await ctx.db.insert('polybotTopMarkets', {
          runId: args.runId,
          marketId: m.marketId,
          marketQuestion: m.marketQuestion,
          score: m.score,
        })
      }
    }
  },
})
