<script setup lang="ts">
import { api } from '~/convex/_generated/api'

definePageMeta({ middleware: 'auth' })

const activities = useConvexQuery(api.activities.list, {})

const TYPE_STYLE: Record<string, string> = {
  telegram: 'bg-blue-900/50 text-blue-300 border-blue-800/50',
  cron: 'bg-yellow-900/50 text-yellow-300 border-yellow-800/50',
  github: 'bg-purple-900/50 text-purple-300 border-purple-800/50',
  briefing: 'bg-green-900/50 text-green-300 border-green-800/50',
  misc: 'bg-gray-800/50 text-gray-400 border-gray-700/50',
}

function relativeTime(ts: number): string {
  const diff = Date.now() - ts
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold mb-6">Activity Feed</h1>

    <div v-if="activities === undefined" class="space-y-3">
      <div v-for="i in 6" :key="i" class="h-14 rounded-lg bg-gray-900/50 animate-pulse" />
    </div>

    <p v-else-if="activities.length === 0" class="text-gray-600 text-sm">
      No activity yet.
    </p>

    <div v-else class="space-y-2">
      <div
        v-for="item in activities"
        :key="item._id"
        class="flex flex-col gap-1.5 px-4 py-3 rounded-lg bg-gray-900/30 border border-gray-800/50 hover:border-gray-700/50 transition-colors"
      >
        <div class="flex items-center gap-3">
          <span
            class="inline-block text-xs px-2 py-0.5 rounded font-mono border"
            :class="TYPE_STYLE[item.type] ?? TYPE_STYLE.misc"
          >
            {{ item.type }}
          </span>
          <span class="text-sm flex-1 leading-snug">{{ item.summary }}</span>
          <span class="text-gray-600 text-xs shrink-0 font-mono">{{ relativeTime(item.timestamp) }}</span>
        </div>
        <p v-if="item.details" class="text-gray-500 text-xs font-mono leading-relaxed">
          {{ item.details }}
        </p>
      </div>
    </div>
  </div>
</template>
