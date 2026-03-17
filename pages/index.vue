<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

onMounted(() => {
  navigateTo('/feed')
})
</script>
<template><div /></template>
