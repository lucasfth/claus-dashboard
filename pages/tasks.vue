<script setup lang="ts">
import { api } from '~/convex/_generated/api'
import type { Id } from '~/convex/_generated/dataModel'

definePageMeta({ middleware: 'auth' })

// ── Queries & Mutations ───────────────────────────────────────────
const allTasks = useConvexQuery(api.tasks.list, {})

// Notes query uses optional taskId so it can always be called unconditionally.
// nuxt-convex doesn't support the 'skip' pattern that React's useQuery does.
const selectedId = ref<string | undefined>(undefined)
const notesArgs = reactive<{ taskId: string | undefined }>({ taskId: undefined })
watch(selectedId, (id) => { notesArgs.taskId = id }, { immediate: true })
// Keep notes usable even if Convex generated types are temporarily stale in editor.
const taskNotesApi = (api as any).taskNotes
const taskNotes = useConvexQuery(taskNotesApi.listForTaskOptional, notesArgs)

const safeTasks = computed(() =>
  ((allTasks.value ?? []) as any[]).filter((t) => t && typeof t._id === 'string'),
)
const safeTaskNotes = computed(() =>
  ((taskNotes.value ?? []) as any[]).filter((n) => n && typeof n._id === 'string'),
)

const createMut   = useConvexMutation(api.tasks.create)
const statusMut   = useConvexMutation(api.tasks.updateStatus)
const updateMut   = useConvexMutation(api.tasks.updateTask)
const cancelMut   = useConvexMutation(api.tasks.cancel)
const addNoteMut  = useConvexMutation(taskNotesApi.add)
const editNoteMut = useConvexMutation(taskNotesApi.edit)
const delNoteMut  = useConvexMutation(taskNotesApi.remove)

// ── Columns ─────────────────────────────────────────────────────
const todo = computed(() =>
  safeTasks.value.filter(t => t.status === 'todo' || t.status === 'pending')
    .sort((a, b) => (a.runAt ?? a.createdAt) - (b.runAt ?? b.createdAt)),
)
const inProgress = computed(() =>
  safeTasks.value.filter(t => t.status === 'in_progress')
    .sort((a, b) => b.createdAt - a.createdAt),
)
const done = computed(() =>
  safeTasks.value.filter(t => t.status === 'done')
    .sort((a, b) => (b.movedToDoneAt ?? b.createdAt) - (a.movedToDoneAt ?? a.createdAt)),
)

const COLUMNS = computed(() => [
  { key: 'todo',        label: 'Todo',        tasks: todo.value,       accentBorder: 'border-yellow-400/50 dark:border-yellow-600/30' },
  { key: 'in_progress', label: 'In Progress', tasks: inProgress.value, accentBorder: 'border-blue-400/50 dark:border-blue-600/30' },
  { key: 'done',        label: 'Done',        tasks: done.value,       accentBorder: 'border-green-400/50 dark:border-green-600/30' },
])

// ── Selected task ─────────────────────────────────────────────────
const selectedTask = computed(() =>
  selectedId.value ? safeTasks.value.find(t => t._id === selectedId.value) ?? null : null,
)

function openTask(task: any) {
  if (!task?._id) return
  selectedId.value = task._id
}

function closeModal() {
  selectedId.value = undefined
  editing.value = false
  noteText.value = ''
  editNoteId.value = null
  confirmCancelId.value = null
  confirmDelId.value = null
}

// ── Drag & drop ───────────────────────────────────────────────────
const draggingId  = ref<string | null>(null)
const dragOverCol = ref<string | null>(null)

function onDragStart(e: DragEvent, task: any) {
  if (!task?._id) return
  draggingId.value = task._id
  e.dataTransfer?.setData('text/plain', task._id)
}

function onDragEnd() {
  draggingId.value = null
  dragOverCol.value = null
}

