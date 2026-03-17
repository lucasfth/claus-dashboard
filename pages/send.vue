<script setup lang="ts">
definePageMeta({ middleware: 'auth' })
nuxtApp.runWithContext(() => navigateTo('/tasks', { replace: true }))
</script>
<template><div /></template>
