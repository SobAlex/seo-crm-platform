<script setup lang="ts">
// statusChip() из tasks.html.
import { STATUS_NAME, type TaskStatus } from '~/types/tasks'

defineProps<{ status: TaskStatus; extra?: string }>()

const CLS: Record<TaskStatus, { dot: string; chip: string }> = {
  planned: { dot: 'bg-zinc-400', chip: 'bg-zinc-100 text-zinc-700' },
  progress: { dot: 'bg-blue-600', chip: 'bg-blue-50 text-blue-700' },
  review: { dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700' },
  waiting: { dot: 'bg-violet-500', chip: 'bg-violet-50 text-violet-700' },
  done: { dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700' }
}
</script>

<template>
  <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" :class="CLS[status].chip"><span class="w-1.5 h-1.5 rounded-full" :class="CLS[status].dot" />{{ STATUS_NAME[status] }}</span><span v-if="extra" class="ml-1.5 text-xs text-zinc-500 tabular-nums whitespace-nowrap">{{ extra }}</span>
</template>
