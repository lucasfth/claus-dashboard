<script setup lang="ts">
import { api } from '~/convex/_generated/api'

const status = useConvexQuery(api.bridget.getStatus, {})
const scheduledJobs = useConvexQuery(api.bridget.getScheduledJobs, {})

function relativeTime(ts: number) {
  const diff = Date.now() - ts
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (diff < 60000) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

const CRON_LABELS: Record<string, string> = {
  '45 5 * * *': 'daily at 05:45',
  '0 23 * * *': 'daily at 23:00',
  '0 4 * * 0': 'weekly Sun at 04:00',
}

function formatCron(cron: string) {
  return CRON_LABELS[cron] ?? cron
}
</script>

<template>
  <div>
    <h1 class="text-lg font-semibold mb-6">Bridget</h1>

    <div class="border border-gray-800 rounded-lg p-4 mb-8">
      <div class="flex items-center justify-between mb-3">
        <span class="text-sm text-gray-400">Last sync</span>
        <span v-if="status" class="text-xs text-gray-500">{{ relativeTime(status.lastSync) }}</span>
        <span v-else class="text-xs text-gray-600">never</span>
      </div>
      <div v-if="status" class="grid grid-cols-3 gap-4 pt-2 border-t border-gray-800">
        <div class="text-center">
          <div class="text-2xl font-mono tabular-nums">{{ status.activitiesPushed ?? '\u2014' }}</div>
          <div class="text-xs text-gray-500 mt-1">activities</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-mono tabular-nums">{{ status.jobsPushed ?? '\u2014' }}</div>
          <div class="text-xs text-gray-500 mt-1">jobs</div>
        </div>
        <div class="text-center">
          <div class="text-2xl font-mono tabular-nums">{{ status.commandsPushed ?? '\u2014' }}</div>
          <div class="text-xs text-gray-500 mt-1">commands</div>
        </div>
      </div>
      <div v-else class="text-sm text-gray-600 pt-2 border-t border-gray-800">Waiting for first sync\u2026</div>
    </div>

    <h2 class="text-sm text-gray-400 mb-3">Scheduled jobs</h2>
    <div v-if="scheduledJobs?.length" class="space-y-2">
      <div
        v-for="job in scheduledJobs"
        :key="job.name"
        class="border border-gray-800 rounded-lg p-3 flex items-start justify-between gap-4"
      >
        <div class="min-w-0">
          <div class="text-sm font-mono">{{ job.name }}</div>
          <div class="text-xs text-gray-500 mt-1 truncate max-w-xs">{{ job.prompt }}</div>
        </div>
        <div class="text-xs text-gray-600 shrink-0 text-right">{{ formatCron(job.schedule) }}</div>
      </div>
    </div>
    <div v-else class="text-sm text-gray-600">No scheduled jobs</div>
  </div>
</template>