async function onDrop(targetStatus: string) {
  if (!draggingId.value) return
  const task = safeTasks.value.find(t => t._id === draggingId.value)
  if (task && task.status !== targetStatus) {
    await statusMut({ id: draggingId.value as Id<'tasks'>, status: targetStatus as any })
  }
  draggingId.value = null
  dragOverCol.value = null
}

// ── Create form ───────────────────────────────────────────────────
const showCreate  = ref(false)
const newTitle    = ref('')
const newDesc     = ref('')
const newRunAt    = ref('')
const newPriority = ref('')
const newLabels   = ref('')
const newGhLink   = ref('')
const creating    = ref(false)

async function submitCreate() {
  if (!newTitle.value.trim() || !newDesc.value.trim() || creating.value) return
  creating.value = true
  try {
    await createMut({
      title: newTitle.value.trim(),
      description: newDesc.value.trim(),
      runAt: newRunAt.value ? new Date(newRunAt.value).getTime() : undefined,
      priority: (newPriority.value as any) || undefined,
      labels: newLabels.value ? newLabels.value.split(',').map(l => l.trim()).filter(Boolean) : undefined,
      githubLink: newGhLink.value.trim() || undefined,
    })
    showCreate.value = false
    newTitle.value = ''; newDesc.value = ''; newRunAt.value = ''
    newPriority.value = ''; newLabels.value = ''; newGhLink.value = ''
  } finally {
    creating.value = false
  }
}

// ── Edit task ─────────────────────────────────────────────────────
const editing      = ref(false)
const editTitle    = ref('')
const editDesc     = ref('')
const editRunAt    = ref('')
const editPriority = ref('')
const editLabels   = ref('')
const editGhLink   = ref('')
const saving       = ref(false)
const scheduleError = ref('')

const MIN_SCHEDULE_LEAD_MS = 5 * 60 * 1000

function getScheduleError(runAtMs?: number) {
  if (!runAtMs) return ''
  if (runAtMs - Date.now() < MIN_SCHEDULE_LEAD_MS) {
    return 'Scheduled time must be at least 5 minutes in the future.'
  }
  return ''
}

function startEdit() {
  const t = selectedTask.value
  if (!t) return
  editTitle.value    = t.title ?? (t as any).name ?? ''
  editDesc.value     = t.description ?? (t as any).prompt ?? ''
  editRunAt.value    = t.runAt ? toDatetimeLocal(t.runAt) : ''
  editPriority.value = t.priority ?? ''
  editLabels.value   = t.labels?.join(', ') ?? ''
  editGhLink.value   = t.githubLink ?? ''
  scheduleError.value = getScheduleError(t.runAt)
  editing.value = true
}

watch(editRunAt, (value) => {
  const parsed = value ? new Date(value).getTime() : undefined
  scheduleError.value = getScheduleError(parsed)
})

async function saveEdit() {
  if (!selectedId.value || saving.value) return

  const selected = selectedTask.value
  const nextRunAt = editRunAt.value ? new Date(editRunAt.value).getTime() : selected?.runAt
  if (selected?.status === 'todo') {
    const err = getScheduleError(nextRunAt)
    if (err) {
      scheduleError.value = err
      return
    }
  }

  saving.value = true
  try {
    await updateMut({
      id: selectedId.value as Id<'tasks'>,
      title: editTitle.value.trim(),
      description: editDesc.value.trim(),
      runAt: editRunAt.value ? new Date(editRunAt.value).getTime() : undefined,
      priority: (editPriority.value as any) || undefined,
      labels: editLabels.value ? editLabels.value.split(',').map(l => l.trim()).filter(Boolean) : undefined,
      githubLink: editGhLink.value.trim() || undefined,
    })
    editing.value = false
  } finally {
    saving.value = false
  }
}

// ── Status from panel ─────────────────────────────────────────────
async function changeStatus(status: string) {
  if (!selectedId.value) return
  await statusMut({ id: selectedId.value as Id<'tasks'>, status: status as any })
}

// ── Cancel ────────────────────────────────────────────────────────
const confirmCancelId = ref<string | null>(null)

