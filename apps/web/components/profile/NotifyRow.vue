<script setup lang="ts">
// Строка «Уведомления»: событие и два канала (Email, Telegram) переключателями.
defineProps<{ label: string }>()
const email = defineModel<boolean>('email', { required: true })
const telegram = defineModel<boolean>('telegram', { required: true })
</script>

<template>
  <li class="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
    <div class="min-w-0 flex-1 text-sm text-ink">{{ label }}</div>
    <div class="flex items-center gap-4 text-sm text-zinc-600">
      <label class="relative inline-flex items-center gap-2 cursor-pointer select-none"><UToggle v-model="email" :aria-label="`${label}: Email`" /><span class="text-xs text-zinc-600">Email</span></label>
      <label class="relative inline-flex items-center gap-2 cursor-pointer select-none"><UToggle v-model="telegram" :aria-label="`${label}: Telegram`" /><span class="text-xs text-zinc-600">Telegram</span></label>
    </div>
  </li>
</template>
