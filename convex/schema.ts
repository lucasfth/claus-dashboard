import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  activities: defineTable({
    timestamp: v.number(),
    type: v.union(
      v.literal('telegram'),
      v.literal('cron'),
      v.literal('github'),
      v.literal('briefing'),
      v.literal('misc'),
    ),
    summary: v.string(),
    details: v.optional(v.string()),
  }).index('by_timestamp', ['timestamp']),

  chatMessages: defineTable({
    role: v.union(v.literal('user'), v.literal('assistant')),
    content: v.string(),
    timestamp: v.number(),
    pinned: v.optional(v.boolean()),
  })
    .index('by_timestamp', ['timestamp'])
    .index('by_pinned', ['pinned']),

  contextNotes: defineTable({
    content: v.string(),
    updatedAt: v.number(),
  }),

  jobs: defineTable({
    name: v.string(),
    schedule: v.string(),
    prompt: v.string(),
    code: v.optional(v.string()),
    updatedAt: v.number(),
    runner: v.optional(v.union(v.literal('claude'), v.literal('python'))),
    pendingSchedule: v.optional(v.string()),
    pendingPrompt: v.optional(v.string()),
  }).index('by_name', ['name']),

  messages: defineTable({
    content: v.string(),
    createdAt: v.number(),
    processed: v.boolean(),
  }).index('by_processed', ['processed']),

  commands: defineTable({
    name: v.string(),
    description: v.string(),
    type: v.union(v.literal('command'), v.literal('skill'), v.literal('claudeclaw'), v.literal('bridge')),
    updatedAt: v.number(),
  }).index('by_name', ['name']),

  tasks: defineTable({
    name: v.string(),
    prompt: v.string(),
    runAt: v.optional(v.number()),
    status: v.union(v.literal('pending'), v.literal('done'), v.literal('cancelled')),
    createdAt: v.number(),
  })
    .index('by_status', ['status'])
    .index('by_createdAt', ['createdAt']),

  bridgetStatus: defineTable({
    lastSync: v.number(),
    jobsPushed: v.optional(v.number()),
    commandsPushed: v.optional(v.number()),
    activitiesPushed: v.optional(v.number()),
  }),

  polybotRuns: defineTable({
    runId: v.string(),
    startedAt: v.number(),
    finishedAt: v.number(),
    dryRun: v.boolean(),
    totalMarkets: v.number(),
    analysesGenerated: v.number(),
    tradesExecuted: v.number(),
    successfulTrades: v.number(),
  }).index('by_startedAt', ['startedAt']),

  polybotTopMarkets: defineTable({
    runId: v.string(),
    marketId: v.string(),
    marketQuestion: v.string(),
    score: v.number(),
    vwap: v.optional(v.number()),
    imbalance: v.optional(v.number()),
    spikeFactor: v.optional(v.number()),
    largeTrades: v.optional(v.number()),
    annotations: v.optional(v.array(v.string())),
  }).index('by_runId', ['runId']).index('by_score', ['score']),

  polybotTrades: defineTable({
    runId: v.string(),
    marketId: v.string(),
    marketQuestion: v.optional(v.string()),
    side: v.string(),
    price: v.number(),
    sizeUsd: v.number(),
    timestamp: v.number(),
    success: v.boolean(),
  }).index('by_runId', ['runId']).index('by_timestamp', ['timestamp']),
})
