<script setup lang="ts">
import { api } from '~/convex/_generated/api'

definePageMeta({ middleware: 'auth' })

const tasks = useConvexQuery(api.tasks.list, {})
const create = useConvexMutation(api.tasks.create)
const cancel = useConvexMutation(api.tasks.cancel)

const name = ref('')
const prompt = ref('')
const runAt = ref('')  // datetime-local string
const creating = ref(false)
const created = ref(false)

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-900/50 text-yellow-300 border-yellow-800/50',
  done: 'bg-green-900/50 text-green-300 border-green-800/50',
  cancelled: 'bg-gray-800/50 text-gray-500 border-gray-700/50',
}

async function submit() {
  if (!prompt.value.trim() || creating.value) return
  creating.value = true
  await create({
    name: name.value.trim() || 'task',
    prompt: prompt.value.trim(),
    runAt: runAt.value ? new Date(runAt.value).getTime() : undefined,
  })
  creating.value = false
  created.value = true
  name.value = ''
  prompt.value = ''
  runAt.value = ''
  setTimeout(() => (created.value = false), 2500)
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function formatRunAt(ts: number): string {
  return new Date(ts).toLocaleString('en-GB', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-xl font-semibold">Tasks</h1>
      <p class="text-xs text-gray-600 mt-1">One-shot prompts for Claus. Picked up within ~30 seconds, no browser needed.</p>
    </div>

    <!-- Create form -->
    <div class="rounded-lg bg-gray-900/30 border border-gray-800/50 px-4 py-4 mb-6 space-y-3">
      <div class="flex gap-3">
        <input
          v-model="name"
          placeholder="Label (optional)"
          class="bg-gray-800/50 border border-gray-700/50 rounded px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-500 w-40"
        />
        <input
          v-model="runAt"
          type="datetime-local"
          class="bg-gray-800/50 border border-gray-700/50 rounded px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-gray-500 flex-1 [color-scheme:dark]"
        />
      </div>
      <textarea
        v-model="prompt"
        placeholder="What should Claus do? e.g. 'Check the osws PR status and Telegram me a summary'"
        rows="3"
        class="w-full bg-gray-800/50 border border-gray-700/50 rounded px-3 py-2 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-gray-500 font-mono leading-relaxed"
        @keydown.meta.enter="submit"
        @keydown.ctrl.enter="submit"
      />
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-700">⌘↵ to queue &middot; no time = run ASAP</span>
        <button
          :disabled="creating || !prompt.trim()"
          class="px-4 py-1.5 rounded text-sm font-medium transition-all disabled:opacity-50 border"
          :class="created
            ? 'bg-green-900/50 text-green-400 border-green-800/50'
            : 'bg-gray-800 text-white hover:bg-gray-700 border-gray-700/50'"
          @click="submit"
        >
          {{ creating ? 'queuing\u2026' : created ? 'queued \u2713' : 'queue' }}
        </button>
      </div>
    </div>

    <!-- Task list -->
    <div v-if="tasks === undefined" class="space-y-2">
      <div v-for="i in 4" :key="i" class="h-14 rounded-lg bg-gray-900/50 animate-pulse" />
    </div>

    <p v-else-if="tasks.length === 0" class="text-gray-600 text-sm">No tasks yet.</p>

    <div v-else class="space-y-2">
      <div
        v-for="task in tasks"
        :key="task._id"
        class="flex items-start gap-3 px-4 py-3 rounded-lg bg-gray-900/30 border border-gray-800/50"
      >
        <span
          class="inline-block text-xs px-2 py-0.5 rounded font-mono border shrink-0 mt-0.5"
          :class="STATUS_STYLE[task.status]"
        >{{ task.status }}</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-baseline gap-2">
            <span class="text-sm text-white font-medium">{{ task.name }}</span>
            <span v-if="task.runAt" class="text-xs text-gray-600">⏰ {{ formatRunAt(task.runAt) }}</span>
            <span v-else class="text-xs text-gray-700">ASAP</span>
          </div>
          <p class="text-xs text-gray-500 font-mono mt-1 leading-relaxed">{{ task.prompt }}</p>
          <span class="text-xs text-gray-700">{{ relativeTime(task.createdAt) }}</span>
        </div>
        <button
          v-if="task.status === 'pending'"
          class="text-xs text-gray-700 hover:text-red-400 transition-colors shrink-0"
          @click="cancel({ id: task._id })"
        >cancel</button>
      </div>
    </div>
  </div>
</template>
