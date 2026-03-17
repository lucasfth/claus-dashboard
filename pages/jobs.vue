<script setup lang="ts">
import { api } from '~/convex/_generated/api'

definePageMeta({ middleware: 'auth' })

const jobs = useConvexQuery(api.jobs.list, {})
const setSchedule = useConvexMutation(api.jobs.setSchedule)
const setPrompt = useConvexMutation(api.jobs.setPrompt)

type EditField = 'schedule' | 'prompt'
const editing = ref<{ name: string; field: EditField } | null>(null)
const editValue = ref('')
const saving = ref(false)

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

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}

function isEditing(name: string, field: EditField) {
  return editing.value?.name === name && editing.value?.field === field
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-xl font-semibold">Scheduled Jobs</h1>
      <p class="text-xs text-gray-600 mt-1">Hover a field to edit it. Changes are picked up by Claus within 15 min.</p>
    </div>

    <div v-if="jobs === undefined" class="space-y-2">
      <div v-for="i in 4" :key="i" class="h-12 rounded-lg bg-gray-900/50 animate-pulse" />
    </div>

    <p v-else-if="jobs.length === 0" class="text-gray-600 text-sm">
      No jobs yet. Run the bridge to sync jobs from Claus.
    </p>

    <div v-else class="space-y-3">
      <div
        v-for="job in jobs"
        :key="job._id"
        class="rounded-lg bg-gray-900/30 border border-gray-800/50 px-4 py-3 group"
      >
        <div class="flex items-start justify-between gap-4 mb-2">
          <span class="font-mono text-xs text-white font-semibold">{{ job.name }}</span>
          <span class="text-gray-700 text-xs whitespace-nowrap">{{ formatDate(job.updatedAt) }}</span>
        </div>

        <!-- Schedule -->
        <div class="mb-2">
          <span class="text-xs text-gray-600 uppercase tracking-wide">schedule</span>
          <div v-if="isEditing(job.name, 'schedule')" class="flex items-center gap-2 mt-1">
            <input
              v-model="editValue"
              class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white font-mono text-xs w-full sm:w-40 focus:outline-none focus:border-gray-400"
              @keyup.enter="saveEdit"
              @keyup.escape="cancelEdit"
            />
            <button :disabled="saving" class="text-green-400 hover:text-green-300 text-xs disabled:opacity-50" @click="saveEdit">save</button>
            <button class="text-gray-600 hover:text-gray-400 text-xs" @click="cancelEdit">cancel</button>
          </div>
          <div v-else class="flex items-center gap-2 mt-1">
            <span class="font-mono text-xs" :class="job.pendingSchedule ? 'text-yellow-400' : 'text-gray-400'">
              {{ job.pendingSchedule ? job.pendingSchedule + ' (pending)' : job.schedule }}
            </span>
            <button
              class="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-gray-400 text-xs transition-opacity"
              @click="startEdit(job.name, 'schedule', job.pendingSchedule ?? job.schedule)"
            >edit</button>
          </div>
        </div>

        <!-- Prompt -->
        <div>
          <span class="text-xs text-gray-600 uppercase tracking-wide">prompt</span>
          <div v-if="isEditing(job.name, 'prompt')" class="mt-1 space-y-2">
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
          <div v-else class="flex items-start gap-2 mt-1">
            <p class="text-xs text-gray-500 font-mono leading-relaxed flex-1" :class="job.pendingPrompt ? 'text-yellow-400/70' : ''">
              {{ job.pendingPrompt ? job.pendingPrompt + ' (pending)' : job.prompt }}
            </p>
            <button
              class="opacity-0 group-hover:opacity-100 text-gray-700 hover:text-gray-400 text-xs transition-opacity shrink-0"
              @click="startEdit(job.name, 'prompt', job.pendingPrompt ?? job.prompt)"
            >edit</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
