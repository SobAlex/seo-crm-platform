<script setup lang="ts">
// row() из tasks.html: строка задачи в списке.
import { TASK_PROJECTS, dueOf, personName, type BoardTask, type DueTone } from '~/types/tasks'

const props = defineProps<{ task: BoardTask; me: string; selected: boolean }>()
const emit = defineEmits<{ toggle: [on: boolean] }>()

const TONE: Record<DueTone, string> = {
  wait: 'text-violet-700',
  none: 'text-zinc-400',
  done: 'text-zinc-400',
  over: 'text-red-600',
  soon: 'text-amber-700',
  ok: 'text-zinc-600'
}

const dd = computed(() => dueOf(props.task))
const extra = computed(() => (props.task.status === 'review' && props.task.reviewDays ? props.task.reviewDays + ' дн.' : ''))
const TD = 'px-4 py-3.5 text-xs text-ink align-middle'
</script>

<template>
  <tr :data-row="task.id" class="border-b border-black/[0.04] hover:bg-black/[0.015] transition-colors duration-100" :class="selected && 'bg-accent/5'">
    <td :class="TD">
      <label class="inline-flex items-center gap-2 cursor-pointer text-xs text-zinc-500 tabular-nums"><input type="checkbox" :checked="selected" class="w-4 h-4 rounded border-zinc-300 accent-[#0071e3]" :aria-label="`Выбрать задачу ${task.id}`" @change="emit('toggle', ($event.target as HTMLInputElement).checked)">#{{ task.id }}</label>
    </td>
    <td :class="TD">
      <div class="flex flex-wrap items-center gap-x-2 gap-y-1"><NuxtLink :to="`/tasks/${task.id}`" class="font-medium hover:underline">{{ task.title }}</NuxtLink><TasksTags :task="task" :me="me" /></div>
    </td>
    <td :class="[TD, 'whitespace-nowrap']"><NuxtLink :to="`/tasks?project=${task.project}`" class="hover:underline">{{ task.projectLabel || TASK_PROJECTS[task.project] || 'Проект' }}</NuxtLink></td>
    <td :class="TD"><TasksDirBadge :task="task" /></td>
    <td :class="[TD, 'whitespace-nowrap']"><TasksStatusChip :status="task.status" :extra="extra" /></td>
    <td :class="TD">
      <span class="flex items-center gap-2"><TasksAvatars :task="task" /><span class="whitespace-nowrap">{{ personName(task.assignee) }}</span><span v-if="task.co.length" class="text-xs text-zinc-500 tabular-nums">+{{ task.co.length }}</span></span>
    </td>
    <td :class="[TD, 'whitespace-nowrap tabular-nums']">
      <div class="font-medium" :class="TONE[dd.tone]">{{ dd.text }}</div>
      <div v-if="dd.sub" class="text-[11px]" :class="TONE[dd.tone]">{{ dd.sub }}</div>
    </td>
    <td :class="[TD, 'text-center']"><TasksReportMark :on="task.report" /></td>
  </tr>
</template>
