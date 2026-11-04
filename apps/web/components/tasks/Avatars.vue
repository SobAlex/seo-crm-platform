<script setup lang="ts">
// avatars() из tasks.html: исполнитель (тёмный) и соисполнители.
import { personInitials, personName, type BoardTask } from '~/types/tasks'

const props = defineProps<{ task: BoardTask; size?: 'sm' }>()
const sz = computed(() => (props.size === 'sm' ? 'w-6 h-6 text-[9px]' : 'w-7 h-7 text-[10px]'))
const name = computed(() => props.task.assigneeName || personName(props.task.assignee))
const initials = computed(() => {
  if (!props.task.assigneeName) return personInitials(props.task.assignee)
  const parts = props.task.assigneeName.split(/\s+/).filter(Boolean)
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || '—'
})
</script>

<template>
  <span class="flex -space-x-1.5">
    <span v-if="task.assignee || task.assigneeName" class="rounded-full bg-zinc-900 text-white font-semibold flex items-center justify-center shrink-0 ring-2 ring-white" :class="sz" :title="'Исполнитель: ' + name">{{ initials }}</span>
    <span v-for="id in task.co" :key="id" class="rounded-full bg-zinc-200 text-zinc-700 font-semibold flex items-center justify-center shrink-0 ring-2 ring-white" :class="sz" :title="'Соисполнитель: ' + personName(id)">{{ personInitials(id) }}</span>
  </span>
</template>
