<script setup lang="ts">
// Сообщение ленты задачи (message() в task.html): системное событие или комментарий
// с отметками «В отчёте клиенту», «Замечание к приёмке» и списанным временем.
import { fmtH, type TaskComment } from '~/types/task'

const props = defineProps<{ c: TaskComment; canReport: boolean }>()
const emit = defineEmits<{ flip: [id: string] }>()

const galleryOpen = ref(false)
const images = computed(() => (props.c.files ?? []).filter(f => f.url))
</script>

<template>
  <li
    v-if="c.system"
    class="px-4 lg:px-5 py-3 flex items-center justify-center gap-2 text-xs"
    :class="c.tone === 'amber' ? 'text-amber-700' : c.tone === 'green' ? 'text-emerald-700' : 'text-zinc-500'"
  >
    <span class="w-1.5 h-1.5 rounded-full" :class="c.tone === 'amber' ? 'bg-amber-500' : c.tone === 'green' ? 'bg-emerald-500' : 'bg-zinc-300'" />
    <span v-html="c.text" />
  </li>
  <li
    v-else
    :data-msg="c.id"
    class="relative p-4 lg:p-5 transition-colors"
    :class="c.report ? 'border-l-2 border-emerald-500 bg-emerald-50/40' : c.remark ? 'border-l-2 border-amber-400 bg-amber-50/30' : 'border-l-2 border-transparent'"
  >
    <span v-if="c.report" class="absolute top-3 right-3 sm:top-4 sm:right-4 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">В отчёте клиенту</span>
    <div class="flex gap-3">
      <span class="w-8 h-8 shrink-0 rounded-full text-[10px] font-semibold flex items-center justify-center" :class="c.dark ? 'bg-zinc-900 text-white' : 'bg-zinc-200 text-zinc-700'">{{ c.initials }}</span>
      <div class="flex-1 min-w-0" :class="c.report && 'pr-28'">
        <div class="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
          <span class="text-sm font-medium">{{ c.author }}</span>
          <span v-if="c.role" class="text-xs text-zinc-500">{{ c.role }}</span>
          <span v-if="c.remark" class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-200">Замечание к приёмке</span>
          <span v-if="c.hours" class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-700 tabular-nums" title="Списано времени">{{ fmtH(c.hours) }}</span>
          <span class="ml-auto flex items-center gap-2">
            <button v-if="canReport" type="button" class="text-[11px] text-zinc-400 hover:text-zinc-900 transition" @click="emit('flip', c.id)">{{ c.report ? 'Убрать из отчёта' : 'В отчёт' }}</button>
            <span class="text-xs text-zinc-500 tabular-nums">{{ c.time }}</span>
          </span>
        </div>
        <div :class="RICH" v-html="c.html" />
        <div v-if="c.files?.length" class="mt-2.5 flex flex-wrap gap-2">
          <TaskFileChip v-for="f in c.files" :key="f.id || f.name" :file="f" @preview="galleryOpen = !galleryOpen" />
        </div>
        <div v-if="images.length" v-show="galleryOpen" class="mt-2.5 flex flex-wrap gap-2">
          <img v-for="f in images" :key="f.id || f.name" :src="f.url" :alt="f.name" class="max-h-64 max-w-full rounded-xl ring-1 ring-black/5">
        </div>
      </div>
    </div>
  </li>
</template>
