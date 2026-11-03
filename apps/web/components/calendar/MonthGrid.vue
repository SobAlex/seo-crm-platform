<script setup lang="ts">
// Сетка месяца календаря (render() в calendar.html): слои дедлайнов, окна отчётов, отпусков и оплат.
// Полосы (отчёты, отпуска) продолжаются между соседними днями недели: края скругляются только на концах.
interface CalendarLayers { deadline: boolean; report: boolean; vacation: boolean; payment: boolean }

const props = defineProps<{
  /** 'YYYY-MM'. */
  month: string
  layers: CalendarLayers
  today: string
  deadlines: { d: string; title: string; p: string }[]
  vacations: { who: string; ini: string; from: string; to: string }[]
  payments: { day: number; client: string; sum: string; until?: string; from?: string }[]
  /** Показывать суммы оплат (finance.fee.view). */
  finance: boolean
}>()
const emit = defineEmits<{ add: [date: string] }>()

type Item =
  | { type: 'report'; start: boolean; end: boolean }
  | { type: 'spacer' }
  | { type: 'vacation'; start: boolean; end: boolean; who: string; ini: string }
  | { type: 'deadline'; title: string; p: string }
  | { type: 'payment'; label: string }

const iso = (y: number, m: number, d: number) => {
  const x = new Date(y, m, d)
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0')
}
const shift = (date: string, n: number) => iso(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8) + n)
const isReport = (date: string) => Number(date.slice(8)) <= 5
const vacationsOn = (date: string) => props.vacations.filter(v => v.from <= date && date <= v.to)
const paymentsOn = (date: string) => props.payments.filter(p => Number(date.slice(8)) === p.day && (!p.until || date.slice(0, 7) <= p.until) && (!p.from || date.slice(0, 7) >= p.from))
function weekHasReport(date: string, col: number) {
  for (let i = -col; i <= 6 - col; i++) if (isReport(shift(date, i))) return true
  return false
}

function items(date: string, col: number) {
  const out: Item[] = []
  const dots: string[] = []
  const L = props.layers
  if (L.report && isReport(date)) {
    const start = col === 0 || !isReport(shift(date, -1)) || date.slice(8) === '01'
    const end = col === 6 || !isReport(shift(date, 1))
    out.push({ type: 'report', start, end })
    dots.push('bg-violet-500')
  } else if (L.report && L.vacation && vacationsOn(date).length && weekHasReport(date, col)) {
    out.push({ type: 'spacer' })
  }
  if (L.vacation) vacationsOn(date).forEach(v => {
    out.push({ type: 'vacation', start: col === 0 || date === v.from, end: col === 6 || date === v.to, who: v.who, ini: v.ini })
    dots.push('bg-zinc-400')
  })
  if (L.deadline) props.deadlines.filter(t => t.d === date).forEach(t => {
    out.push({ type: 'deadline', title: t.title, p: t.p })
    dots.push('bg-blue-600')
  })
  if (L.payment) paymentsOn(date).forEach(p => {
    out.push({ type: 'payment', label: p.client + (props.finance ? ' · ' + p.sum : '') })
    dots.push('bg-emerald-500')
  })
  return { out, dots }
}

const MAX = 3
const cells = computed(() => {
  const [year, m] = props.month.split('-').map(Number) as [number, number]
  const month = m - 1
  const first = (new Date(year, month, 1).getDay() + 6) % 7
  const days = new Date(year, month + 1, 0).getDate()
  const total = Math.ceil((first + days) / 7) * 7
  return Array.from({ length: total }, (_, i) => {
    const date = iso(year, month, i - first + 1)
    const col = i % 7
    const { out, dots } = items(date, col)
    return { date, d: Number(date.slice(8)), col, muted: i < first || i >= first + days, today: date === props.today, out, dots }
  })
})

const bar = (start: boolean, end: boolean) => [start ? 'ml-0 pl-1.5 rounded-l-md' : '-ml-[9px] pl-[9px]', end ? 'mr-0 rounded-r-md' : '-mr-[9px]']

function onCell(e: MouseEvent, date: string) {
  if ((e.target as HTMLElement).closest('a, button')) return
  emit('add', date)
}
</script>

<template>
  <div class="grid grid-cols-7 gap-1">
    <div
      v-for="c in cells"
      :key="c.date"
      class="group relative min-h-[56px] sm:min-h-[104px] p-1.5 rounded-xl border border-transparent cursor-pointer transition hover:border-zinc-200 hover:bg-zinc-50/60"
      :class="[c.col > 4 && 'bg-zinc-50/50', c.muted && 'opacity-40']"
      @click="onCell($event, c.date)"
    >
      <div class="flex items-center justify-between mb-1">
        <span class="inline-flex items-center justify-center min-w-6 h-6 px-1 rounded-full text-xs sm:text-sm tabular-nums" :class="c.today ? 'bg-accent text-white font-semibold' : c.muted ? 'text-zinc-400' : 'text-zinc-700'">{{ c.d }}</span>
        <button type="button" :aria-label="`Добавить событие на ${c.date.split('-').reverse().join('.')}`" class="hidden sm:flex w-5 h-5 rounded-full items-center justify-center text-zinc-400 opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-zinc-200 hover:text-zinc-700 transition" @click="emit('add', c.date)">+</button>
      </div>
      <div class="hidden sm:block space-y-0.5">
        <template v-for="(it, i) in c.out.slice(0, MAX)" :key="i">
          <div v-if="it.type === 'report'" class="h-5 flex items-center gap-1 text-[11px] font-medium truncate bg-violet-100 text-violet-800" :class="bar(it.start, it.end)">
            <span v-if="it.start" class="inline-flex items-center gap-1.5"><span class="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />Отчёты клиентам</span><template v-else>&nbsp;</template>
          </div>
          <div v-else-if="it.type === 'spacer'" class="h-5" aria-hidden="true" />
          <div v-else-if="it.type === 'vacation'" class="h-5 flex items-center gap-1 text-[11px] font-medium truncate bg-zinc-200/80 text-zinc-700" :class="bar(it.start, it.end)">
            <template v-if="it.start"><span class="w-4 h-4 shrink-0 rounded-full bg-zinc-500 text-white text-[7px] font-semibold flex items-center justify-center">{{ it.ini }}</span><span class="truncate">{{ it.who }}</span></template><template v-else>&nbsp;</template>
          </div>
          <NuxtLink v-else-if="it.type === 'deadline'" to="/tasks/1" :title="`${it.title} · ${it.p}`" class="flex items-center gap-1.5 h-5 px-1 rounded-md text-[11px] text-blue-700 hover:bg-blue-50 transition min-w-0"><span class="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" aria-hidden="true" /><span class="truncate">{{ it.title }}</span></NuxtLink>
          <div v-else :title="`Оплата: ${it.label}`" class="flex items-center gap-1.5 h-5 px-1 rounded-md text-[11px] font-medium text-emerald-700 bg-emerald-50 min-w-0"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" /><span class="truncate">{{ it.label }}</span></div>
        </template>
        <div v-if="c.out.length > MAX" class="px-1 text-[11px] text-zinc-500">ещё {{ c.out.length - MAX }}</div>
      </div>
      <div class="sm:hidden flex flex-wrap gap-0.5 px-0.5">
        <span v-for="(dot, i) in c.dots.slice(0, 4)" :key="i" class="w-1.5 h-1.5 rounded-full" :class="dot" />
      </div>
    </div>
  </div>
</template>
