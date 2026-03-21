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

export const listTrades = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('polybotTrades')
      .withIndex('by_timestamp')
      .order('desc')
      .take(50)
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
      vwap: v.optional(v.number()),
      imbalance: v.optional(v.number()),
      spikeFactor: v.optional(v.number()),
      largeTrades: v.optional(v.number()),
    })),
    trades: v.optional(v.array(v.object({
      marketId: v.string(),
      marketQuestion: v.optional(v.string()),
      side: v.string(),
      price: v.number(),
      sizeUsd: v.number(),
      timestamp: v.number(),
      success: v.boolean(),
    }))),
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
          vwap: m.vwap,
          imbalance: m.imbalance,
          spikeFactor: m.spikeFactor,
          largeTrades: m.largeTrades,
        })
      }
      // Insert trades for this run
      for (const t of (args.trades ?? [])) {
        // Avoid duplicate trade records
        const existingTrade = await ctx.db.query('polybotTrades')
          .filter(q => q.and(
            q.eq(q.field('runId'), args.runId),
            q.eq(q.field('marketId'), t.marketId),
          ))
          .first()
        if (!existingTrade) {
          await ctx.db.insert('polybotTrades', {
            runId: args.runId,
            marketId: t.marketId,
            marketQuestion: t.marketQuestion,
            side: t.side,
            price: t.price,
            sizeUsd: t.sizeUsd,
            timestamp: t.timestamp,
            success: t.success,
          })
        }
      }
    }
  },
})
