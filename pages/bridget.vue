<script setup lang="ts">
import { api } from '~/convex/_generated/api'

definePageMeta({ middleware: 'auth' })

const status = useConvexQuery(api.bridget.getStatus, {})
const jobs = useConvexQuery(api.jobs.list, {})
const setSchedule = useConvexMutation(api.jobs.setSchedule)
const setPrompt = useConvexMutation(api.jobs.setPrompt)

const selectedJob = ref<{ name: string; content: string } | null>(null)

type EditField = 'schedule' | 'prompt'
const editing = ref<{ name: string; field: EditField } | null>(null)
const editValue = ref('')
const saving = ref(false)

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

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

const DOW_NAMES: Record<string, string> = {
  '0': 'Sun', '1': 'Mon', '2': 'Tue', '3': 'Wed', '4': 'Thu', '5': 'Fri', '6': 'Sat',
}

function formatCron(cron: string): string {
  const parts = cron.trim().split(/\s+/)
  if (parts.length !== 5) return cron
  const [min, hour, dom, month, dow] = parts
  
  if (min.startsWith('*/') && hour === '*' && dom === '*' && month === '*' && dow === '*') {
    const interval = min.split('/')[1];
    return `every ${interval} mins`;
  }
  
  if (dom !== '*' || month !== '*') return cron
  const h = parseInt(hour)
  const m = parseInt(min)
  if (isNaN(h) || isNaN(m)) return cron
  const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  if (dow === '*') return `daily ${time}`
  if (dow === '1-5') return `weekdays ${time}`
  if (dow === '0,6' || dow === '6,0') return `weekends ${time}`
  if (DOW_NAMES[dow]) return `${DOW_NAMES[dow]} ${time}`
  return cron
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

function openPreview(job: { name: string; code?: string; prompt?: string }) {
  selectedJob.value = {
    name: job.name,
    content: job.code ?? job.prompt ?? '',
  }
}

function startEdit(name: string, field: EditField, current: string) {
  editing.value = { name, field }
  editValue.value = current
}

function cancelEdit() {
  editing.value = null
  editValue.value = ''
}

async function saveEdit() {
  if (!editing.value || !editValue.value.trim()) return
  saving.value = true
  const { name, field } = editing.value
  if (field === 'schedule') {
    await setSchedule({ name, schedule: editValue.value.trim() })
  } else {
    await setPrompt({ name, prompt: editValue.value.trim() })
  }
  saving.value = false
  editing.value = null
}

function isEditing(name: string, field: EditField) {
  return editing.value?.name === name && editing.value?.field === field
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

    <div v-if="jobs === undefined" class="space-y-2">
      <div v-for="i in 4" :key="i" class="h-16 rounded-lg bg-gray-900/50 animate-pulse" />
    </div>

    <p v-else-if="jobs.length === 0" class="text-sm text-gray-600">No scheduled jobs</p>

    <div v-else class="space-y-2">
      <div
        v-for="job in jobs"
        :key="job.name"
        class="border border-gray-800 rounded-lg p-3 group"
      >
        <!-- Header: name + labels | date + view -->
        <div class="flex items-start justify-between gap-3 mb-2">
          <div class="flex items-center gap-2 flex-wrap min-w-0">
            <span class="text-sm font-medium">{{ formatJobName(job.name) }}</span>
            <span
              v-for="label in getLabels(job)"
              :key="label.text"
              class="inline-block text-xs px-1.5 py-0.5 rounded border font-mono"
              :class="label.style"
            >{{ label.text }}</span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs text-gray-700">{{ formatDate(job.updatedAt) }}</span>
            <button
              class="text-xs px-2 py-0.5 rounded border border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 transition-colors font-mono"
              @click="openPreview(job)"
            >view</button>
          </div>
        </div>

        <!-- Schedule -->
        <div>
          <div v-if="isEditing(job.name, 'schedule')" class="flex items-center gap-2">
            <input
              v-model="editValue"
              class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white font-mono text-xs w-full sm:w-44 focus:outline-none focus:border-gray-400"
              @keyup.enter="saveEdit"
              @keyup.escape="cancelEdit"
            />
            <button :disabled="saving" class="text-green-400 hover:text-green-300 text-xs disabled:opacity-50" @click="saveEdit">save</button>
            <button class="text-gray-600 hover:text-gray-400 text-xs" @click="cancelEdit">cancel</button>
          </div>
          <div v-else class="flex items-center gap-2">
            <span class="text-xs font-mono" :class="job.pendingSchedule ? 'text-yellow-400' : 'text-gray-600'">
              {{ job.pendingSchedule ? formatCron(job.pendingSchedule) + ' (pending)' : formatCron(job.schedule) }}
            </span>
            <button
              class="opacity-40 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-gray-500 outline-none text-gray-600 hover:text-gray-400 text-xs transition-opacity rounded px-0.5"
              @click="startEdit(job.name, 'schedule', job.pendingSchedule ?? job.schedule)"
            >edit</button>
          </div>
        </div>

        <!-- Prompt (claude jobs only) -->
        <div v-if="job.runner === 'claude'" class="mt-2">
          <div v-if="isEditing(job.name, 'prompt')" class="space-y-2">
            <textarea
              v-model="editValue"
              rows="4"
              class="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white font-mono text-xs focus:outline-none focus:border-gray-400 resize-none"
              @keyup.escape="cancelEdit"
            />
            <div class="flex gap-2">
              <button :disabled="saving" class="text-green-400 hover:text-green-300 text-xs disabled:opacity-50" @click="saveEdit">save</button>
              <button class="text-gray-600 hover:text-gray-400 text-xs" @click="cancelEdit">cancel</button>
            </div>
          </div>
          <div v-else class="flex items-start gap-2">
            <p class="text-xs font-mono leading-relaxed flex-1 line-clamp-2" :class="job.pendingPrompt ? 'text-yellow-400/70' : 'text-gray-600'">
              {{ job.pendingPrompt ? job.pendingPrompt + ' (pending)' : job.prompt }}
            </p>
            <button
              class="opacity-40 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-gray-500 outline-none text-gray-600 hover:text-gray-400 text-xs transition-opacity shrink-0 rounded px-0.5"
              @click="startEdit(job.name, 'prompt', job.pendingPrompt ?? job.prompt)"
            >edit</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Code preview modal -->
    <Teleport to="body">
      <div v-if="selectedJob" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" @click="selectedJob = null" />
        <div class="relative bg-gray-950 border border-gray-800 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
          <div class="flex items-center justify-between px-4 py-3 border-b border-gray-800 shrink-0">
            <span class="text-sm font-medium">{{ formatJobName(selectedJob.name) }}</span>
            <button class="text-gray-500 hover:text-white text-lg leading-none" @click="selectedJob = null">&times;</button>
          </div>
          <pre class="p-4 text-xs text-gray-300 overflow-auto font-mono leading-relaxed">{{ selectedJob.content }}</pre>
        </div>
      </div>
    </Teleport>
  </div>
</template>
