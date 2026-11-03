<script setup lang="ts">
// График метрик прототипа (SEOApp.metricChart): линия факта, пунктир плана, плитки статистики.
// Переключатель показателя — снаружи (UiSegmented с тем же v-model:metric).
import type { MetricSeries } from '~/types/ui'

const props = withDefaults(defineProps<{
  months: string[]
  series: Record<string, MetricSeries>
  metric: string
  /** Плитки «значение / план / выполнение / к прошлому месяцу» под графиком. */
  stats?: boolean
}>(), { stats: false })

const box = ref<HTMLElement | null>(null)
const width = ref(660)
let ro: ResizeObserver | null = null
onMounted(() => {
  if (!box.value) return
  const measure = () => { width.value = Math.max(500, Math.round(box.value?.clientWidth || 660)) }
  measure()
  ro = new ResizeObserver(measure)
  ro.observe(box.value)
})
onBeforeUnmount(() => ro?.disconnect())

const uid = 'mc' + String(useId()).replace(/[^a-zA-Z0-9]/g, '')

const chart = computed(() => {
  const s = props.series[props.metric] ?? Object.values(props.series)[0]!
  const n = props.months.length
  const W = width.value
  const vals = (s.fact.filter(v => v != null) as number[]).concat(s.plan || [])
  const hi0 = Math.max(...vals)
  const lo0 = Math.min(...vals)
  const pad = (hi0 - lo0) * 0.15 || hi0 * 0.1 || 1
  const hi = hi0 + pad
  const lo = Math.max(0, lo0 - pad)
  const x = (i: number) => 30 + ((W - 60) / (n - 1)) * i
  const y = (v: number) => 170 - ((v - lo) / (hi - lo)) * 140
  const pts = s.fact.map((v, i) => (v == null ? null : { x: x(i), y: y(v), v, i })).filter(Boolean) as { x: number; y: number; v: number; i: number }[]
  const line = pts.map((p, i) => (i ? 'L ' : 'M ') + p.x.toFixed(1) + ',' + p.y.toFixed(1)).join(' ')
  const last = pts[pts.length - 1]!
  const plan = s.plan ? s.plan.map((v, i) => (i ? 'L ' : 'M ') + x(i).toFixed(1) + ',' + y(v).toFixed(1)).join(' ') : ''
  const area = `${line} L ${last.x.toFixed(1)},170 L ${pts[0]!.x.toFixed(1)},170 Z`

  const prev = s.fact[last.i - 1]
  const planV = s.plan ? s.plan[last.i] : null
  const pct = planV ? Math.round((last.v / planV) * 100) : null
  const diff = prev != null ? last.v - prev : null
  const tiles = [
    { label: `${s.label} · ${props.months[last.i]}`, value: fmtNum(last.v, s.suffix), tone: '' },
    { label: `План на ${props.months[last.i]}`, value: planV != null ? fmtNum(planV, s.suffix) : '—', tone: '' },
    { label: 'Выполнение плана', value: pct != null ? pct + '%' : '—', tone: pct == null ? '' : pct >= 100 ? 'text-emerald-700' : pct >= 90 ? 'text-amber-700' : 'text-red-700' },
    { label: 'К прошлому месяцу', value: diff == null ? '—' : (diff >= 0 ? '+' : '−') + fmtNum(Math.abs(diff), s.suffix), tone: diff == null ? '' : diff >= 0 ? 'text-emerald-700' : 'text-red-700' }
  ]
  return { s, W, x, pts, line, last, plan, area, hi0, tiles, gradId: uid + props.metric }
})
</script>

<template>
  <div>
    <div class="w-full overflow-x-auto">
      <div ref="box">
        <svg :viewBox="`0 0 ${chart.W} 200`" :width="chart.W" height="200" class="block" role="img" :aria-label="chart.s.label">
          <defs>
            <linearGradient :id="chart.gradId" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" :stop-color="chart.s.color" stop-opacity="0.16" />
              <stop offset="100%" :stop-color="chart.s.color" stop-opacity="0" />
            </linearGradient>
          </defs>
          <line v-for="gy in [30, 65, 100, 135]" :key="gy" x1="30" :y1="gy" :x2="chart.W - 30" :y2="gy" stroke="#f4f4f5" />
          <line x1="30" y1="170" :x2="chart.W - 30" y2="170" stroke="#e4e4e7" />
          <text x="30" y="22" font-size="10" fill="#a1a1aa">{{ fmtNum(chart.hi0, chart.s.suffix) }}</text>
          <text v-for="(m, i) in months" :key="m" :x="chart.x(i).toFixed(1)" y="192" text-anchor="middle" font-size="11" fill="#71717a">{{ m }}</text>
          <path v-if="chart.plan" :d="chart.plan" fill="none" stroke="#a1a1aa" stroke-width="1.5" stroke-dasharray="4 4" />
          <path :d="chart.area" :fill="`url(#${chart.gradId})`" />
          <path :d="chart.line" fill="none" :stroke="chart.s.color" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" />
          <circle
            v-for="(p, i) in chart.pts"
            :key="p.i"
            :cx="p.x.toFixed(1)"
            :cy="p.y.toFixed(1)"
            :r="i === chart.pts.length - 1 ? 4.5 : 3.5"
            :fill="i === chart.pts.length - 1 ? chart.s.color : '#fff'"
            :stroke="chart.s.color"
            stroke-width="2"
          ><title>{{ months[p.i] }}: {{ fmtNum(p.v, chart.s.suffix) }}{{ chart.s.plan ? ' · план ' + fmtNum(chart.s.plan[p.i]!, chart.s.suffix) : '' }}</title></circle>
          <text :x="Math.min(chart.last.x, chart.W - 40).toFixed(1)" :y="Math.max(chart.last.y - 12, 12).toFixed(1)" text-anchor="middle" font-size="11" font-weight="600" :fill="chart.s.color">{{ fmtNum(chart.last.v, chart.s.suffix) }}</text>
        </svg>
      </div>
    </div>
    <div v-if="stats" class="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
      <div v-for="t in chart.tiles" :key="t.label" class="rounded-2xl bg-zinc-50 px-4 py-3 min-w-0">
        <div class="text-xs text-zinc-500 truncate">{{ t.label }}</div>
        <div class="text-lg font-semibold tracking-tight tabular-nums mt-0.5" :class="t.tone">{{ t.value }}</div>
      </div>
    </div>
  </div>
</template>
