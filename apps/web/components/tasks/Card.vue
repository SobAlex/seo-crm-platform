<script setup lang="ts">
// card() из tasks.html: карточка задачи на доске (перетаскивается между колонками).
import { TASK_PROJECTS, dueOf, personName, type BoardTask, type DueTone } from '~/types/tasks'

const props = defineProps<{
  task: BoardTask
  me: string
  /** Доска по этапам направления: вместо направления показываем статус. */
  local?: boolean
  dragging?: boolean
}>()
const emit = defineEmits<{ dragstart: [e: DragEvent]; dragend: []; remove: [] }>()

const PILL: Record<DueTone, string> = {
  wait: 'bg-violet-50 text-violet-700',
  none: 'bg-zinc-100 text-zinc-500',
  done: 'bg-zinc-100 text-zinc-500',
  over: 'bg-red-50 text-red-700',
  soon: 'bg-amber-50 text-amber-700',
  ok: 'bg-zinc-100 text-zinc-600'
}

const dd = computed(() => dueOf(props.task))
const overdue = computed(() => (dd.value.sub?.startsWith('просрочена') ? ' · ' + dd.value.sub.replace('просрочена ', '−') : ''))
</script>

<template>
  <article
    draggable="true"
    :data-card="task.id"
    class="bg-white rounded-xl shadow-card p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition"
    :class="dragging && 'opacity-40'"
    @dragstart="emit('dragstart', $event)"
    @dragend="emit('dragend')"
  >
    <div class="flex items-start gap-2">
      <NuxtLink :to="`/tasks/${task.id}`" draggable="false" class="flex-1 min-w-0 text-sm font-medium leading-snug hover:underline">{{ task.title }}</NuxtLink>
      <TasksReportMark v-if="task.report" on class="shrink-0 mt-0.5" />
      <button type="button" class="shrink-0 text-[11px] text-zinc-400 hover:text-red-600" @click.stop="emit('remove')">Удалить</button>
    </div>
    <div class="text-xs text-zinc-500 mt-1">{{ task.projectLabel || TASK_PROJECTS[task.project] || 'Проект' }}</div>
    <div class="flex flex-wrap gap-1 mt-2">
      <TasksStatusChip v-if="local" :status="task.status" />
      <TasksDirBadge v-else :task="task" />
      <TasksTags :task="task" :me="me" />
    </div>
    <div class="flex items-center justify-between mt-3">
      <TasksAvatars :task="task" size="sm" />
      <span class="px-1.5 py-0.5 rounded-md text-[11px] font-medium tabular-nums" :class="PILL[dd.tone]" :title="dd.sub || 'Дедлайн'">{{ dd.text }}{{ overdue }}</span>
    </div>
    <div v-if="task.status === 'review'" class="mt-2.5 pt-2.5 border-t border-zinc-100 text-[11px] text-zinc-500">Принимает{{ task.acceptor ? ': ' + personName(task.acceptor) : ' постановщик' }}</div>
  </article>
</template>
