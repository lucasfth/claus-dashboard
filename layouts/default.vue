<script setup lang="ts">
const route = useRoute()
const { loggedIn, clear } = useUserSession()

const nav = [
  { href: '/feed', label: 'Feed' },
  { href: '/context', label: 'Context' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/commands', label: 'Commands' },
  { href: '/tasks', label: 'Tasks' },
]

async function signOut() {
  await clear()
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
    <nav v-if="loggedIn" class="border-b border-gray-800 sticky top-0 z-10 bg-[#0a0a0a]">
      <div class="w-full max-w-4xl mx-auto px-4 py-2 sm:h-14 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div class="flex items-center gap-4 min-w-0">
          <span class="font-semibold text-sm tracking-wide shrink-0">&#x26A1; claus</span>
          <div class="flex items-center gap-4 min-w-0 overflow-x-auto">
            <NuxtLink
              v-for="link in nav"
              :key="link.href"
              :to="link.href"
              class="text-sm transition-colors whitespace-nowrap shrink-0"
              :class="route.path.startsWith(link.href) ? 'text-white' : 'text-gray-500 hover:text-gray-300'"
            >
              {{ link.label }}
            </NuxtLink>
          </div>
        </div>
        <button
          class="text-xs text-gray-600 hover:text-gray-400 transition-colors self-end sm:self-auto shrink-0"
          @click="signOut"
        >
          sign out
        </button>
      </div>
    </nav>
    <main class="w-full max-w-4xl mx-auto px-4 py-8">
      <slot></slot>
    </main>
  </div>
</template>
