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
  <div class="min-h-screen bg-[#0a0a0a] text-white">
    <nav v-if="loggedIn" class="border-b border-gray-800 sticky top-0 z-10 bg-[#0a0a0a]">
      <div class="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-6">
          <span class="font-semibold text-sm tracking-wide">&#x26A1; claus</span>
          <NuxtLink
            v-for="link in nav"
            :key="link.href"
            :to="link.href"
            class="text-sm transition-colors"
            :class="route.path.startsWith(link.href) ? 'text-white' : 'text-gray-500 hover:text-gray-300'"
          >
            {{ link.label }}
          </NuxtLink>
        </div>
        <button
          class="text-xs text-gray-600 hover:text-gray-400 transition-colors"
          @click="signOut"
        >
          sign out
        </button>
      </div>
    </nav>
    <main class="max-w-4xl mx-auto px-4 py-8">
      <slot />
    </main>
  </div>
</template>
