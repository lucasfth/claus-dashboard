<script setup lang="ts">
import { api } from '~/convex/_generated/api'

definePageMeta({ middleware: 'auth' })

const commands = useConvexQuery(api.commands.list, {})
const copied = ref(false)

const TYPE_STYLE: Record<string, string> = {
  command: 'bg-blue-900/50 text-blue-300 border-blue-800/50',
  skill: 'bg-purple-900/50 text-purple-300 border-purple-800/50',
  claudeclaw: 'bg-yellow-900/50 text-yellow-300 border-yellow-800/50',
}

const sorted = computed(() => {
  if (!commands.value) return []
  return [...commands.value].sort((a, b) => {
    const order = { command: 0, skill: 1, claudeclaw: 2 }
    return (order[a.type] ?? 3) - (order[b.type] ?? 3) || a.name.localeCompare(b.name)
  })
})

function copyAllCommands() {
  if (!sorted.value) return
  const text = sorted.value
    .map(cmd => `${cmd.name} - ${cmd.description}`)
    .join('\n')
  navigator.clipboard.writeText(text)
  copied.value = true
  setTimeout(() => (copied.value = false), 2500)
}
</script>

<template>
  <div>
    <div class="mb-6">
      <div class="flex items-center justify-between gap-4">
        <div>
          <h1 class="text-xl font-semibold">Slash Commands</h1>
          <p class="text-xs text-gray-600 mt-1">All commands and skills available to Claus in the current session.</p>
        </div>
        <button
          v-if="sorted.length > 0"
          :disabled="copied"
          class="px-4 py-1.5 rounded text-sm font-medium transition-all disabled:opacity-50 border shrink-0"
          :class="copied
            ? 'bg-green-900/50 text-green-400 border-green-800/50'
            : 'bg-gray-800 text-white hover:bg-gray-700 border-gray-700/50'"
          @click="copyAllCommands"
        >
          {{ copied ? 'copied \u2713' : 'copy all' }}
        </button>
      </div>
    </div>

    <div v-if="commands === undefined" class="space-y-2">
      <div v-for="i in 8" :key="i" class="h-10 rounded-lg bg-gray-900/50 animate-pulse" />
    </div>

    <p v-else-if="sorted.length === 0" class="text-gray-600 text-sm">
      No commands synced yet. Bridge will push them on next run.
    </p>

    <div v-else class="space-y-2">
      <div
        v-for="cmd in sorted"
        :key="cmd._id"
        class="flex items-start gap-3 px-4 py-3 rounded-lg bg-gray-900/30 border border-gray-800/50 hover:border-gray-700/50 transition-colors"
      >
        <span
          class="inline-block text-xs px-2 py-0.5 rounded font-mono border shrink-0 mt-0.5"
          :class="TYPE_STYLE[cmd.type] ?? TYPE_STYLE.command"
        >
          {{ cmd.type }}
        </span>
        <div class="flex-1 min-w-0">
          <span class="font-mono text-sm text-white">/{{ cmd.name }}</span>
          <p class="text-xs text-gray-500 mt-0.5 leading-relaxed">{{ cmd.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
