<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

onMounted(() => {
  navigateTo('/tasks')
})
</script>
<template class="bg-black"><div /></template>
