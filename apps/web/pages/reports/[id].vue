<script setup lang="ts">
// report.html → отчёт за месяц (id = 2025-05). Сотрудник видит черновик в каркасе приложения,
// клиент (?view=client, ?print=1 или роль client) — чистый документ без сайдбара, готовый к печати в PDF.
import ReportChart from '~/components/reports/ReportChart.vue'
import { KPI_DEFAULT, KPI_OPTS } from '~/constants/directory'
import type { ReportChartData, ReportWork } from '~/types/reports'

definePageMeta({
  roles: ['owner', 'seo_head', 'mgr_head', 'pm', 'employee'],
  middleware: [(to) => {
    const role = useCookie<string>('seo_role').value
    const client = to.query.view === 'client' || to.query.print === '1' || role === 'client'
    setPageLayout(client ? 'auth' : 'default')
  }]
})

const route = useRoute()
const { can, role } = useRole()
const notify = useNotify()

const clientView = computed(() => route.query.view === 'client' || route.query.print === '1' || role.value === 'client')

const monthKey = computed(() => {
  const id = String(route.params.id || '')
  const m = id.match(/^(\d{4})-(\d{2})$/)
  return m && +m[2]! >= 1 && +m[2]! <= 12 ? id : '2025-05'
})
const monthTitle = computed(() => {
  const [y, m] = monthKey.value.split('-')
  return `${MONTHS[+m! - 1]} ${y}`
})
const monthLower = computed(() => monthTitle.value.charAt(0).toLowerCase() + monthTitle.value.slice(1))

useHead({ title: () => `Отчёт по проекту holod-shop.ru — ${monthTitle.value}` })

type KpiKey = 'traffic' | 'leads' | 'top10'

const STAFF_KPI = [
  { label: 'Трафик', value: '24 380', note: '94% плана', tone: 'text-amber-700' },
  { label: 'Лиды', value: '312', note: '108% плана', tone: 'text-emerald-700' },
  { label: 'Топ-10', value: '148', note: '114% плана', tone: 'text-emerald-700' },
  { label: 'Принято работ', value: '22 / 23', note: '96%', tone: 'text-emerald-700' }
]

const CLIENT_KPI: { key: KpiKey; label: string; value: string; plan: string; pct: string; tone: string }[] = [
  { key: 'traffic', label: 'Поисковый трафик', value: '24 380', plan: '26 000', pct: '94%', tone: 'text-amber-700' },
  { key: 'leads', label: 'Целевые обращения', value: '312', plan: '290', pct: '108%', tone: 'text-emerald-700' },
  { key: 'top10', label: 'Запросов в ТОП-10', value: '148', plan: '130', pct: '114%', tone: 'text-emerald-700' }
]

const CHARTS: Record<KpiKey, ReportChartData> = {
  traffic: {
    title: 'Динамика поискового трафика за месяц',
    label: 'Трафик', color: '#0071e3',
    summary: 'Факт 24 380 · план 26 000 · 94%',
    fact: [16800, 18200, 19800, 21200, 22400, 23400, 24380],
    plan: [18000, 19500, 21000, 22500, 24000, 25000, 26000],
    yLabels: ['0', '8k', '16k', '24k', '32k']
  },
  leads: {
    title: 'Динамика целевых обращений (лидов)',
    label: 'Лиды', color: '#059669',
    summary: 'Факт 312 · план 290 · 108%',
    fact: [210, 235, 255, 270, 288, 300, 312],
    plan: [200, 220, 240, 255, 270, 280, 290],
    yLabels: ['0', '80', '160', '240', '320']
  },
  top10: {
    title: 'Динамика позиций в ТОП-10',
    label: '% в ТОП-10', color: '#7c3aed',
    summary: 'Факт 148 · план 130 · 114%',
    fact: [108, 118, 126, 132, 138, 144, 148],
    plan: [100, 108, 114, 118, 122, 126, 130],
    yLabels: ['0', '40', '80', '120', '160']
  }
}

const STAFF_DONE = [
  { title: 'Core Web Vitals.', text: 'Оптимизация скриптов и WebP — LCP мобильных с 3.8 с до 1.4 с.' },
  { title: 'Семантика.', text: '480 запросов по «Морозильные камеры», 12 посадочных.' },
  { title: 'Schema.org Product.', text: 'Сниппеты со звёздами и ценами в выдаче.' }
]

