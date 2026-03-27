<script setup lang="ts">
import { api } from '~/convex/_generated/api'
import type { Id } from '~/convex/_generated/dataModel'

definePageMeta({ middleware: 'auth' })

const tasks = useConvexQuery(api.tasks.list, {})
const sortedTasks = computed(() => {
  if (!tasks.value) return []
  return [...tasks.value].sort((a, b) => {
    const aTime = a.runAt ?? a.createdAt
    const bTime = b.runAt ?? b.createdAt
    return bTime - aTime
  })
})

const create = useConvexMutation(api.tasks.create)
const cancel = useConvexMutation(api.tasks.cancel)
const update = useConvexMutation(api.tasks.updateTask)

const name = ref('')
const prompt = ref('')
const runAt = ref('')
const creating = ref(false)
const created = ref(false)

const editingId = ref<Id<'tasks'> | null>(null)
const editName = ref('')
const editPrompt = ref('')
const editRunAt = ref('')
const editing = ref(false)

const confirmingCancelId = ref<Id<'tasks'> | null>(null)
const cancelling = ref(false)

const STATUS_STYLE: Record<string, string> = {
  pending: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800/50',
  done: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 border-green-300 dark:border-green-800/50',
  cancelled: 'bg-gray-100 dark:bg-gray-800/50 text-gray-500 border-gray-300 dark:border-gray-700/50',
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

function toDatetimeLocal(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function canEditTask(task: any): boolean {
  if (task.status !== 'pending') return false
  if (!task.runAt) return false
  return task.runAt - Date.now() >= 30 * 60 * 1000
}

function startEdit(task: any) {
  editingId.value = task._id
  editName.value = task.name
  editPrompt.value = task.prompt
  editRunAt.value = task.runAt ? toDatetimeLocal(task.runAt) : ''
}

async function saveEdit() {
  if (!editingId.value || editing.value) return
  editing.value = true
  try {
    await update({
      id: editingId.value,
      name: editName.value,
      prompt: editPrompt.value,
      runAt: editRunAt.value ? new Date(editRunAt.value).getTime() : undefined,
    })
    editingId.value = null
  } finally {
    editing.value = false
  }
}

function cancelEdit() {
  editingId.value = null
  editName.value = ''
  editPrompt.value = ''
  editRunAt.value = ''
}

async function handleCancel(id: Id<'tasks'>) {
  if (confirmingCancelId.value !== id) {
    confirmingCancelId.value = id
    return
  }

  if (cancelling.value) return
  cancelling.value = true
  try {
    await cancel({ id })
    confirmingCancelId.value = null
  } finally {
    cancelling.value = false
  }
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-xl font-semibold">Tasks</h1>
      <p class="text-xs text-gray-500 dark:text-gray-600 mt-1">
        One-shot prompts for Claus. Picked up within ~30s.
        <span class="inline-flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded text-xs font-mono border bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 border-orange-300 dark:border-orange-800/50">claude</span>
        &mdash; uses tokens when it fires.
      </p>
    </div>

    <!-- Create form -->
    <div class="rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800/50 px-4 py-4 mb-6 space-y-3">
      <div class="flex gap-3">
        <label for="task-name" class="sr-only">Task Label (optional)</label>
        <input
          id="task-name"
          v-model="name"
          placeholder="Label (optional)"
          class="bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700/50 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 w-40"
        />
        <label for="task-run-at" class="sr-only">Run at</label>
        <input
          id="task-run-at"
          v-model="runAt"
          type="datetime-local"
          class="bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700/50 rounded px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 flex-1 [color-scheme:light] dark:[color-scheme:dark]"
        />
      </div>
      <label for="task-prompt" class="sr-only">Task Prompt</label>
      <textarea
        id="task-prompt"
        v-model="prompt"
        placeholder="What should Claus do?"
        rows="3"
        class="w-full bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700/50 rounded px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 resize-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 font-mono leading-relaxed"
        @keydown.meta.enter="submit"
        @keydown.ctrl.enter="submit"
      />
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-400 dark:text-gray-700">&#8984;&#8629; to queue &middot; no time = ASAP</span>
        <button
          :disabled="creating || !prompt.trim()"
          class="px-4 py-1.5 rounded text-sm font-medium transition-all disabled:opacity-50 border"
          :class="created
            ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800/50'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700 border-gray-300 dark:border-gray-700/50'"
          @click="submit"
        >
          {{ creating ? 'queuing\u2026' : created ? 'queued \u2713' : 'queue' }}
        </button>
      </div>
    </div>

    <!-- Task list -->
    <div v-if="tasks === undefined" class="space-y-2">
      <div v-for="i in 4" :key="i" class="h-14 rounded-lg bg-gray-200 dark:bg-gray-900/50 animate-pulse" />
    </div>

    <p v-else-if="tasks.length === 0" class="text-gray-500 dark:text-gray-600 text-sm">No tasks yet.</p>

    <div v-else class="space-y-2">
      <div
        v-for="task in sortedTasks"
        :key="task._id"
        class="flex items-start gap-3 px-4 py-3 rounded-lg bg-white dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800/50"
      >
        <span
          class="inline-block text-xs px-2 py-0.5 rounded font-mono border shrink-0 mt-0.5"
          :class="STATUS_STYLE[task.status]"
        >{{ task.status }}</span>

        <div v-if="editingId === task._id" class="flex-1 min-w-0 space-y-2">
          <div class="flex gap-2">
            <input
              v-model="editName"
              type="text"
              placeholder="Label"
              class="flex-1 bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700/50 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500"
            />
            <input
              v-model="editRunAt"
              type="datetime-local"
              class="bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700/50 rounded px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
          <textarea
            v-model="editPrompt"
            placeholder="What should Claus do?"
            rows="3"
            class="w-full bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700/50 rounded px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 resize-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 font-mono leading-relaxed"
          />
          <div class="flex gap-2 pt-1">
            <button
              :disabled="editing"
              class="px-3 py-1.5 rounded text-sm font-medium transition-all disabled:opacity-50 border bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 border-green-300 dark:border-green-800/50 hover:bg-green-200 dark:hover:bg-green-900/70"
              @click="saveEdit"
            >
              {{ editing ? 'saving\u2026' : 'save' }}
            </button>
            <button
              :disabled="editing"
              class="px-3 py-1.5 rounded text-sm font-medium transition-all disabled:opacity-50 border bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700/50 hover:bg-gray-200 dark:hover:bg-gray-700"
              @click="cancelEdit"
            >
              cancel
            </button>
          </div>
        </div>

        <div v-else class="flex-1 min-w-0">
          <div class="flex items-baseline gap-2">
            <span class="text-sm text-gray-900 dark:text-white font-medium">{{ task.name }}</span>
            <span v-if="task.runAt" class="text-xs text-gray-500 dark:text-gray-600">&#9200; {{ formatRunAt(task.runAt) }}</span>
            <span v-else class="text-xs text-gray-400 dark:text-gray-700">ASAP</span>
          </div>
          <p class="text-xs text-gray-500 font-mono mt-1 leading-relaxed">{{ task.prompt }}</p>
          <span class="text-xs text-gray-400 dark:text-gray-700">{{ relativeTime(task.createdAt) }}</span>
        </div>

        <div v-if="task.status === 'pending'" class="flex gap-1.5 shrink-0">
          <template v-if="confirmingCancelId === task._id">
            <button
              :disabled="cancelling"
              class="text-xs text-red-500 dark:text-red-400 font-medium transition-colors hover:text-red-600 dark:hover:text-red-300 focus-visible:ring-1 focus-visible:ring-red-400 px-1 rounded disabled:opacity-50"
              @click="handleCancel(task._id)"
            >
              {{ cancelling ? 'cancelling\u2026' : 'confirm' }}
            </button>
            <button
              :disabled="cancelling"
              class="text-xs text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-gray-300 focus-visible:ring-1 focus-visible:ring-gray-500 px-1 rounded disabled:opacity-50"
              @click="confirmingCancelId = null"
            >
              back
            </button>
          </template>
          <template v-else>
            <button
              v-if="canEditTask(task)"
              class="text-xs text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus-visible:ring-1 focus-visible:ring-blue-400 px-1 rounded"
              aria-label="Edit task"
              @click="startEdit(task)"
            >
              edit
            </button>
            <button
              class="text-xs text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors focus-visible:ring-1 focus-visible:ring-red-400 px-1 rounded"
              aria-label="Cancel task"
              @click="handleCancel(task._id)"
            >
              cancel
            </button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
