<script setup lang="ts">
// Сетка 2 — Split 2:1: контент xl:col-span-2 и сайдбар атрибутов xl:col-span-1.
defineProps<{
  title?: string
  back?: { to: string; label: string }
  asideClass?: string
}>()
</script>

<template>
  <div class="space-y-6">
    <PageHeader :title="title" :back="back">
      <template v-if="$slots.title" #title><slot name="title" /></template>
      <template v-if="$slots.actions" #actions><slot name="actions" /></template>
    </PageHeader>

    <slot name="top" />

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
      <div class="xl:col-span-2 space-y-6 min-w-0">
        <slot />
      </div>
      <aside v-if="$slots.aside" class="xl:col-span-1 space-y-6 min-w-0" :class="asideClass">
        <slot name="aside" />
      </aside>
    </div>

    <slot name="bottom" />
  </div>
</template>
