<script setup lang="ts">
onMounted(() => {
  if (!import.meta.client) return

  const query = window.location.search
  const url = `/api/auth/callback${query}${query ? '&' : '?'}redirectTo=${encodeURIComponent('/tasks')}`
  window.location.replace(url)
})
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a] text-gray-600 dark:text-gray-300 text-sm">
    Finishing sign-in...
  </div>
</template>
