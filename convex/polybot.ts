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

const runArgs = {
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
    annotations: v.optional(v.array(v.string())),
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
}

async function applyUpsertRun(ctx: any, args: typeof runArgs extends Record<string, any> ? any : never) {
  const existing = await ctx.db.query('polybotRuns')
    .filter((q: any) => q.eq(q.field('runId'), args.runId))
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
        annotations: m.annotations,
      })
    }
    for (const t of (args.trades ?? [])) {
      const existingTrade = await ctx.db.query('polybotTrades')
        .filter((q: any) => q.and(
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
}

// Internal mutation called from HTTP action (single run, kept for backwards compat)
export const upsertRun = internalMutation({
  args: runArgs,
  handler: async (ctx, args) => {
    await applyUpsertRun(ctx, args)
  },
})

// Batch upsert — accepts array of runs, processes all in one mutation
export const upsertRuns = internalMutation({
  args: {
    runs: v.array(v.object(runArgs)),
  },
  handler: async (ctx, args) => {
    for (const run of args.runs) {
      await applyUpsertRun(ctx, run)
    }
  },
})
