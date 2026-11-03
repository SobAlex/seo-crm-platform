<script setup lang="ts">
// tags() из tasks.html: приоритет, доработка, «соисполнитель» для текущего пользователя.
import type { BoardTask } from '~/types/tasks'

defineProps<{ task: BoardTask; me: string }>()

const TAG = 'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap'
</script>

<template>
  <span v-if="task.prio === 'high'" :class="[TAG, 'bg-red-50 text-red-700']">Высокий</span>
  <span v-if="task.returned" :class="[TAG, 'bg-orange-50 text-orange-700']">На доработке</span>
  <span v-if="task.co.includes(me)" :class="[TAG, 'bg-blue-50 text-blue-700']">соисполнитель</span>
</template>
