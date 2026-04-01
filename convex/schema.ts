import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

export default defineSchema({
  ...authTables,

  // Controls dashboard access — set approved: true in Convex dashboard to grant access
  userAccess: defineTable({
    userId: v.id('users'),
    approved: v.boolean(),
  }).index('by_userId', ['userId']),

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
  }).index('by_timestamp', ['timestamp']),

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

  // Auto-increment counters (e.g. taskId)
  counters: defineTable({
    name: v.string(),
    value: v.number(),
  }).index('by_name', ['name']),

  tasks: defineTable({
    // Human-readable ID displayed as T-{taskId}. Auto-incremented via counters table.
    taskId: v.optional(v.number()),
    // Post-migration field names
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    // Legacy fields (kept for migration compat, removed post-migration)
    name: v.optional(v.string()),
    prompt: v.optional(v.string()),
    runAt: v.optional(v.number()),
    status: v.union(
      v.literal('todo'),
      v.literal('in_progress'),
      v.literal('done'),
      v.literal('archived'),
      v.literal('cancelled'),
      // Legacy status, migrated to 'todo'
      v.literal('pending'),
    ),
    createdAt: v.number(),
    priority: v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'))),
    labels: v.optional(v.array(v.string())),
    githubLink: v.optional(v.string()),
    movedToDoneAt: v.optional(v.number()),
  })
    .index('by_status', ['status'])
    .index('by_createdAt', ['createdAt'])
    .index('by_taskId', ['taskId']),

  // Activity notes on a task, appended by Lucas or Claus
  taskNotes: defineTable({
    taskId: v.id('tasks'),
    content: v.string(),
    author: v.union(v.literal('lucas'), v.literal('claus')),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_taskId', ['taskId']),

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

  polybotDryState: defineTable({
    virtualBalance: v.number(),
    updatedAt: v.number(),
  }),

  polybotDryPositions: defineTable({
    marketId: v.string(),
    marketQuestion: v.optional(v.string()),
    side: v.string(),
    entryPrice: v.number(),
    sizeUsd: v.number(),
    openedAt: v.number(),
    closedAt: v.optional(v.number()),
    closePrice: v.optional(v.number()),
    pnlUsd: v.optional(v.number()),
    status: v.union(v.literal('open'), v.literal('closed')),
  })
    .index('by_status', ['status'])
    .index('by_openedAt', ['openedAt']),
})