async function handleCancel(id: string, e?: Event) {
  e?.stopPropagation()
  if (confirmCancelId.value !== id) { confirmCancelId.value = id; return }
  await cancelMut({ id: id as Id<'tasks'> })
  confirmCancelId.value = null
  if (selectedId.value === id) closeModal()
}

// ── Notes ─────────────────────────────────────────────────────────
const noteText     = ref('')
const addingNote   = ref(false)
const editNoteId   = ref<string | null>(null)
const editNoteText = ref('')
const savingNote   = ref(false)
const confirmDelId = ref<string | null>(null)

async function submitNote() {
  if (!selectedId.value || !noteText.value.trim() || addingNote.value) return
  addingNote.value = true
  try {
    await addNoteMut({ taskId: selectedId.value as Id<'tasks'>, content: noteText.value.trim(), author: 'lucas' })
    noteText.value = ''
  } finally {
    addingNote.value = false
  }
}

function startEditNote(note: any) {
  editNoteId.value   = note._id
  editNoteText.value = note.content
}

async function saveNote() {
  if (!editNoteId.value || savingNote.value) return
  savingNote.value = true
  try {
    await editNoteMut({ id: editNoteId.value as Id<'taskNotes'>, content: editNoteText.value.trim() })
    editNoteId.value = null
  } finally {
    savingNote.value = false
  }
}

async function deleteNote(id: string) {
  if (confirmDelId.value !== id) { confirmDelId.value = id; return }
  await delNoteMut({ id: id as Id<'taskNotes'> })
  confirmDelId.value = null
}

// ── Helpers ───────────────────────────────────────────────────────
function tTitle(t: any) { return t.title ?? (t as any).name ?? 'Untitled' }
function tDesc(t: any)  { return t.description ?? (t as any).prompt ?? '' }

