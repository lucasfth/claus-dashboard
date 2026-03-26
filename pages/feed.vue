<script setup lang="ts">
import { api } from '~/convex/_generated/api'

definePageMeta({ middleware: 'auth' })

const messages = useConvexQuery(api.chatMessages.list, {})
const commands = useConvexQuery(api.commands.list, {})
const togglePin = useConvexMutation(api.chatMessages.togglePin)
const sendMessage = useConvexMutation(api.messages.send)

const pinned = computed(() => (messages.value ?? []).filter(m => m.pinned))
const thread = computed(() => (messages.value ?? []).filter(m => !m.pinned))

const input = ref('')
const sending = ref(false)
const autocompleteIndex = ref(0)
const inputRef = ref<HTMLTextAreaElement | null>(null)

// Command autocomplete
const showAutocomplete = computed(() => input.value.startsWith('/') && !input.value.includes(' '))
const query = computed(() => input.value.slice(1).toLowerCase())
const filteredCommands = computed(() => {
  if (!showAutocomplete.value || !commands.value) return []
  return commands.value
    .filter(c => c.name.toLowerCase().includes(query.value))
    .slice(0, 6)
})

watch(filteredCommands, () => { autocompleteIndex.value = 0 })

function selectCommand(name: string) {
  input.value = '/' + name + ' '
  inputRef.value?.focus()
  autocompleteIndex.value = 0
}

async function submit() {
  const content = input.value.trim()
  if (!content || sending.value) return
  sending.value = true
  try {
    await sendMessage({ content })
    input.value = ''
  } finally {
    sending.value = false
  }
}

function onKeydown(e: KeyboardEvent) {
  if (showAutocomplete.value && filteredCommands.value.length > 0) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      autocompleteIndex.value = (autocompleteIndex.value + 1) % filteredCommands.value.length
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      autocompleteIndex.value = (autocompleteIndex.value - 1 + filteredCommands.value.length) % filteredCommands.value.length
      return
    }
    if (e.key === 'Tab' || (e.key === 'Enter' && filteredCommands.value.length > 0)) {
      e.preventDefault()
      selectCommand(filteredCommands.value[autocompleteIndex.value].name)
      return
    }
    if (e.key === 'Escape') {
      input.value = ''
      return
    }
  }
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    submit()
  }
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  const diff = Date.now() - ts
  if (diff < 86_400_000) return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- Input with autocomplete -->
    <div class="relative">
      <!-- Autocomplete dropdown -->
      <div
        v-if="showAutocomplete && filteredCommands.length > 0"
        class="absolute bottom-full mb-1 left-0 right-0 z-10 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden shadow-xl"
      >
        <button
          v-for="(cmd, i) in filteredCommands"
          :key="cmd.name"
          class="w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors"
          :class="i === autocompleteIndex ? 'bg-gray-800' : 'hover:bg-gray-800/60'"
          @mousedown.prevent="selectCommand(cmd.name)"
        >
          <span class="text-sm text-blue-400 font-mono shrink-0">/{{ cmd.name }}</span>
          <span class="text-xs text-gray-500 leading-snug mt-0.5 truncate">{{ cmd.description }}</span>
        </button>
      </div>

      <!-- Textarea + send -->
      <div class="flex gap-2">
        <textarea
          ref="inputRef"
          v-model="input"
          rows="2"
          placeholder="Message Claus… (/ for commands)"
          class="flex-1 resize-none bg-gray-900/60 border border-gray-700/50 rounded-xl px-4 py-3 text-base text-gray-100 placeholder-gray-600 focus:outline-none focus:border-blue-700/60 leading-snug"
          :disabled="sending"
          @keydown="onKeydown"
        />
        <button
          class="px-5 py-3 rounded-xl bg-blue-800/60 hover:bg-blue-700/60 active:bg-blue-600/60 text-base text-blue-200 border border-blue-700/40 transition-colors disabled:opacity-40 self-end font-medium"
          :disabled="!input.trim() || sending"
          @click="submit"
        >Send</button>
      </div>
    </div>

    <!-- Pinned messages -->
    <div v-if="pinned.length > 0" class="space-y-2">
      <p class="text-xs text-gray-500 font-mono uppercase tracking-wider">Pinned</p>
      <div
        v-for="msg in pinned"
        :key="msg._id"
        class="flex gap-3 items-start px-4 py-3 rounded-xl border border-yellow-800/40 bg-yellow-900/10"
      >
        <span class="text-yellow-500 shrink-0 mt-0.5">📌</span>
        <div class="flex-1 min-w-0">
          <p class="text-xs text-gray-500 mb-1 font-mono">
            {{ msg.role === 'user' ? 'You' : 'Claus' }} · {{ formatTime(msg.timestamp) }}
          </p>
          <MarkdownContent :content="msg.content" />
        </div>
        <button
          class="text-gray-600 hover:text-yellow-400 text-xs shrink-0 px-2 py-1"
          @click="togglePin({ id: msg._id })"
        >unpin</button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="messages === undefined" class="space-y-3">
      <div v-for="i in 6" :key="i" class="h-14 rounded-2xl bg-gray-900/50 animate-pulse" />
    </div>

    <p v-else-if="thread.length === 0 && pinned.length === 0" class="text-gray-600 text-sm py-8 text-center">
      No messages yet.
    </p>

    <!-- Chat thread -->
    <div v-else class="flex flex-col gap-1.5">
      <div
        v-for="msg in thread"
        :key="msg._id"
        class="flex"
        :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div
          class="relative max-w-[88%] sm:max-w-[78%] px-4 py-3 rounded-2xl text-[15px] text-gray-100"
          :class="msg.role === 'user'
            ? 'bg-blue-900/50 border border-blue-800/40 rounded-br-md'
            : 'bg-gray-900/60 border border-gray-700/40 rounded-bl-md'"
        >
          <p class="text-[11px] font-mono mb-1.5"
            :class="msg.role === 'user' ? 'text-blue-400/70 text-right' : 'text-gray-500'"
          >
            {{ msg.role === 'user' ? 'You' : 'Claus' }} · {{ formatTime(msg.timestamp) }}
          </p>
          <MarkdownContent :content="msg.content" />
          <!-- Pin button: always visible on mobile, hover on desktop -->
          <button
            class="mt-2 text-gray-600 hover:text-yellow-400 active:text-yellow-400 text-xs block sm:hidden"
            @click="togglePin({ id: msg._id })"
          >{{ msg.pinned ? 'unpin' : '📌' }}</button>
          <button
            class="absolute -top-2 opacity-0 hover:opacity-100 transition-opacity text-gray-600 hover:text-yellow-400 text-xs hidden sm:block"
            :class="msg.role === 'user' ? 'right-2' : 'left-2'"
            @click="togglePin({ id: msg._id })"
          >📌</button>
        </div>
      </div>
    </div>
  </div>
</template>
