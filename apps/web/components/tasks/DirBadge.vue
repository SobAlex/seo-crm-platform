<script setup lang="ts">
// dirBadge() из tasks.html: направление и локальный этап задачи.
import { DIRS, type BoardTask, type DirId } from '~/types/tasks'

const props = defineProps<{ task: BoardTask }>()

const CLS: Record<DirId, { badge: string; dot: string }> = {
  audit: { badge: 'bg-sky-50 text-sky-700 ring-sky-200/60', dot: 'bg-sky-500' },
  semantic: { badge: 'bg-indigo-50 text-indigo-700 ring-indigo-200/60', dot: 'bg-indigo-500' },
  onpage: { badge: 'bg-teal-50 text-teal-700 ring-teal-200/60', dot: 'bg-teal-500' },
  offpage: { badge: 'bg-orange-50 text-orange-700 ring-orange-200/60', dot: 'bg-orange-500' },
  content: { badge: 'bg-pink-50 text-pink-700 ring-pink-200/60', dot: 'bg-pink-500' },
  dev: { badge: 'bg-slate-50 text-slate-700 ring-slate-200/60', dot: 'bg-slate-500' }
}

const dir = computed(() => (props.task.dir ? DIRS[props.task.dir] : null))
const stage = computed(() => (dir.value && props.task.stage != null ? dir.value.steps[props.task.stage] : 'не начата'))
</script>

<template>
  <span v-if="!dir || !task.dir" class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-500 whitespace-nowrap">Без направления</span>
  <span v-else class="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[11px] font-medium ring-1 ring-inset whitespace-nowrap" :class="CLS[task.dir].badge">
    <span class="w-1.5 h-1.5 rounded-full" :class="CLS[task.dir].dot" />{{ dir.short }} · {{ stage }}
  </span>
</template>
