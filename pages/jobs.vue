<script setup lang="ts">
import { api } from '~/convex/_generated/api'

definePageMeta({ middleware: 'auth' })

const jobs = useConvexQuery(api.jobs.list, {})
const setSchedule = useConvexMutation(api.jobs.setSchedule)

const editing = ref<string | null>(null)
const editValue = ref('')
const saving = ref(false)

function startEdit(name: string, current: string) {
  editing.value = name
  editValue.value = current
}

function cancelEdit() {
  editing.value = null
  editValue.value = ''
}

async function saveEdit(name: string) {
  if (!editValue.value.trim()) return
  saving.value = true
  await setSchedule({ name, schedule: editValue.value.trim() })
  saving.value = false
  editing.value = null
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-xl font-semibold">Scheduled Jobs</h1>
      <p class="text-xs text-gray-600 mt-1">Edit a schedule and Claus picks it up within 15 min.</p>
    </div>

    <div v-if="jobs === undefined" class="space-y-2">
      <div v-for="i in 4" :key="i" class="h-12 rounded-lg bg-gray-900/50 animate-pulse" />
    </div>

    <p v-else-if="jobs.length === 0" class="text-gray-600 text-sm">
      No jobs yet. Run the bridge to sync jobs from Claus.
    </p>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-800">
            <th class="text-left text-xs text-gray-500 font-medium pb-3 pr-6 uppercase tracking-wide">Name</th>
            <th class="text-left text-xs text-gray-500 font-medium pb-3 pr-6 uppercase tracking-wide">Schedule</th>
            <th class="text-left text-xs text-gray-500 font-medium pb-3 pr-6 uppercase tracking-wide">Prompt</th>
            <th class="text-right text-xs text-gray-500 font-medium pb-3 uppercase tracking-wide">Updated</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-900">
          <tr v-for="job in jobs" :key="job._id" class="hover:bg-gray-900/20 transition-colors group">
            <td class="py-3 pr-6 text-white font-mono text-xs whitespace-nowrap">{{ job.name }}</td>
            <td class="py-3 pr-6 font-mono text-xs whitespace-nowrap">
              <div v-if="editing === job.name" class="flex items-center gap-2">
                <input
                  v-model="editValue"
                  class="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white font-mono text-xs w-36 focus:outline-none focus:border-gray-400"
                  @keyup.enter="saveEdit(job.name)"
                  @keyup.escape="cancelEdit"
                />
                <button
                  :disabled="saving"
                  class="text-green-400 hover:text-green-300 disabled:opacity-50 text-xs"
                  @click="saveEdit(job.name)"
                >save</button>
                <button class="text-gray-600 hover:text-gray-400 text-xs" @click="cancelEdit">cancel</button>
              </div>
              <div v-else class="flex items-center gap-2">
                <span :class="job.pendingSchedule ? 'text-yellow-400' : 'text-gray-400'">
                  {{ job.pendingSchedule ? job.pendingSchedule + ' (pending)' : job.schedule }}
                </span>
                <button
                  class="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-gray-300 text-xs transition-opacity"
                  @click="startEdit(job.name, job.pendingSchedule ?? job.schedule)"
                >edit</button>
              </div>
            </td>
            <td class="py-3 pr-6 text-gray-500 text-xs max-w-xs truncate">{{ job.prompt }}</td>
            <td class="py-3 text-gray-600 text-xs text-right whitespace-nowrap">{{ formatDate(job.updatedAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
