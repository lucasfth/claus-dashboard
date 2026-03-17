<script setup lang="ts">
import { api } from '~/convex/_generated/api'

definePageMeta({ middleware: 'auth' })

const jobs = useConvexQuery(api.jobs.list, {})

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold mb-6">Scheduled Jobs</h1>

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
          <tr v-for="job in jobs" :key="job._id" class="hover:bg-gray-900/20 transition-colors">
            <td class="py-3 pr-6 text-white font-mono text-xs whitespace-nowrap">{{ job.name }}</td>
            <td class="py-3 pr-6 text-gray-400 font-mono text-xs whitespace-nowrap">{{ job.schedule }}</td>
            <td class="py-3 pr-6 text-gray-500 text-xs max-w-xs truncate">{{ job.prompt }}</td>
            <td class="py-3 text-gray-600 text-xs text-right whitespace-nowrap">{{ formatDate(job.updatedAt) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
