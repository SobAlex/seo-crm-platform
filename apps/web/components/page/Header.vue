<script setup lang="ts">
// Однострочная sticky-шапка страницы: заголовок или ссылка назад слева, целевое действие справа.
defineProps<{
  title?: string
  /** Ссылка назад: { to: '/projects', label: 'Проекты' }. */
  back?: { to: string; label: string }
}>()
</script>

<template>
  <header
    data-app-header
    class="sticky top-0 z-30 h-14 min-h-[3.5rem] bg-canvas/80 backdrop-blur-xl border-b border-black/5 -mx-4 lg:-mx-8 -mt-6 px-4 lg:px-8 flex items-center justify-between gap-3"
  >
    <div class="flex items-center gap-3 min-w-0">
      <NuxtLink
        v-if="back"
        :to="back.to"
        :aria-label="`Назад: ${back.label}`"
        class="inline-flex items-center gap-1 h-8 pl-1.5 pr-2.5 -ml-1.5 rounded-full text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-black/5 transition shrink-0"
      >
        <AppIcon name="back" class="w-4 h-4" /><span class="hidden sm:inline">{{ back.label }}</span>
      </NuxtLink>
      <span v-if="back && (title || $slots.title)" class="h-4 w-px bg-black/10 shrink-0" aria-hidden="true" />
      <slot name="title">
        <h1 class="text-base font-semibold tracking-tight text-ink leading-none truncate">{{ title }}</h1>
      </slot>
    </div>
    <div v-if="$slots.actions" class="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
      <slot name="actions" />
    </div>
  </header>
</template>