const WORKS: ReportWork[] = [
  {
    id: 'cwv', category: 'Аудит и техническая часть',
    title: 'Оптимизация скорости загрузки карточек товаров (Core Web Vitals)',
    text: 'Проведена оптимизация скриптов и сжатие изображений каталога в WebP. Время загрузки первого экрана на мобильных сократилось с 3.8 сек до 1.4 сек (зелёная зона Google PageSpeed).'
  },
  {
    id: 'sem', category: 'Семантика и структура',
    title: 'Кластеризация и расширение раздела «Морозильные камеры»',
    text: 'Собрано 480 поисковых запросов, внедрены новые фильтры по объёму и компрессорам. Создано 12 новых посадочных страниц.'
  },
  {
    id: 'schema', category: 'Внутренняя оптимизация',
    title: 'Внедрение микроразметки Schema.org Product',
    text: 'Настроена разметка цен, наличия и отзывов для товарных карточек. В поисковой выдаче Яндекса и Google появились сниппеты со звёздами и ценами.'
  }
]

// Комментарии задачи с отметкой «В отчёте» (task.html пишет их в localStorage seo_task_comments_1).
const TASK_TITLE = 'Проверить индексацию в GSC'
const SEED_NOTE: ReportWork = {
  id: 's3', category: 'Аудит и техническая часть', title: TASK_TITLE,
  html: '<p>Проверили индексацию сайта: <b>92% страниц</b> находятся в поиске Google.</p><ul><li>Три страницы выпали после последнего обновления сайта — отправили их на повторную проверку.</li><li>Служебные страницы скрыты от поиска правильно.</li></ul>'
}
const notes = ref<ReportWork[]>([SEED_NOTE])

const activeKpis = ref<KpiKey[]>(KPI_DEFAULT as KpiKey[])
const clientKpis = computed(() => CLIENT_KPI.filter(k => activeKpis.value.includes(k.key)))
const kpiCols = computed(() => {
  const visible = clientKpis.value.length + 1
  return visible <= 1 ? 'grid-cols-1 sm:grid-cols-2'
    : visible === 2 ? 'grid-cols-2'
      : visible === 3 ? 'grid-cols-2 lg:grid-cols-3'
        : 'grid-cols-2 lg:grid-cols-4'
})
const clientLogo = ref('')

function readKpis(): KpiKey[] {
  const allowed = KPI_OPTS.map(k => k.id)
  const normalize = (list: unknown[]) => {
    const out = allowed.filter(id => list.includes(id))
    return (out.length ? out : KPI_DEFAULT) as KpiKey[]
  }
  try {
    const raw = localStorage.getItem('seo_project_kpis_holod')
    if (!raw) {
      const legacy = localStorage.getItem('seo_primary_kpi_holod')
      return legacy ? normalize([legacy]) : (KPI_DEFAULT as KpiKey[])
    }
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return normalize(parsed)
      if (typeof parsed === 'string') return normalize([parsed])
    }
    catch {
      return normalize([raw])
    }
  }
  catch { /* недоступно хранилище */ }
  return KPI_DEFAULT as KpiKey[]
}

function readNotes(): ReportWork[] {
  let store: { items?: { id: string; html?: string; report?: boolean }[]; flags?: Record<string, boolean> } = {}
  try { store = JSON.parse(localStorage.getItem('seo_task_comments_1') || '{}') || {} }
  catch { return [SEED_NOTE] }
  const flags = store.flags || {}
  const out = ('s3' in flags ? flags.s3 : true) ? [SEED_NOTE] : []
  const toText = (html: string) => new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim() || ''
  for (const c of store.items || []) {
    if (!(c.id in flags ? flags[c.id] : c.report)) continue
    const text = toText(c.html || '')
    if (text) out.push({ id: c.id, category: 'Аудит и техническая часть', title: TASK_TITLE, text })
  }
  return out
}

onMounted(() => {
  activeKpis.value = readKpis()
  notes.value = readNotes()
  try { clientLogo.value = localStorage.getItem('seo_client_logo_holod') || '' }
  catch { /* недоступно хранилище */ }
  if (clientView.value && route.query.print === '1') setTimeout(() => window.print(), 400)
})

const print = () => window.print()
const TIP_COMPOSE = 'Составлять отчёты может сотрудник компании'
</script>

