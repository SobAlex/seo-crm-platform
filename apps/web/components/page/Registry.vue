<script setup lang="ts">
// Сетка 1 — Full-Width Registry: шапка, двухстрочный тулбар (фокус и вид / фильтры и поиск), контент на всю ширину.
defineProps<{
  title?: string
  back?: { to: string; label: string }
}>()
</script>

<template>
  <div class="space-y-6">
    <PageHeader :title="title" :back="back">
      <template v-if="$slots.title" #title><slot name="title" /></template>
      <template v-if="$slots.actions" #actions><slot name="actions" /></template>
    </PageHeader>

    <div class="w-full space-y-6">
      <div
        v-if="$slots.focus || $slots.view || $slots.filters"
        data-registry-toolbar
        class="bg-white rounded-2xl shadow-card w-full max-w-full overflow-hidden p-3 lg:p-3.5 space-y-3"
      >
        <div v-if="$slots.focus || $slots.view" class="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
          <div class="flex flex-wrap items-center gap-2 min-w-0">
            <slot name="focus" />
          </div>
          <div v-if="$slots.view" class="flex flex-wrap items-center gap-2 sm:ml-auto shrink-0">
            <slot name="view" />
          </div>
        </div>
        <div
          v-if="$slots.filters"
          class="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2"
          :class="($slots.focus || $slots.view) && 'pt-3 border-t border-black/5'"
        >
          <slot name="filters" />
        </div>
      </div>

      <slot />
    </div>
  </div>
</template>
