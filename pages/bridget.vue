<script setup lang="ts">
import { api } from '~/convex/_generated/api'

const status = useConvexQuery(api.bridget.getStatus, {})
const scheduledJobs = useConvexQuery(api.bridget.getScheduledJobs, {})

const selectedJob = ref<{ name: string; prompt: string } | null>(null)

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
  '45 5 * * *': 'daily 05:45',
  '0 23 * * *': 'daily 23:00',
  '0 4 * * 0': 'Sun 04:00',
  '0 19 * * 0': 'Sun 19:00',
  '30 17 * * 1-5': 'weekdays 17:30',
}

function formatCron(cron: string) {
  return CRON_LABELS[cron] ?? cron
}

function formatJobName(name: string) {
  return name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

type Label = { text: string; style: string }

function getLabels(job: { runner?: string; prompt?: string }): Label[] {
  const labels: Label[] = []
  const runner = job.runner ?? 'python'
  const cmd = job.prompt ?? ''

  if (runner === 'claude') {
    labels.push({ text: 'claude', style: 'bg-purple-900/50 text-purple-300 border-purple-800/50' })
  }
  if (runner === 'python' || cmd.includes('python')) {
    labels.push({ text: 'python', style: 'bg-blue-900/50 text-blue-300 border-blue-800/50' })
  }
  if (cmd.includes('ollama') || cmd.includes('eod_nudge') || cmd.includes('ollama_compress')) {
    labels.push({ text: 'ollama', style: 'bg-green-900/50 text-green-300 border-green-800/50' })
  }
  return labels
}
</script>

<template>
  <div>
    <h1 class="text-lg font-semibold mb-6">Bridget</h1>

    <!-- Sync status -->
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

    <!-- Scheduled jobs -->
    <h2 class="text-sm text-gray-400 mb-3">Scheduled jobs</h2>
    <div v-if="scheduledJobs?.length" class="space-y-2">
      <div
        v-for="job in scheduledJobs"
        :key="job.name"
        class="border border-gray-800 rounded-lg p-3"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-sm font-medium">{{ formatJobName(job.name) }}</span>
              <span
                v-for="label in getLabels(job)"
                :key="label.text"
                class="inline-block text-xs px-1.5 py-0.5 rounded border font-mono"
                :class="label.style"
              >{{ label.text }}</span>
            </div>
            <div class="text-xs text-gray-600 font-mono mt-0.5">{{ job.name }}</div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs text-gray-600">{{ formatCron(job.schedule) }}</span>
            <button
              class="text-xs px-2 py-0.5 rounded border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors font-mono"
              @click="selectedJob = { name: job.name, prompt: job.prompt ?? '' }"
            >view</button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="text-sm text-gray-600">No scheduled jobs</div>

    <!-- Code preview modal -->
    <Teleport to="body">
      <div
        v-if="selectedJob"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        @click.self="selectedJob = null"
      >
        <div class="absolute inset-0 bg-black/60" @click="selectedJob = null" />
        <div class="relative bg-gray-950 border border-gray-800 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
            <span class="text-sm font-medium">{{ formatJobName(selectedJob.name) }}</span>
            <button class="text-gray-500 hover:text-white text-lg leading-none" @click="selectedJob = null">&times;</button>
          </div>
          <pre class="p-4 text-xs text-gray-300 overflow-auto font-mono leading-relaxed whitespace-pre-wrap">{{ selectedJob.prompt }}</pre>
        </div>
      </div>
    </Teleport>
  </div>
</template>
