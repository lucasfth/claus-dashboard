<script setup lang="ts">
const { isDark, init } = useTheme()

useHead({
  htmlAttrs: computed(() => ({ class: isDark.value ? 'dark' : '' })),
})

onMounted(init)
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
