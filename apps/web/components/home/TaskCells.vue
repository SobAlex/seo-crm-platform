<script setup lang="ts">
// Общие ячейки строки ленты (cells() в index.html + колонка «Постановщик» из initHomeTables).
import type { HomeTask } from '~/types/home'

defineProps<{
  task: HomeTask
  /** [короткое имя, инициалы] исполнителя и соисполнителя. */
  assignee: [string, string]
  co?: [string, string] | null
  projectName?: string
  setter: string
  /** Текущий пользователь — соисполнитель (data-co-tag). */
  coMe: boolean
}>()

const TD = 'md:px-3 md:py-3 lg:py-4 text-sm min-w-0 before:block before:text-[11px] before:text-zinc-500 before:mb-0.5 before:content-[attr(data-label)] md:before:hidden'
</script>

<template>
  <td class="md:px-4 lg:px-6 md:py-3 lg:py-4 col-span-2 md:col-span-1">
    <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
      <NuxtLink :to="task.href || `/tasks/${task.id ?? 1}`" class="text-base md:text-sm font-medium hover:underline">{{ task.title }}</NuxtLink>
      <span v-if="task.prio" class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700">Высокий</span>
      <span v-if="task.tag" class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600">{{ task.tag }}</span>
      <span v-if="coMe" class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700">соисполнитель</span>
    </div>
  </td>
  <td data-label="Проект" :class="TD">
    <template v-if="task.project">
      <NuxtLink :to="`/tasks?project=${task.project}`" class="text-sm hover:underline">{{ projectName }}</NuxtLink>
      <div v-if="task.dir" class="text-xs text-zinc-500 mt-0.5">{{ task.dir }}</div>
    </template>
    <span v-else class="text-zinc-500">Вся компания</span>
  </td>
  <td data-label="Постановщик" class="md:px-3 md:py-3 lg:py-4 text-sm whitespace-nowrap min-w-0 before:block before:text-[11px] before:text-zinc-500 before:mb-0.5 before:content-[attr(data-label)] md:before:hidden">{{ setter }}</td>
  <td data-label="Исполнитель" :class="TD">
    <NuxtLink :to="`/tasks?executor=${task.assignee}`" class="flex items-center gap-2 hover:underline">
      <span class="flex -space-x-2">
        <span class="w-7 h-7 rounded-full bg-zinc-900 text-white text-[10px] font-semibold flex items-center justify-center shrink-0 ring-2 ring-white">{{ assignee[1] }}</span>
        <span v-if="co" :title="`Соисполнитель: ${co[0]}`" class="w-7 h-7 rounded-full bg-zinc-200 text-zinc-700 text-[10px] font-semibold flex items-center justify-center shrink-0 ring-2 ring-white">{{ co[1] }}</span>
      </span>
      <span class="text-sm whitespace-nowrap">{{ assignee[0] }}</span>
      <span v-if="co" class="text-xs text-zinc-500 tabular-nums">+1</span>
    </NuxtLink>
  </td>
</template>
