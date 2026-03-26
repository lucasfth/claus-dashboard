<script setup lang="ts">
const route = useRoute()
const { loggedIn, clear } = useUserSession()

const nav = [
  { href: '/feed', label: 'Chat', icon: '💬' },
  { href: '/tasks', label: 'Tasks', icon: '✓' },
  { href: '/polybot', label: 'Polybot', icon: '📈' },
  { href: '/bridget', label: 'Bridget', icon: '⚙️' },
  { href: '/commands', label: 'Commands', icon: '/' },
]

async function signOut() {
  await clear()
  navigateTo('/login')
}
</script>

<template>
  <div class="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">
    <!-- Top bar (desktop) -->
    <nav v-if="loggedIn" class="hidden sm:flex border-b border-gray-800 sticky top-0 z-20 bg-[#0a0a0a]">
      <div class="w-full max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div class="flex items-center gap-5">
          <span class="font-semibold text-sm tracking-wide shrink-0">&#x26A1; Claus</span>
          <div class="flex items-center gap-4">
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
        </div>
        <button class="text-xs text-gray-600 hover:text-gray-400 transition-colors" @click="signOut">sign out</button>
      </div>
    </nav>

    <!-- Mobile top bar -->
    <div v-if="loggedIn" class="sm:hidden sticky top-0 z-20 bg-[#0a0a0a] border-b border-gray-800 px-4 h-12 flex items-center justify-between">
      <span class="font-semibold text-sm tracking-wide">&#x26A1; Claus</span>
      <button class="text-xs text-gray-600 hover:text-gray-400" @click="signOut">sign out</button>
    </div>

    <!-- Main content -->
    <main class="w-full max-w-4xl mx-auto px-4 py-6 pb-24 sm:pb-8">
      <slot />
    </main>

    <!-- Bottom nav (mobile) -->
    <nav v-if="loggedIn" class="sm:hidden fixed bottom-0 left-0 right-0 z-20 bg-[#0d0d0d] border-t border-gray-800">
      <div class="flex">
        <NuxtLink
          v-for="link in nav"
          :key="link.href"
          :to="link.href"
          class="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors"
          :class="route.path.startsWith(link.href) ? 'text-white' : 'text-gray-600'"
        >
          <span class="text-lg leading-none">{{ link.icon }}</span>
          <span class="text-[10px] font-medium tracking-wide">{{ link.label }}</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>