<template>
  <!-- Эталонный клиентский документ -->
  <main v-if="clientView" class="max-w-4xl mx-auto px-4 py-8 space-y-8 bg-canvas min-h-screen print:p-0 print:max-w-full">
    <div class="flex flex-wrap items-center justify-between gap-3 print:hidden">
      <NuxtLink to="/portal" class="text-sm text-zinc-500 hover:text-zinc-900 transition shrink-0">← Вернуться в портал</NuxtLink>
      <UButton color="black" class="rounded-full gap-2" @click="print">Сохранить в PDF / Печать</UButton>
    </div>

    <section class="bg-white rounded-2xl shadow-card p-6 flex flex-wrap items-center justify-between gap-4 print:shadow-none print:border print:border-zinc-200">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-12 h-12 rounded-2xl bg-zinc-900 text-white text-sm font-semibold flex items-center justify-center shrink-0">RD</div>
        <div class="min-w-0">
          <div class="text-sm font-semibold tracking-tight truncate">Ромашка Digital</div>
          <div class="text-xs text-zinc-500">SEO &amp; Performance</div>
        </div>
      </div>
      <div class="text-center flex-1 min-w-[12rem] px-2">
        <div class="text-sm font-semibold tracking-tight text-ink">Отчёт по проекту holod-shop.ru за {{ monthTitle }}</div>
        <div class="text-xs text-emerald-700 mt-1 font-medium">Утверждён 03.06.2025</div>
      </div>
      <div class="flex items-center gap-3 min-w-0">
        <div v-if="clientLogo" class="w-12 h-12 rounded-2xl overflow-hidden shrink-0 bg-white border border-zinc-200">
          <img :src="clientLogo" alt="" class="w-full h-full object-contain p-1">
        </div>
        <div v-else class="w-12 h-12 rounded-2xl bg-zinc-900 text-white text-sm font-semibold flex items-center justify-center shrink-0 overflow-hidden">ХГ</div>
        <div class="min-w-0 text-right">
          <div class="text-sm font-medium truncate">ООО «Холод Групп»</div>
          <div class="text-xs text-zinc-500">Интернет-магазин «Холод»</div>
        </div>
      </div>
    </section>

    <section>
      <h2 class="text-sm font-semibold tracking-tight mb-3">Сводные метрики месяца</h2>
      <div class="grid gap-4" :class="kpiCols">
        <div v-for="k in clientKpis" :key="k.key" class="bg-white rounded-2xl shadow-card p-4 print:shadow-none print:border print:border-zinc-200 print:break-inside-avoid">
          <div class="text-xs text-zinc-500 mb-1">{{ k.label }}</div>
          <div class="text-xl font-semibold tracking-tight tabular-nums">{{ k.value }}</div>
          <div class="text-[11px] text-zinc-500 mt-1">план: {{ k.plan }} · <span class="font-medium" :class="k.tone">{{ k.pct }}</span></div>
        </div>
        <div class="bg-white rounded-2xl shadow-card p-4 print:shadow-none print:border print:border-zinc-200 print:break-inside-avoid">
          <div class="text-xs text-zinc-500 mb-1">Принято работ</div>
          <div class="text-xl font-semibold tracking-tight tabular-nums">22 из 23</div>
          <div class="text-[11px] text-zinc-500 mt-1"><span class="text-emerald-700 font-medium">96%</span> выполнения</div>
        </div>
      </div>
    </section>

    <section class="space-y-4">
      <article
        v-for="key in activeKpis"
        :key="key"
        class="bg-white rounded-2xl shadow-card p-4 lg:p-6 print:shadow-none print:border print:border-zinc-200 print:break-inside-avoid"
      >
        <h3 class="text-sm font-semibold tracking-tight text-ink">{{ CHARTS[key].title }}</h3>
        <p class="text-xs text-zinc-500 mt-0.5 mb-4">{{ CHARTS[key].summary }} · факт — сплошная · план — пунктир</p>
        <ReportChart :id="key" :chart="CHARTS[key]" />
      </article>
    </section>

    <section class="space-y-4">
      <div>
        <h2 class="text-sm font-semibold tracking-tight">Выполненные работы за месяц</h2>
        <p class="text-xs text-zinc-500 mt-0.5">Сформированы из комментариев с пометкой «Для отчёта»</p>
      </div>

      <article
        v-for="(w, i) in [...WORKS, ...notes]"
        :key="w.id"
        class="bg-white rounded-2xl shadow-card p-4 lg:p-6 print:shadow-none print:border print:border-zinc-200"
        :class="i === 0 ? 'space-y-4' : 'space-y-3'"
      >
        <div class="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{{ w.category }}</div>
        <div>
          <h3 class="text-sm font-semibold text-ink">{{ w.title }}</h3>
          <div v-if="w.html" class="mt-2" :class="RICH" v-html="w.html" />
          <p v-else class="mt-2 text-sm text-zinc-700 leading-relaxed">{{ w.text }}</p>
          <div v-if="w.id === 'cwv'" class="mt-3 flex flex-wrap items-center gap-3">
            <a href="https://pagespeed.web.dev/" target="_blank" rel="noopener" class="block w-28 h-20 rounded-xl overflow-hidden ring-1 ring-black/5 bg-zinc-50 hover:ring-accent/40 transition" title="Скриншот PageSpeed">
              <svg viewBox="0 0 112 80" class="w-full h-full" aria-hidden="true">
                <rect width="112" height="80" fill="#f4f4f5" />
                <rect x="10" y="12" width="92" height="8" rx="2" fill="#e4e4e7" />
                <circle cx="56" cy="48" r="18" fill="none" stroke="#22c55e" stroke-width="4" />
                <text x="56" y="52" text-anchor="middle" fill="#16a34a" font-size="12" font-weight="600">94</text>
              </svg>
            </a>
            <a href="https://pagespeed.web.dev/" target="_blank" rel="noopener" class="text-xs text-accent hover:underline">Открыть проверку PageSpeed →</a>
          </div>
        </div>
      </article>
    </section>
  </main>

  <!-- Черновик / навигация агентства -->
  <div v-else class="space-y-6">
    <PageHeader :back="{ to: '/reports', label: 'Отчёты' }">
      <template #title>
        <h1 :title="`Отчёт за ${monthLower}`" class="text-base font-semibold tracking-tight text-ink leading-none truncate max-w-[200px]">Отчёт за {{ monthLower }}</h1>
      </template>
      <template #actions>
        <AccessGate :allowed="can('report.draft')" :tip="TIP_COMPOSE">
          <UButton color="white" :disabled="!can('report.draft')" :data-deny-tip="TIP_COMPOSE" class="rounded-full border-zinc-200 shadow-none" @click="notify('Черновик сохранён')">Сохранить</UButton>
        </AccessGate>
        <UButton :to="`/reports/${monthKey}?view=client`">Превью клиента</UButton>
        <UButton color="white" class="rounded-full border-zinc-200 shadow-none" @click="print">PDF</UButton>
      </template>
    </PageHeader>

    <div class="flex flex-wrap items-center gap-3 mb-2">
      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />Утверждён</span>
      <NuxtLink to="/projects/holod" class="text-xs text-zinc-500 hover:text-zinc-900 hover:underline">Интернет-магазин «Холод»</NuxtLink>
    </div>
    <h2 class="text-2xl lg:text-3xl font-semibold tracking-tight">Отчёт за {{ monthLower }}</h2>
    <p class="text-sm text-zinc-500">Клиентская выдача — чистый документ без часов, ставок и маржи. Откройте превью или отправьте ссылку из портала.</p>

    <section class="bg-white rounded-2xl shadow-card p-4 lg:p-6 print:shadow-none print:border print:border-zinc-200">
      <h3 class="text-sm font-semibold tracking-tight mb-3">Итоги месяца (план vs факт)</h3>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div v-for="k in STAFF_KPI" :key="k.label" class="rounded-xl bg-zinc-50 p-3">
          <div class="text-xs text-zinc-500 mb-1">{{ k.label }}</div>
          <div class="text-lg font-semibold tracking-tight tabular-nums">{{ k.value }}</div>
          <div class="text-xs font-medium tabular-nums mt-0.5" :class="k.tone">{{ k.note }}</div>
        </div>
      </div>
    </section>

    <section class="bg-white rounded-2xl shadow-card overflow-hidden print:shadow-none print:border print:border-zinc-200">
      <div class="px-4 lg:px-6 py-4">
        <h3 class="text-sm font-semibold tracking-tight">Что сделано</h3>
        <p class="text-xs text-zinc-500 mt-0.5">Комментарии с пометкой «Для отчёта» · без внутренних часов и себестоимости</p>
      </div>
      <div class="px-4 lg:px-6 py-4 border-t border-zinc-100 space-y-4 text-sm text-zinc-700 leading-relaxed">
        <p v-for="d in STAFF_DONE" :key="d.title"><span class="font-medium text-zinc-900">{{ d.title }}</span> {{ d.text }}</p>
        <div v-for="n in notes" :key="n.id">
          <span class="font-medium text-zinc-900">{{ n.title }}.</span>
          <div v-if="n.html" class="mt-1" :class="RICH" v-html="n.html" />
          <span v-else> {{ n.text }}</span>
        </div>
      </div>
    </section>
  </div>
</template>
