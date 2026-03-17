<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

onMounted(() => {
  navigateTo('/feed')
})
</script>
<template class="bg-black"><div /></template>
