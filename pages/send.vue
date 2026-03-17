<script setup lang="ts">
import { api } from '~/convex/_generated/api'

definePageMeta({ middleware: 'auth' })

const send = useConvexMutation(api.messages.send)

const message = ref('')
const sending = ref(false)
const sent = ref(false)

async function submit() {
  if (!message.value.trim() || sending.value) return
  sending.value = true
  await send({ content: message.value.trim() })
  sending.value = false
  sent.value = true
  message.value = ''
  setTimeout(() => (sent.value = false), 3000)
}
</script>

<template>
  <div>
    <div class="mb-6">
      <h1 class="text-xl font-semibold">Send to Claus</h1>
      <p class="text-xs text-gray-600 mt-1">Message gets queued and Claus picks it up within 15 min, then replies via Telegram.</p>
    </div>

    <div class="space-y-3">
      <textarea
        v-model="message"
        placeholder="e.g. 'Can you check the osws PR status?', 'Remind me to push thesis at 18:00'..."
        rows="5"
        class="w-full bg-gray-900/30 border border-gray-800/50 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-gray-600 font-mono leading-relaxed transition-colors"
        @keydown.meta.enter="submit"
        @keydown.ctrl.enter="submit"
      />
      <div class="flex items-center justify-between">
        <span class="text-xs text-gray-700">⌘↵ to send</span>
        <button
          :disabled="sending || !message.trim()"
          class="px-4 py-1.5 rounded text-sm font-medium transition-all disabled:opacity-50 border"
          :class="sent
            ? 'bg-green-900/50 text-green-400 border-green-800/50'
            : 'bg-gray-800 text-white hover:bg-gray-700 border-gray-700/50'"
          @click="submit"
        >
          {{ sending ? 'sending\u2026' : sent ? 'queued \u2713' : 'send' }}
        </button>
      </div>
    </div>

    <div v-if="sent" class="mt-6 px-4 py-3 rounded-lg bg-green-900/20 border border-green-800/30 text-xs text-green-400">
      Message queued. Claus will pick it up on the next bridge sync (~15 min) and reply via Telegram.
    </div>
  </div>
</template>
