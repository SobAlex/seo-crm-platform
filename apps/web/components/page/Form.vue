<script setup lang="ts">
// Сетка 3 — Focused Form: центрированный контейнер max-w-4xl.
defineProps<{
  title?: string
  back?: { to: string; label: string }
  crumbs?: { label: string; to?: string }[]
}>()
</script>

<template>
  <div class="space-y-6">
    <PageHeader :title="title" :back="back" :crumbs="crumbs">
      <template v-if="$slots.title" #title><slot name="title" /></template>
      <template v-if="$slots.actions" #actions><slot name="actions" /></template>
    </PageHeader>

    <div class="max-w-4xl mx-auto w-full space-y-6">
      <slot />
    </div>
  </div>
</template>
