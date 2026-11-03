<script setup lang="ts">
// График «факт — сплошная, план — пунктир» по дням месяца (chartSvg в report.html).
import type { ReportChartData } from '~/types/reports'

const props = defineProps<{ id: string; chart: ReportChartData }>()

const DAYS = [1, 5, 10, 15, 20, 25, 31]
const XS = [48, 143, 238, 333, 428, 523, 620]
const Y_TICKS = [184, 144, 104, 64, 28]

const y = computed(() => {
  const hi = Math.max(...props.chart.fact, ...props.chart.plan) * 1.12
  return (v: number) => 180 - (v / (hi || 1)) * (180 - 28)
})
const factPts = computed(() => props.chart.fact.map((v, i) => `${XS[i]},${y.value(v).toFixed(1)}`).join(' '))
const planPts = computed(() => props.chart.plan.map((v, i) => `${XS[i]},${y.value(v).toFixed(1)}`).join(' '))
const gid = computed(() => `rcFill-${props.id}`)
</script>

<template>
  <svg viewBox="0 0 640 220" class="w-full h-auto" role="img" :aria-label="chart.title">
    <defs>
      <linearGradient :id="gid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="chart.color" stop-opacity="0.18" />
        <stop offset="100%" :stop-color="chart.color" stop-opacity="0" />
      </linearGradient>
    </defs>
    <g stroke="#e4e4e7" stroke-width="1">
      <line x1="48" y1="20" x2="48" y2="180" />
      <line x1="48" y1="180" x2="620" y2="180" />
      <line x1="48" y1="140" x2="620" y2="140" stroke-dasharray="3 4" />
      <line x1="48" y1="100" x2="620" y2="100" stroke-dasharray="3 4" />
      <line x1="48" y1="60" x2="620" y2="60" stroke-dasharray="3 4" />
    </g>
    <text v-for="(yy, i) in Y_TICKS" :key="yy" x="40" :y="yy" text-anchor="end" fill="#a1a1aa" font-size="10">{{ chart.yLabels[i] }}</text>
    <polyline fill="none" stroke="#a1a1aa" stroke-width="2" stroke-dasharray="6 5" stroke-linejoin="round" stroke-linecap="round" :points="planPts" />
    <polygon :fill="`url(#${gid})`" :points="`${factPts} 620,180 48,180`" />
    <polyline fill="none" :stroke="chart.color" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" :points="factPts" />
    <g :fill="chart.color">
      <circle v-for="(v, i) in chart.fact" :key="i" :cx="XS[i]" :cy="y(v).toFixed(1)" r="3.5" />
    </g>
    <g fill="#71717a" font-size="10" text-anchor="middle">
      <text v-for="(d, i) in DAYS" :key="d" :x="XS[i]" y="198">{{ d }}</text>
    </g>
    <g font-size="11">
      <line x1="460" y1="28" x2="480" y2="28" :stroke="chart.color" stroke-width="2.5" />
      <text x="488" y="32" fill="#3f3f46">Факт</text>
      <line x1="540" y1="28" x2="560" y2="28" stroke="#a1a1aa" stroke-width="2" stroke-dasharray="5 4" />
      <text x="568" y="32" fill="#3f3f46">План</text>
    </g>
  </svg>
</template>
