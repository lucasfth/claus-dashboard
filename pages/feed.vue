<script setup lang="ts">
import { api } from '~/convex/_generated/api'

definePageMeta({ middleware: 'auth' })

const messages = useConvexQuery(api.chatMessages.list, {})
const togglePin = useConvexMutation(api.chatMessages.togglePin)

const pinned = computed(() => (messages.value ?? []).filter(m => m.pinned))
const thread = computed(() => (messages.value ?? []).filter(m => !m.pinned))

const chatBottom = ref<HTMLElement | null>(null)

watch(messages, () => {
  nextTick(() => chatBottom.value?.scrollIntoView({ behavior: 'smooth' }))
})

function formatTime(ts: number): string {
  const d = new Date(ts)
  const diff = Date.now() - ts
  if (diff < 86_400_000) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <h1 class="text-xl font-semibold">Chat</h1>

    <!-- Pinned messages -->
    <div v-if="pinned.length > 0" class="space-y-2">
      <p class="text-xs text-gray-500 font-mono uppercase tracking-wider">Pinned</p>
      <div
        v-for="msg in pinned"
        :key="msg._id"
        class="flex gap-2 items-start px-3 py-2 rounded-lg border border-yellow-800/40 bg-yellow-900/10 group"
      >
        <span class="text-yellow-500 text-xs mt-0.5 shrink-0">📌</span>
        <div class="flex-1 min-w-0">
          <p class="text-xs text-gray-500 mb-0.5 font-mono">
            {{ msg.role === 'user' ? 'Lucas' : 'Claus' }} · {{ formatTime(msg.timestamp) }}
          </p>
          <p class="text-sm text-gray-200 whitespace-pre-wrap break-words">{{ msg.content }}</p>
        </div>
        <button
          class="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-yellow-400 text-xs shrink-0"
          title="Unpin"
          @click="togglePin({ id: msg._id })"
        >unpin</button>
      </div>
    </div>

    <!-- Loading skeleton -->
    <div v-if="messages === undefined" class="space-y-3">
      <div v-for="i in 6" :key="i" class="h-12 rounded-xl bg-gray-900/50 animate-pulse" />
    </div>

    <p v-else-if="thread.length === 0 && pinned.length === 0" class="text-gray-600 text-sm">
      No messages yet.
    </p>

    <!-- Chat thread -->
    <div v-else class="space-y-1">
      <div
        v-for="msg in thread"
        :key="msg._id"
        class="flex group"
        :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div
          class="relative max-w-[80%] px-3 py-2 rounded-2xl"
          :class="msg.role === 'user'
            ? 'bg-blue-900/50 border border-blue-800/40 rounded-br-sm'
            : 'bg-gray-900/60 border border-gray-700/40 rounded-bl-sm'"
        >
          <p class="text-[11px] font-mono mb-1"
            :class="msg.role === 'user' ? 'text-blue-400/70 text-right' : 'text-gray-500'"
          >
            {{ msg.role === 'user' ? 'Lucas' : 'Claus' }} · {{ formatTime(msg.timestamp) }}
          </p>
          <p class="text-sm leading-relaxed whitespace-pre-wrap break-words text-gray-100">{{ msg.content }}</p>
          <button
            class="absolute -top-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-yellow-400 text-xs"
            :class="msg.role === 'user' ? 'right-2' : 'left-2'"
            title="Pin message"
            @click="togglePin({ id: msg._id })"
          >📌</button>
        </div>
      </div>
      <div ref="chatBottom" />
    </div>
  </div>
</template>
