<script setup lang="ts">
import { ICON_PATHS, type AppIconName } from '~/constants/icons'

defineProps<{ name: AppIconName }>()
</script>

<template>
  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" :d="ICON_PATHS[name]" /></svg>
</template>
