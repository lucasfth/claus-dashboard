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

  contextNotes: defineTable({
    content: v.string(),
    updatedAt: v.number(),
  }),

  jobs: defineTable({
    name: v.string(),
    schedule: v.string(),
    prompt: v.string(),
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
    type: v.union(v.literal('command'), v.literal('skill'), v.literal('claudeclaw')),
    updatedAt: v.number(),
  }).index('by_name', ['name']),

  tasks: defineTable({
    name: v.string(),
    prompt: v.string(),
    runAt: v.optional(v.number()),
    status: v.union(v.literal('pending'), v.literal('done'), v.literal('cancelled')),
    createdAt: v.number(),
  }).index('by_status', ['status']),
})
