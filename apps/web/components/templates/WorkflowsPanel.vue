<script setup lang="ts">
// Вкладка «Бизнес-процессы»: этапы направлений слева направо, цвет — как у направления на доске задач.
import { TIP_MANAGE, WORKFLOW_ORDER, count } from '~/types/templates'

/** Цвет направления как на доске задач: точка, крайние этапы (bg/ring), подпись крайнего этапа. */
const WORKFLOW_COLOR: Record<string, { dot: string; edge: string; text: string }> = {
  'Аудит': { dot: 'bg-sky-500', edge: 'bg-sky-50 ring-sky-100', text: 'text-sky-700' },
  'Семантика': { dot: 'bg-indigo-500', edge: 'bg-indigo-50 ring-indigo-100', text: 'text-indigo-700' },
  'Внутренняя оптимизация': { dot: 'bg-teal-500', edge: 'bg-teal-50 ring-teal-100', text: 'text-teal-700' },
  'Внешняя оптимизация': { dot: 'bg-orange-500', edge: 'bg-orange-50 ring-orange-100', text: 'text-orange-700' },
  'Контент': { dot: 'bg-pink-500', edge: 'bg-pink-50 ring-pink-100', text: 'text-pink-700' },
  'Программирование': { dot: 'bg-slate-500', edge: 'bg-slate-50 ring-slate-100', text: 'text-slate-700' }
}
const WORKFLOW_ZINC = { dot: 'bg-zinc-500', edge: 'bg-zinc-50 ring-zinc-100', text: 'text-zinc-700' }

const props = defineProps<{
  workflows: Record<string, string[]>
  /** Только что сохранённый процесс подсвечивается. */
  flash?: string
}>()
const emit = defineEmits<{ configure: [name: string] }>()

const { can } = useRole()

const names = computed(() => {
  const keys = Object.keys(props.workflows)
  return [...WORKFLOW_ORDER.filter(n => keys.includes(n)), ...keys.filter(n => !WORKFLOW_ORDER.includes(n))]
})
const color = (name: string) => WORKFLOW_COLOR[name] ?? WORKFLOW_ZINC
const edge = (i: number, n: number) => (i === 0 ? '↔ В работе' : i === n - 1 ? '↔ Принята' : '')
</script>

<template>
  <div>
    <div class="mb-4 rounded-2xl bg-white shadow-card px-4 lg:px-5 py-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-zinc-500">
      <span class="font-medium text-zinc-900">Глобальный цикл задачи</span>
      <span class="inline-flex items-center gap-1.5 flex-wrap">Запланирована <span aria-hidden="true">→</span> <b class="font-medium text-zinc-700">В работе</b> <span aria-hidden="true">→</span> На проверке <span aria-hidden="true">→</span> <b class="font-medium text-zinc-700">Принята</b></span>
      <span class="w-full sm:w-auto sm:ml-auto">Первый этап направления = «В работе», последний = «Принята»</span>
    </div>
    <div class="flex flex-col gap-3">
      <section
        v-for="name in names"
        :key="name"
        class="bg-white rounded-2xl shadow-card p-4 lg:p-5"
        :class="name === flash && 'ring-2 ring-accent/20'"
      >
        <div class="flex items-center justify-between gap-3 mb-3">
          <div class="flex items-center gap-2 min-w-0">
            <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="color(name).dot" />
            <h3 class="text-sm font-semibold tracking-tight truncate">{{ name }}</h3>
            <span class="text-xs text-zinc-500 tabular-nums shrink-0">{{ count(workflows[name]!.length, ['этап', 'этапа', 'этапов']) }}</span>
          </div>
          <TemplatesAct :allowed="can('workflows.manage')" :tip="TIP_MANAGE" class="shrink-0 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200 text-sm font-medium hover:bg-zinc-50 transition" @click="emit('configure', name)">Настроить</TemplatesAct>
        </div>
        <ol class="grid grid-cols-2 sm:flex sm:items-stretch gap-2" :aria-label="`Этапы: ${name}`">
          <li v-for="(st, i) in workflows[name]" :key="i" class="flex items-center gap-2 sm:flex-1 min-w-0">
            <div class="flex-1 min-w-0 rounded-xl px-3 py-2 ring-1" :class="edge(i, workflows[name]!.length) ? color(name).edge : 'bg-zinc-50 ring-zinc-100'">
              <div class="flex items-center justify-between gap-2 text-[10px] font-semibold tabular-nums" :class="edge(i, workflows[name]!.length) ? color(name).text : 'text-zinc-400'">
                <span>{{ i + 1 }}</span>
                <span v-if="edge(i, workflows[name]!.length)" class="font-medium truncate">{{ edge(i, workflows[name]!.length) }}</span>
              </div>
              <div class="text-sm font-medium text-zinc-800 truncate">{{ st }}</div>
            </div>
            <svg v-if="i < workflows[name]!.length - 1" class="hidden sm:block w-3.5 h-3.5 shrink-0 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 5l7 7-7 7" /></svg>
          </li>
        </ol>
      </section>
    </div>
  </div>
</template>
