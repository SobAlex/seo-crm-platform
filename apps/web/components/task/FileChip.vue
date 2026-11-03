<script setup lang="ts">
// Вложение в ленте и в черновике комментария (chip() в task.html).
import { fmtSize, type TaskFile } from '~/types/task'

defineProps<{ file: TaskFile; removable?: boolean }>()
const emit = defineEmits<{ preview: []; remove: [] }>()
</script>

<template>
  <span class="inline-flex items-center gap-2 max-w-full pl-1.5 py-1 rounded-lg bg-zinc-50 border border-zinc-200 text-xs" :class="removable ? 'pr-1' : 'pr-2.5'">
    <button v-if="file.url" type="button" class="inline-flex items-center gap-2 min-w-0" title="Показать" @click="emit('preview')">
      <img :src="file.url" alt="" class="w-6 h-6 rounded object-cover ring-1 ring-black/5 shrink-0">
      <span class="font-medium truncate max-w-[180px]">{{ file.name }}</span><span class="text-zinc-500 tabular-nums">{{ fmtSize(file.size) }}</span>
    </button>
    <template v-else>
      <svg class="w-3.5 h-3.5 text-zinc-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
      <span class="inline-flex items-center gap-2 min-w-0">
        <span class="font-medium truncate max-w-[180px]">{{ file.name }}</span><span class="text-zinc-500 tabular-nums">{{ fmtSize(file.size) }}</span>
      </span>
    </template>
    <button v-if="removable" type="button" aria-label="Убрать вложение" class="w-5 h-5 rounded-full text-zinc-400 hover:text-zinc-800 hover:bg-black/5 flex items-center justify-center" @click="emit('remove')">×</button>
  </span>
</template>