function relTime(ts: number) {
  const d = Date.now() - ts
  if (d < 60_000)     return 'just now'
  if (d < 3_600_000)  return `${Math.floor(d / 60_000)}m ago`
  if (d < 86_400_000) return `${Math.floor(d / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function toDatetimeLocal(ts: number) {
  const d = new Date(ts)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

const PRIORITY_CLS: Record<string, string> = {
  high:   'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/40',
  medium: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/40',
  low:    'bg-gray-100 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700/60',
}

const STATUS_OPTIONS = [
  { value: 'todo',        label: 'Todo' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done',        label: 'Done' },
  { value: 'cancelled',   label: 'Cancelled' },
]
</script>

<template>
  <div>
    <!-- Header -->
    <div class="mb-5 flex items-center justify-between">
      <div>
        <h1 class="text-xl font-semibold">Tasks</h1>
        <p class="text-xs text-gray-500 dark:text-gray-600 mt-0.5">
          Drag cards between columns &middot; click to open &middot; scheduled tasks run automatically
        </p>
      </div>
      <button class="btn-ghost" @click="showCreate = !showCreate">+ new</button>
    </div>

    <!-- Create form -->
    <div v-if="showCreate" class="mb-6 rounded-lg bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800/50 p-4 space-y-3">
      <div class="flex gap-2">
        <input v-model="newTitle" placeholder="Title*" class="input flex-1" />
        <select v-model="newPriority" class="input w-28">
          <option value="">priority</option>
          <option value="high">high</option>
          <option value="medium">medium</option>
          <option value="low">low</option>
        </select>
      </div>
      <textarea
        v-model="newDesc"
        placeholder="Description* &#8212; what should Claus do?"
        rows="3"
        class="input w-full font-mono text-xs resize-none"
        @keydown.meta.enter="submitCreate"
        @keydown.ctrl.enter="submitCreate"
      />
      <div class="flex gap-2">
        <input v-model="newRunAt" type="datetime-local" class="input flex-1 [color-scheme:light] dark:[color-scheme:dark]" />
        <input v-model="newLabels" placeholder="labels, comma-separated" class="input flex-1" />
      </div>
      <input v-model="newGhLink" placeholder="GitHub link (optional)" class="input w-full" />
      <div class="flex justify-end gap-2">
        <button class="btn-ghost" @click="showCreate = false">cancel</button>
        <button :disabled="creating || !newTitle.trim() || !newDesc.trim()" class="btn-primary" @click="submitCreate">
          {{ creating ? 'creating\u2026' : 'create' }}
        </button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="allTasks === undefined" class="grid grid-cols-3 gap-4">
      <div v-for="i in 3" :key="i" class="space-y-2">
        <div class="h-4 w-20 rounded bg-gray-200 dark:bg-gray-800 animate-pulse mb-3" />
        <div v-for="j in 3" :key="j" class="h-20 rounded-lg bg-gray-200 dark:bg-gray-900/50 animate-pulse" />
      </div>
    </div>

    <!-- Kanban board -->
    <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
      <div
        v-for="col in COLUMNS"
        :key="col.key"
        class="flex flex-col gap-2 rounded-lg p-2 border transition-colors min-h-24"
        :class="dragOverCol === col.key
          ? 'bg-gray-100 dark:bg-gray-800/40 border-gray-400 dark:border-gray-600'
          : 'bg-gray-50/50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800/30'"
        @dragover.prevent="dragOverCol = col.key"
        @dragleave.self="dragOverCol = null"
        @drop.prevent="onDrop(col.key)"
      >
        <!-- Column header -->
        <div class="flex items-center gap-2 px-1 pb-1.5 border-b" :class="col.accentBorder">
          <span class="text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">{{ col.label }}</span>
          <span class="text-xs text-gray-400 dark:text-gray-600 font-mono">{{ col.tasks.length }}</span>
        </div>

        <!-- Cards -->
        <div
          v-for="task in col.tasks"
          :key="task._id"
          draggable="true"
          class="rounded-lg border bg-white dark:bg-gray-900/50 px-3 py-2.5 cursor-pointer select-none transition-all hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm"
          :class="draggingId === task._id ? 'opacity-40 scale-95 border-gray-300 dark:border-gray-700' : 'border-gray-200 dark:border-gray-800/60'"
          @dragstart="onDragStart($event, task)"
          @dragend="onDragEnd"
          @click="openTask(task)"
        >
          <!-- Top row -->
          <div class="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span class="text-xs font-mono text-gray-400 dark:text-gray-600">T-{{ task.taskId ?? '?' }}</span>
            <span
              v-if="task.priority"
              class="text-xs px-1.5 rounded border font-medium leading-5"
              :class="PRIORITY_CLS[task.priority]"
            >{{ task.priority }}</span>
            <span v-if="task.runAt" class="text-xs text-gray-400 dark:text-gray-600 ml-auto">⏰ {{ fmtDate(task.runAt) }}</span>
          </div>
          <!-- Title -->
          <p class="text-sm text-gray-900 dark:text-white font-medium leading-snug line-clamp-2">{{ tTitle(task) }}</p>
          <!-- Labels -->
          <div v-if="task.labels?.length" class="flex flex-wrap gap-1 mt-1.5">
            <span
              v-for="label in task.labels"
              :key="label"
              class="text-xs px-1.5 rounded bg-gray-100 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700/50 leading-5"
            >{{ label }}</span>
          </div>
          <!-- Footer -->
          <div class="flex items-center justify-between mt-1.5">
            <span class="text-xs text-gray-400 dark:text-gray-700">{{ relTime(task.createdAt) }}</span>
            <button
              v-if="task.status !== 'done' && task.status !== 'cancelled'"
              class="text-xs transition-colors px-0.5 leading-none"
              :class="confirmCancelId === task._id
                ? 'text-red-500 dark:text-red-400 font-medium'
                : 'text-gray-300 dark:text-gray-700 hover:text-red-500 dark:hover:text-red-400'"
              @click.stop="handleCancel(task._id, $event)"
            >{{ confirmCancelId === task._id ? 'confirm?' : '\u00d7' }}</button>
          </div>
        </div>

        <p v-if="col.tasks.length === 0" class="text-xs text-gray-400 dark:text-gray-700 text-center py-3">empty</p>
      </div>
    </div>

    <!-- Detail panel -->
    <Teleport to="body">
      <div
        v-if="selectedTask"
        class="fixed inset-0 z-50 flex"
        @keydown.esc.window="closeModal"
      >
        <div class="flex-1 bg-black/20 dark:bg-black/40" @click="closeModal" />
        <div class="w-full max-w-lg bg-white dark:bg-gray-950 border-l border-gray-200 dark:border-gray-800 flex flex-col shadow-2xl overflow-hidden">

          <!-- Panel header -->
          <div class="flex items-center gap-2 px-5 py-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
            <span class="text-xs font-mono text-gray-400 dark:text-gray-600">T-{{ selectedTask.taskId ?? '?' }}</span>
            <select
              :value="selectedTask.status === 'pending' ? 'todo' : selectedTask.status"
              class="text-xs border rounded px-2 py-0.5 bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-none"
              @change="changeStatus(($event.target as HTMLSelectElement).value)"
            >
              <option v-for="opt in STATUS_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
            <div class="flex-1" />
            <button v-if="!editing" class="text-xs text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" @click="startEdit">edit</button>
            <button class="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-xl leading-none ml-1" @click="closeModal">&times;</button>
          </div>

          <div class="flex-1 overflow-y-auto px-5 py-4 space-y-5">

            <!-- View mode -->
            <div v-if="!editing">
              <h2 class="text-base font-semibold text-gray-900 dark:text-white leading-snug">{{ tTitle(selectedTask) }}</h2>
              <div class="flex flex-wrap gap-1.5 mt-2">
                <span v-if="selectedTask.priority" class="text-xs px-2 py-0.5 rounded border font-medium" :class="PRIORITY_CLS[selectedTask.priority]">{{ selectedTask.priority }}</span>
                <span
                  v-for="label in selectedTask.labels"
                  :key="label"
                  class="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700/50"
                >{{ label }}</span>
              </div>
              <div class="flex flex-col gap-1 mt-2 text-xs text-gray-500">
                <span v-if="selectedTask.runAt">⏰ Scheduled: {{ fmtDate(selectedTask.runAt) }}</span>
                <a
                  v-if="selectedTask.githubLink"
                  :href="selectedTask.githubLink"
                  target="_blank"
                  rel="noopener"
                  class="text-blue-500 hover:underline truncate"
                  @click.stop
                >🔗 {{ selectedTask.githubLink }}</a>
              </div>
              <div class="mt-3">
                <p class="text-xs text-gray-400 dark:text-gray-600 font-medium uppercase tracking-wide mb-1.5">Description</p>
                <pre class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{{ tDesc(selectedTask) }}</pre>
              </div>
            </div>

            <!-- Edit mode -->
            <div v-else class="space-y-3">
              <input v-model="editTitle" placeholder="Title" class="input w-full" />
              <textarea v-model="editDesc" placeholder="Description" rows="4" class="input w-full font-mono text-xs resize-none" />
              <div class="flex gap-2">
                <select v-model="editPriority" class="input flex-1">
                  <option value="">no priority</option>
                  <option value="high">high</option>
                  <option value="medium">medium</option>
                  <option value="low">low</option>
                </select>
                <div class="relative flex-1">
                  <input v-model="editRunAt" type="datetime-local" class="input w-full [color-scheme:light] dark:[color-scheme:dark]" />
                  <div
                    v-if="scheduleError"
                    class="absolute left-0 top-full mt-1 z-10 rounded-md border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/80 px-2 py-1 text-[11px] text-red-700 dark:text-red-300 shadow"
                    role="alert"
                  >
                    {{ scheduleError }}
                  </div>
                </div>
              </div>
              <input v-model="editLabels" placeholder="labels, comma-separated" class="input w-full" />
              <input v-model="editGhLink" placeholder="GitHub link" class="input w-full" />
              <div class="flex gap-2">
                <button class="btn-ghost" @click="editing = false">cancel</button>
                <button :disabled="saving" class="btn-primary" @click="saveEdit">{{ saving ? 'saving\u2026' : 'save' }}</button>
              </div>
            </div>

            <!-- Notes section -->
            <div class="border-t border-gray-200 dark:border-gray-800 pt-4">
              <p class="text-xs text-gray-400 dark:text-gray-600 font-medium uppercase tracking-wide mb-3">Notes</p>

              <div v-if="taskNotes === undefined" class="space-y-2 mb-3">
                <div v-for="i in 2" :key="i" class="h-14 rounded bg-gray-100 dark:bg-gray-900/50 animate-pulse" />
              </div>

              <p v-else-if="safeTaskNotes.length === 0" class="text-xs text-gray-400 dark:text-gray-700 mb-3">No notes yet.</p>

              <div v-else class="space-y-3 mb-3">
                <div
                  v-for="note in safeTaskNotes"
                  :key="note._id"
                  class="rounded-lg border border-gray-200 dark:border-gray-800/60 px-3 py-2.5"
                >
                  <div class="flex items-center gap-2 mb-1.5">
                    <span
                      class="text-xs font-medium"
                      :class="note.author === 'claus' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'"
                    >{{ note.author === 'claus' ? 'Claus' : 'Lucas' }}</span>
                    <span class="text-xs text-gray-400 dark:text-gray-700">{{ relTime(note.createdAt) }}</span>
                    <span v-if="note.updatedAt !== note.createdAt" class="text-xs text-gray-400 dark:text-gray-700 italic">edited</span>
                    <div class="flex-1" />
                    <template v-if="editNoteId !== note._id">
                      <button class="text-xs text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors" @click="startEditNote(note)">edit</button>
                      <button
                        class="text-xs transition-colors"
                        :class="confirmDelId === note._id ? 'text-red-500 dark:text-red-400 font-medium' : 'text-gray-400 hover:text-red-500 dark:hover:text-red-400'"
                        @click="deleteNote(note._id)"
                      >{{ confirmDelId === note._id ? 'confirm?' : 'del' }}</button>
                    </template>
                  </div>
                  <div v-if="editNoteId === note._id" class="space-y-2">
                    <textarea v-model="editNoteText" rows="3" class="input w-full text-xs font-mono resize-none" />
                    <div class="flex gap-2">
                      <button class="btn-ghost text-xs py-1" @click="editNoteId = null">cancel</button>
                      <button :disabled="savingNote" class="btn-primary text-xs py-1" @click="saveNote">{{ savingNote ? 'saving\u2026' : 'save' }}</button>
                    </div>
                  </div>
                  <pre v-else class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{{ note.content }}</pre>
                </div>
              </div>

              <!-- Add note -->
              <div class="space-y-2">
                <textarea
                  v-model="noteText"
                  placeholder="Add a note\u2026 (markdown)"
                  rows="2"
                  class="input w-full text-sm resize-none"
                  @keydown.meta.enter="submitNote"
                  @keydown.ctrl.enter="submitNote"
                />
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-400 dark:text-gray-700">&#8984;&#8629; to add</span>
                  <button :disabled="addingNote || !noteText.trim()" class="btn-primary text-xs py-1" @click="submitNote">
                    {{ addingNote ? 'adding\u2026' : 'add note' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.input {
  @apply bg-white dark:bg-gray-800/50 border border-gray-300 dark:border-gray-700/50 rounded px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500;
}
.btn-primary {
  @apply px-3 py-1.5 rounded text-sm font-medium transition-all disabled:opacity-50 border bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent hover:bg-gray-700 dark:hover:bg-gray-100;
}
.btn-ghost {
  @apply px-3 py-1.5 rounded text-sm font-medium transition-all border bg-white dark:bg-transparent text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800;
}
</style>
