<script setup lang="ts">
// Учёт времени задачи (paintTime() в task.html): часы из комментариев по людям, остаток от оценки,
// предпросмотр с учётом часов, набранных в поле «Время» под редактором.
import { fmtH, type TaskComment } from '~/types/task'

const props = withDefaults(defineProps<{ messages: TaskComment[]; estimate: number; draftHours?: number }>(), { draftHours: 0 })

const { can } = useRole()
const inLimit = ref(true)

const people = computed(() => {
  const map: Record<string, number> = {}
  props.messages.forEach(c => { if (c.hours && c.author) map[c.author] = (map[c.author] || 0) + c.hours })
  return Object.keys(map).sort((a, b) => map[b]! - map[a]!).map(name => ({ name, hours: map[name]! }))
})
const spent = computed(() => people.value.reduce((a, p) => a + p.hours, 0) + (props.draftHours > 0 ? props.draftHours : 0))
const pct = computed(() => spent.value / props.estimate * 100)
const over = computed(() => spent.value > props.estimate)
const warn = computed(() => !over.value && pct.value >= 80)
</script>

<template>
  <section class="bg-white rounded-2xl shadow-card p-4 lg:p-6">
    <div class="flex items-center justify-between gap-3 mb-3">
      <h3 class="text-sm font-semibold tracking-tight">Учёт времени</h3>
      <span
        class="text-[11px] font-medium px-2 py-0.5 rounded-full tabular-nums"
        :class="over ? 'bg-red-50 text-red-700' : warn ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'"
      >{{ over ? 'Перерасход' : warn ? 'Почти исчерпано' : Math.round(pct) + '%' }}</span>
    </div>
    <div class="text-sm text-zinc-600">
      Затрачено: <span class="font-semibold text-zinc-900 tabular-nums">{{ fmtH(spent) }}</span> из <span class="tabular-nums">{{ fmtH(estimate) }}</span>
      <span class="tabular-nums" :class="over ? 'text-red-600 font-medium' : 'text-zinc-500'">{{ over ? `(Перерасход: ${fmtH(spent - estimate)})` : `(Остаток: ${fmtH(estimate - spent)})` }}</span>
    </div>
    <div class="mt-3 h-2 rounded-full bg-zinc-100 overflow-hidden" role="progressbar" aria-label="Затрачено от оценки" aria-valuemin="0" aria-valuemax="100" :aria-valuenow="Math.round(pct)">
      <div
        class="h-full rounded-full transition-all duration-500"
        :class="over ? 'bg-red-500' : warn ? 'bg-amber-500' : 'bg-emerald-500'"
        :style="{ width: Math.min(100, pct) + '%' }"
      />
    </div>
    <ul class="mt-4 space-y-2 text-xs">
      <li v-for="p in people" :key="p.name" class="flex items-center gap-2">
        <span class="text-zinc-600 truncate">{{ p.name }}</span>
        <span class="flex-1 border-b border-dotted border-zinc-200" />
        <span class="tabular-nums text-zinc-900 font-medium">{{ fmtH(p.hours) }}</span>
      </li>
    </ul>
    <label class="mt-4 pt-4 border-t border-zinc-100 flex items-center gap-2 text-xs text-zinc-600" :class="can('time.approve') ? 'cursor-pointer' : 'cursor-not-allowed'">
      <AccessGate :allowed="can('time.approve')" tip="Лимит часов задаёт сотрудник компании">
        <input
          v-model="inLimit"
          type="checkbox"
          :disabled="!can('time.approve')"
          data-deny-tip="Лимит часов задаёт сотрудник компании"
          class="w-4 h-4 rounded border-zinc-300 disabled:opacity-50"
        >
      </AccessGate>
      Входит в лимит часов проекта
    </label>
    <p class="mt-2 text-[11px] text-zinc-400">Время списывается в комментарии — поле «Время» под редактором.</p>
  </section>
</template>
