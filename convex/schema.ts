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
    pendingSchedule: v.optional(v.string()),
  }).index('by_name', ['name']),

  messages: defineTable({
    content: v.string(),
    createdAt: v.number(),
    processed: v.boolean(),
  }).index('by_processed', ['processed']),
})
