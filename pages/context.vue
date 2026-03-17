<script setup lang="ts">
import { api } from '~/convex/_generated/api'

definePageMeta({ middleware: 'auth' })

const contextNote = useConvexQuery(api.context.get, {})
const upsert = useConvexMutation(api.context.upsert)

const value = ref('')
const saving = ref(false)
const saved = ref(false)
const initialized = ref(false)
const textarea = ref<HTMLTextAreaElement | null>(null)

watch(contextNote, (note) => {
  if (note !== undefined && !initialized.value) {
    value.value = note?.content ?? ''
    initialized.value = true
  }
})

watch(value, () => {
  nextTick(() => {
    if (textarea.value) {
      textarea.value.style.height = 'auto'
      textarea.value.style.height = textarea.value.scrollHeight + 'px'
    }
  })
})

async function save() {
  saving.value = true
  await upsert({ content: value.value })
  saving.value = false
  saved.value = true
  setTimeout(() => (saved.value = false), 2000)
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-xl font-semibold">Context Pad</h1>
      <p class="text-xs text-gray-600 mt-1">Notes Claus reads at the start of every session. Use it for reminders, ongoing context, or anything you want him to keep in mind.</p>
    </div>

    <div v-if="contextNote === undefined" class="h-64 rounded-lg bg-gray-900/50 animate-pulse" />

    <div v-else class="space-y-3">
      <textarea
        ref="textarea"
        v-model="value"
        placeholder="e.g. 'Focus on thesis this week', 'Don't push to osws main until Monday', 'Remind me about the Estaid deploy'..."
        class="w-full min-h-[300px] bg-gray-900/30 border border-gray-800/50 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-gray-600 font-mono leading-relaxed transition-colors"
      />
      <div class="flex items-center justify-between">
        <span v-if="contextNote?.updatedAt" class="text-xs text-gray-600">
          Last saved {{ formatDate(contextNote.updatedAt) }}
        </span>
        <span v-else />
        <button
          :disabled="saving"
          class="px-4 py-1.5 rounded text-sm font-medium transition-all disabled:opacity-50 border"
          :class="saved
            ? 'bg-green-900/50 text-green-400 border-green-800/50'
            : 'bg-gray-800 text-white hover:bg-gray-700 border-gray-700/50'"
          @click="save"
        >
          {{ saving ? 'saving\u2026' : saved ? 'saved' : 'save' }}
        </button>
      </div>
    </div>
  </div>
</template>
