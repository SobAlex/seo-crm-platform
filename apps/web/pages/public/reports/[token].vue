<script setup lang="ts">
definePageMeta({ layout: 'public' })

interface MetricPair { plan: number; fact: number; pct: number }
interface PublicReport {
  title: string
  monthLabel: string
  status: string
  summaryText: string | null
  agency: { name: string; managerName: string; phone: string; email: string }
  project: { name: string; domain: string; clientName: string }
  snapshot: {
    metrics: {
      traffic: MetricPair
      leads: MetricPair
      top10: MetricPair
      visibilityTop10: number | null
    }
    tasks: Array<{ title: string; reportNote: string | null; spentHours: number; completedAt: string | null }>
  }
}

const STATUS: Record<string, string> = {
  DRAFT: 'Черновик',
  ON_REVIEW: 'На согласовании',
  SENT: 'Отправлен',
  APPROVED: 'Утверждён'
}

const route = useRoute()
const data = ref<PublicReport | null>(null)
const error = ref('')
const pending = ref(true)

const title = computed(() => data.value ? `${data.value.title} — ${data.value.agency.name}` : 'Отчёт')
useHead({ title })

const cards = computed(() => {
  const metrics = data.value?.snapshot.metrics
  if (!metrics) return []
  return [
    { label: 'Трафик', ...metrics.traffic, suffix: '' },
    { label: 'Лиды', ...metrics.leads, suffix: '' },
    { label: '% в ТОП-10', ...metrics.top10, suffix: '%' }
  ]
})

function fmt(value: number, suffix = '') {
  const text = Number.isInteger(value) ? value.toLocaleString('ru-RU') : value.toLocaleString('ru-RU', { maximumFractionDigits: 1 })
  return text + suffix
}

function bar(pair: MetricPair) {
  if (!pair.plan) return pair.fact ? '100%' : '0%'
  return `${Math.min(100, Math.round((pair.fact / pair.plan) * 100))}%`
}

function hours(value: number) {
  return `${value.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} ч`
}

const contacts = computed(() => {
  const agency = data.value?.agency
  if (!agency) return ''
  return [agency.managerName, agency.phone, agency.email].filter(Boolean).join(' · ')
})

onMounted(async () => {
  const token = String(route.params.token || '')
  try {
    data.value = await $fetch<PublicReport>(`/api/public/reports/${encodeURIComponent(token)}`)
  } catch {
    error.value = 'Ссылка недействительна или отчёт удалён.'
  } finally {
    pending.value = false
  }
})

function printReport() {
  window.print()
}
</script>

<template>
  <div class="report-sheet min-h-screen bg-zinc-100 text-zinc-950 print:bg-white">
    <div v-if="pending" class="max-w-3xl mx-auto px-6 py-16 text-sm text-zinc-500">Загрузка отчёта…</div>
    <div v-else-if="error" class="max-w-3xl mx-auto px-6 py-16">
      <h1 class="text-xl font-semibold">Отчёт не найден</h1>
      <p class="mt-2 text-sm text-zinc-500">{{ error }}</p>
    </div>
    <article v-else-if="data" class="max-w-3xl mx-auto px-6 pt-8 pb-16 print:px-0 print:pt-0">
      <header class="flex items-start justify-between gap-4">
        <div>
          <p class="text-sm font-semibold tracking-tight">{{ data.agency.name }}</p>
          <p v-if="contacts" class="text-xs text-zinc-500 mt-1">{{ contacts }}</p>
        </div>
        <button type="button" class="no-print h-9 px-4 rounded-full bg-zinc-900 text-white text-xs font-medium hover:bg-zinc-800" @click="printReport">
          Распечатать / Сохранить в PDF
        </button>
      </header>

      <div class="mt-8">
        <p class="text-sm text-zinc-500">{{ data.project.clientName || data.project.name }}<span v-if="data.project.domain"> · {{ data.project.domain }}</span></p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight">{{ data.title }}</h1>
        <div class="mt-3 flex items-center gap-2 text-sm text-zinc-600">
          <span>{{ data.monthLabel }}</span>
          <span class="no-print inline-flex items-center px-2 py-0.5 rounded-full bg-zinc-900 text-white text-[11px] font-medium">{{ STATUS[data.status] || data.status }}</span>
        </div>
      </div>

      <section v-if="data.summaryText" class="report-avoid mt-8 bg-white rounded-2xl shadow-card p-5 print:shadow-none print:border print:border-zinc-200">
        <h2 class="text-xs font-medium uppercase tracking-wide text-zinc-400">Резюме</h2>
        <p class="mt-2 text-sm leading-relaxed text-zinc-800 whitespace-pre-wrap">{{ data.summaryText }}</p>
      </section>

      <section class="mt-6">
        <h2 class="text-sm font-semibold tracking-tight">План и факт</h2>
        <div class="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <article v-for="card in cards" :key="card.label" class="report-avoid bg-white rounded-2xl shadow-card p-4 print:shadow-none print:border print:border-zinc-200">
            <p class="text-xs text-zinc-500">{{ card.label }}</p>
            <p class="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{{ fmt(card.fact, card.suffix) }}</p>
            <p class="mt-1 text-xs text-zinc-500">план {{ fmt(card.plan, card.suffix) }} · {{ card.pct }}%</p>
            <div class="mt-3 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
              <div class="h-full rounded-full bg-zinc-900" :style="{ width: bar(card) }" />
            </div>
          </article>
        </div>
        <p v-if="data.snapshot.metrics.visibilityTop10 != null" class="mt-3 text-xs text-zinc-500">
          Видимость ядра в ТОП-10 за месяц: {{ fmt(data.snapshot.metrics.visibilityTop10, '%') }}
        </p>
      </section>

      <section class="mt-8">
        <h2 class="text-sm font-semibold tracking-tight">Выполненные работы месяца</h2>
        <p v-if="!data.snapshot.tasks.length" class="mt-3 text-sm text-zinc-500">За этот месяц в отчёт не попало задач с пометкой «В отчёте».</p>
        <div v-else class="mt-3 space-y-3">
          <article v-for="task in data.snapshot.tasks" :key="task.title" class="report-avoid bg-white rounded-2xl shadow-card p-4 print:shadow-none print:border print:border-zinc-200">
            <div class="flex items-start justify-between gap-3">
              <h3 class="text-sm font-semibold">{{ task.title }}</h3>
              <span class="shrink-0 text-xs tabular-nums text-zinc-500">{{ hours(task.spentHours) }}</span>
            </div>
            <div v-if="task.reportNote" class="mt-3 rounded-xl bg-zinc-50 px-3 py-2.5 print:bg-white print:border print:border-zinc-200">
              <p class="text-[11px] font-medium uppercase tracking-wide text-zinc-400">Заметка для клиента</p>
              <p class="mt-1 text-sm leading-relaxed text-zinc-800">{{ task.reportNote }}</p>
            </div>
          </article>
        </div>
      </section>
    </article>
  </div>
</template>

<style>
@media print {
  .no-print { display: none !important; }
  html, body { background: #fff !important; color: #111 !important; }
  .report-sheet { background: #fff !important; }
  .report-avoid { break-inside: avoid; page-break-inside: avoid; }
}
</style>
