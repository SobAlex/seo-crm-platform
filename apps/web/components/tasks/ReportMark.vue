<script setup lang="ts">
// reportMark() из tasks.html: попадает ли задача в отчёт клиенту.
defineProps<{ on: boolean }>()
</script>

<template>
  <span
    class="inline-flex"
    :class="on ? 'text-emerald-600' : 'text-zinc-300'"
    :title="on ? 'Есть комментарий для отчёта клиенту' : 'В отчёт не попадает'"
    :aria-label="on ? 'В отчёте' : 'Не в отчёте'"
  ><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 13h6M9 17h4M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M14 3v5h5" /></svg></span>
</template>
