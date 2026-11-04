<script setup lang="ts">
// projects.html → Сетка 1 (Registry): двухстрочный тулбар, 5 карточек метрик, общий график, реестр проектов.
import type { MetricSeries } from '~/types/ui'

definePageMeta({ roles: ['owner', 'seo_head', 'mgr_head', 'pm', 'employee'] })
useHead({ title: 'Проекты — SEO Control' })

const { can, user, seesWorkspace } = useRole()

type Tone = 'emerald' | 'amber' | 'red' | 'zinc'
interface Metric { value: string; pct: string; tone: Tone; plan: string; metric?: 'traffic' | 'leads' | 'top10' }
interface ProjectRow {
  id: string
  name: string
  site: string
  health: { dot: string; label: string }
  status: { label: string; badge: string; dot: string; note?: string }
  traffic: Metric | null
  leads: Metric | null
  top10: Metric | null
  works: Metric
  hours: { used: number; limit: number; pct: string }
  fee: string
  range: string
  isNew?: boolean
}

const SUMMARY = [
  { label: 'Трафик', value: '52 900', of: 'из 55 500', bar: 'bg-amber-500', width: 'w-[95%]', note: '95% плана', tone: 'text-amber-700' },
  { label: 'Лиды', value: '644', of: 'из 690', bar: 'bg-amber-500', width: 'w-[93%]', note: '93% плана', tone: 'text-amber-700' },
  { label: 'ТОП-10', value: '412', of: 'из 380', bar: 'bg-emerald-500', width: 'w-full', note: '108% плана', tone: 'text-emerald-700' },
  { label: 'Работы', value: '55', of: 'из 60', bar: 'bg-amber-500', width: 'w-[92%]', note: '92% плана', tone: 'text-amber-700' },
  { label: 'Часы', value: '156', of: 'из 268 ч', bar: 'bg-zinc-400', width: 'w-[58%]', note: '58% лимита', tone: 'text-zinc-500', wide: true }
]

const CHART: { months: string[]; series: Record<string, MetricSeries> } = {
  months: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
  series: {
    traffic: { label: 'Трафик', color: '#0071e3', fact: [38200, 41000, 44100, 47600, 50300, 52900], plan: [40000, 42500, 45000, 48500, 52000, 55500] },
    leads: { label: 'Лиды', color: '#059669', fact: [452, 488, 530, 571, 610, 644], plan: [470, 500, 540, 590, 640, 690] },
    top10: { label: '% в ТОП-10', color: '#7c3aed', suffix: '%', fact: [24.1, 26.8, 29.5, 31.2, 33.9, 35.8], plan: [25, 27, 29, 31, 32, 33] }
  }
}
const metric = ref('traffic')
const metricOptions = [
  { value: 'traffic', label: 'Трафик' },
  { value: 'leads', label: 'Лиды' },
  { value: 'top10', label: '% в ТОП-10' }
]

const ACTIVE = { label: 'Активен', badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-600' }
const rows = ref<ProjectRow[]>([])

const TONE: Record<Tone, string> = { emerald: 'text-emerald-600', amber: 'text-amber-600', red: 'text-red-600', zinc: 'text-zinc-500' }
const METRIC_TITLE = { traffic: 'трафик', leads: 'лиды', top10: 'ТОП-10' } as const

// Тулбар: строка 1 — личный фокус (Все / Мои), строка 2 — период и поиск.
const scope = ref('all')
const scopeOptions = [{ value: 'all', label: 'Все' }, { value: 'mine', label: 'Мои' }]
const q = ref('')
const from = ref('')
const to = ref('')
const perPage = ref('10')

const dirty = computed(() => !!(q.value.trim() || scope.value !== 'all' || from.value || to.value))
function resetFilters() {
  scope.value = 'all'
  q.value = ''
  from.value = ''
  to.value = ''
}

function inRange(value: string): boolean {
  if (!from.value && !to.value) return true
  const [start, end] = value.split('/') as [string, string]
  if (from.value && end < from.value) return false
  if (to.value && start > to.value) return false
  return true
}

const roleRows = computed(() => rows.value.filter(r => r.isNew || seesWorkspace() || user.value.projects.includes(r.id)))
const visible = computed(() => {
  const needle = q.value.trim().toLowerCase()
  return sorted.value.filter(r =>
    (scope.value !== 'mine' || r.isNew || user.value.projects.includes(r.id)) &&
    (!needle || `${r.name} ${r.site} ${r.status.label}`.toLowerCase().includes(needle)) &&
    (r.isNew || inRange(r.range))
  )
})

// Сортировка по клику на заголовок (data-sort-table): числа сравниваются по первому числу.
type SortKey = 'name' | 'status' | 'traffic' | 'leads' | 'top10' | 'works' | 'hours'
const sortBy = ref<SortKey | null>(null)
const sortDir = ref<'asc' | 'desc'>('desc')
const num = (s: string | undefined) => (s ? parseFloat(s.replace(/\s/g, '')) : -1)
const sortValue = (r: ProjectRow, k: SortKey): number | string => {
  if (k === 'name') return r.name
  if (k === 'status') return r.status.label
  if (k === 'hours') return r.hours.used
  return num(r[k]?.value)
}
const sorted = computed(() => {
  if (!sortBy.value) return roleRows.value
  const k = sortBy.value
  return [...roleRows.value].sort((a, b) => {
    const av = sortValue(a, k)
    const bv = sortValue(b, k)
    const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'ru', { numeric: true })
    return sortDir.value === 'asc' ? cmp : -cmp
  })
})
function sort(k: SortKey) {
  sortDir.value = sortBy.value === k && sortDir.value === 'desc' ? 'asc' : 'desc'
  sortBy.value = k
}
const COLUMNS: { key: SortKey; label: string; cls: string }[] = [
  { key: 'name', label: 'Проект', cls: 'text-left px-4 lg:px-6' },
  { key: 'status', label: 'Статус', cls: 'text-left px-3' },
  { key: 'traffic', label: 'Трафик', cls: 'text-left px-3' },
  { key: 'leads', label: 'Лиды', cls: 'text-left px-3' },
  { key: 'top10', label: 'Топ-10', cls: 'text-left px-3' },
  { key: 'works', label: 'Работы', cls: 'text-left px-3' },
  { key: 'hours', label: 'Часы', cls: 'text-right px-3' }
]

// Новый проект появляется в таблице сразу после создания.
const createOpen = ref(false)

onMounted(async () => {
  try {
    const list = await $fetch<Array<{ id: string; slug: string; name: string; domain: string | null; clientName: string; status: string; monthlyBudget: number | null; taskCount: number; targetTraffic: number; targetLeads: number }>>('/api/projects', { credentials: 'include' })
    rows.value = list.map(project => ({
      id: project.slug || project.id,
      name: project.name,
      site: [project.domain, project.clientName].filter(Boolean).join(' · ') || '—',
      range: '',
      health: { dot: 'bg-zinc-300', label: 'Данные из базы' },
      status: project.status === 'ACTIVE'
        ? ACTIVE
        : project.status === 'DRAFT'
          ? { label: 'Запуск', badge: 'bg-blue-50 text-blue-700', dot: 'bg-blue-600' }
          : { label: 'На паузе', badge: 'bg-zinc-100 text-zinc-700', dot: 'bg-zinc-500' },
      traffic: project.targetTraffic ? { value: '—', pct: '', tone: 'zinc' as const, plan: String(project.targetTraffic), metric: 'traffic' as const } : null,
      leads: project.targetLeads ? { value: '—', pct: '', tone: 'zinc' as const, plan: String(project.targetLeads), metric: 'leads' as const } : null,
      top10: null,
      works: { value: String(project.taskCount), pct: '', tone: 'zinc' as const, plan: '' },
      hours: { used: 0, limit: 0, pct: '' },
      fee: project.monthlyBudget ? project.monthlyBudget.toLocaleString('ru-RU') + ' ₽' : '—'
    }))
  } catch {
    rows.value = []
  }
})
function onCreated(p: { id: string; title: string; site: string; client: string; budget: string }) {
  rows.value.unshift({
    id: p.id, name: p.title, site: `${p.site} · ${p.client}`, range: '', isNew: true,
    health: { dot: 'bg-zinc-300', label: 'Нет данных — проект только создан' },
    status: { label: 'Старт', badge: 'bg-blue-50 text-blue-700', dot: 'bg-blue-600' },
    traffic: null, leads: null, top10: null,
    works: { value: '—', pct: '', tone: 'zinc', plan: '' },
    hours: { used: 0, limit: 0, pct: '' },
    fee: p.budget ? (+p.budget).toLocaleString('ru-RU') + ' ₽' : '—'
  })
}

const TD = 'md:px-3 md:py-3 lg:py-4 text-sm min-w-0 before:block before:text-[11px] before:text-zinc-500 before:mb-0.5 before:content-[attr(data-label)] md:before:hidden'
const DATE = 'h-9 sm:h-8 flex-1 sm:flex-none min-w-0'
</script>

<template>
  <PageRegistry title="Проекты">
    <template #actions>
      <AccessGate :allowed="can('project.create')" tip="Создание проектов доступно менеджеру или руководству">
        <UButton :disabled="!can('project.create')" data-deny-tip="Создание проектов доступно менеджеру или руководству" @click="createOpen = true">
          <span class="sm:hidden">+ Создать</span><span class="hidden sm:inline">+ Новый проект</span>
        </UButton>
      </AccessGate>
    </template>

    <template #focus>
      <UiSegmented v-model="scope" :options="scopeOptions" aria-label="Проекты" />
    </template>

    <template #filters>
      <div class="flex items-center gap-2 w-full sm:w-auto" role="group" aria-label="Период">
        <UInput v-model="from" type="date" size="xs" aria-label="Дата начала" :max="to || undefined" :class="DATE" />
        <span class="text-xs text-zinc-400 shrink-0" aria-hidden="true">—</span>
        <UInput v-model="to" type="date" size="xs" aria-label="Дата окончания" :min="from || undefined" :class="DATE" />
      </div>
      <UInput
        v-model="q"
        type="search"
        size="xs"
        placeholder="Поиск"
        aria-label="Поиск проектов"
        icon="i-heroicons-magnifying-glass-20-solid"
        class="w-full sm:w-64 shrink-0 sm:ml-auto"
      />
      <UButton v-if="dirty" color="gray" variant="ghost" size="xs" class="bg-zinc-100 hover:bg-zinc-200 text-zinc-700" @click="resetFilters">Сбросить фильтры</UButton>
    </template>

    <div class="space-y-6">
      <section class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 w-full">
        <div
          v-for="s in SUMMARY"
          :key="s.label"
          class="bg-white rounded-2xl shadow-card p-3 sm:p-4 flex flex-col justify-between min-w-0"
          :class="s.wide && 'col-span-2 md:col-span-1 xl:col-span-1'"
        >
          <div class="text-xs font-medium text-zinc-500 truncate mb-1">{{ s.label }}</div>
          <div class="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1.5 min-w-0">
            <span class="text-lg sm:text-2xl font-bold tracking-tight text-ink tabular-nums leading-tight">{{ s.value }}</span>
            <span class="text-[11px] sm:text-xs text-zinc-400 tabular-nums">{{ s.of }}</span>
          </div>
          <div class="mt-2 h-1.5 bg-zinc-100 rounded-full overflow-hidden w-full">
            <div class="h-full rounded-full" :class="[s.bar, s.width]" />
          </div>
          <div class="text-xs font-medium tabular-nums mt-1" :class="s.tone">{{ s.note }}</div>
        </div>
      </section>
      <p class="text-xs text-zinc-500 flex flex-wrap items-center gap-x-4 gap-y-1">
        <span>Факт / план. Цвет — выполнение плана:</span>
        <span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-500" />от 100%</span>
        <span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-amber-500" />90–99%</span>
        <span class="inline-flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-red-500" />ниже 90%</span>
        <span>Часы — расход от лимита: красный только при превышении.</span>
        <span class="inline-flex items-center gap-1.5">Точка у проекта — здоровье динамики: <span class="w-2 h-2 rounded-full bg-emerald-500" />в плане <span class="w-2 h-2 rounded-full bg-amber-400" />отставание <span class="w-2 h-2 rounded-full bg-red-500" />сильно отстаёт <span class="w-2 h-2 rounded-full bg-zinc-300" />нет данных · процент — переход к графику</span>
      </p>

      <section class="bg-white rounded-2xl shadow-card p-4 lg:p-6">
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4 lg:mb-6">
          <div>
            <h3 class="text-sm font-semibold tracking-tight">Общая динамика</h3>
            <p class="text-xs text-zinc-500 mt-0.5">Все проекты · январь–июнь 2025 · пунктир — план</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <UiSegmented v-model="metric" :options="metricOptions" size="md" aria-label="Показатель" />
          </div>
        </div>
        <UiMetricChart :months="CHART.months" :series="CHART.series" :metric="metric" />
      </section>
    </div>

    <section class="bg-white rounded-2xl shadow-card overflow-hidden">
      <div class="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 max-w-full">
        <table class="w-full block md:table">
          <thead class="hidden md:table-header-group">
            <tr class="border-b border-zinc-100">
              <th v-for="c in COLUMNS" :key="c.key" class="text-xs font-medium text-zinc-500 whitespace-nowrap py-3" :class="c.cls">
                <button type="button" class="inline-flex items-center gap-1 hover:text-zinc-900 transition select-none" :class="sortBy === c.key && 'text-zinc-900'" @click="sort(c.key)">{{ c.label }}<svg class="w-3 h-3 text-zinc-500" viewBox="0 0 16 16" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 3v10M5 6l3-3 3 3M5 10l3 3 3-3" /></svg></button>
              </th>
              <th v-if="can('finance.fee.view')" class="text-right text-xs font-medium text-zinc-500 whitespace-nowrap px-4 lg:px-6 py-3">Чек</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 block md:table-row-group">
            <tr
              v-for="r in visible"
              :key="r.id"
              class="hover:bg-zinc-50/50 transition grid grid-cols-2 gap-x-4 gap-y-3 p-4 md:p-0 md:table-row align-top"
              :class="r.isNew && 'bg-accent/5'"
            >
              <td class="md:px-4 lg:px-6 md:py-3 lg:py-4 col-span-2 md:col-span-1">
                <span class="inline-flex items-center gap-2"><span role="img" :aria-label="r.health.label" :title="r.health.label" class="relative flex w-2.5 h-2.5 shrink-0"><span class="relative w-2.5 h-2.5 rounded-full ring-2 ring-white" :class="r.health.dot" /></span><NuxtLink :to="`/projects/${r.id}`" class="text-base font-medium hover:underline">{{ r.name }}</NuxtLink></span>
                <div class="text-xs text-zinc-500 mt-0.5 pl-[18px]">{{ r.site }}</div>
              </td>
              <td data-label="Статус" :class="TD">
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0" :class="r.status.badge"><span class="w-1.5 h-1.5 rounded-full" :class="r.status.dot" />{{ r.status.label }}</span>
                <div v-if="r.status.note" class="text-xs text-zinc-500 mt-0.5">{{ r.status.note }}</div>
              </td>
              <template v-for="k in (['traffic', 'leads', 'top10'] as const)" :key="k">
                <td v-if="r[k]" :data-label="k === 'top10' ? 'Топ-10' : k === 'leads' ? 'Лиды' : 'Трафик'" :class="[TD, 'tabular-nums']">
                  <div class="font-medium text-sm tabular-nums whitespace-nowrap">{{ r[k]!.value }} · <NuxtLink :to="`/projects/${r.id}?metric=${k}#analytics`" :title="`Открыть динамику: ${METRIC_TITLE[k]}`" class="font-semibold hover:underline underline-offset-2" :class="TONE[r[k]!.tone]">{{ r[k]!.pct }}</NuxtLink></div>
                  <div class="text-xs text-zinc-400 mt-0.5 whitespace-nowrap">план: {{ r[k]!.plan }}</div>
                </td>
                <td v-else :data-label="k === 'top10' ? 'Топ-10' : k === 'leads' ? 'Лиды' : 'Трафик'" :class="[TD, 'md:text-right whitespace-nowrap tabular-nums text-zinc-400']">—</td>
              </template>
              <td data-label="Работы" :class="[TD, 'tabular-nums']">
                <template v-if="r.works.plan">
                  <div class="font-medium text-sm tabular-nums whitespace-nowrap">{{ r.works.value }} · <span class="font-semibold" :class="TONE[r.works.tone]">{{ r.works.pct }}</span></div>
                  <div class="text-xs text-zinc-400 mt-0.5 whitespace-nowrap">план: {{ r.works.plan }}</div>
                </template>
                <span v-else class="text-zinc-400">—</span>
              </td>
              <td data-label="Часы" :class="[TD, 'md:text-right whitespace-nowrap tabular-nums']">
                <template v-if="r.hours.limit">{{ r.hours.used }} <span class="text-zinc-500">/{{ r.hours.limit }}</span> <span class="text-xs font-medium text-zinc-500 ml-2">{{ r.hours.pct }}</span></template>
                <span v-else class="text-zinc-400">—</span>
              </td>
              <td v-if="can('finance.fee.view')" data-label="Чек" class="md:px-4 lg:px-6 md:py-3 lg:py-4 text-sm min-w-0 before:block before:text-[11px] before:text-zinc-500 before:mb-0.5 before:content-[attr(data-label)] md:before:hidden md:text-right whitespace-nowrap tabular-nums">{{ r.fee }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!visible.length" class="px-4 lg:px-6 py-14 text-center">
        <div class="mx-auto w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
          <AppIcon name="folder" class="w-6 h-6" />
        </div>
        <h3 class="text-sm font-semibold text-zinc-900">{{ rows.length ? 'Ничего не найдено' : 'Проектов пока нет' }}</h3>
        <p class="text-xs text-zinc-500 mt-1">{{ rows.length ? 'Попробуйте изменить параметры поиска или сбросить фильтры' : 'Создайте первый проект — карточки появятся из базы' }}</p>
        <UButton color="gray" variant="ghost" size="xs" class="mt-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700" @click="resetFilters">Сбросить фильтры</UButton>
      </div>
      <div class="px-4 lg:px-6 py-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
        <div class="text-sm text-zinc-500">
          Показано <span class="tabular-nums text-zinc-900 font-medium">{{ visible.length ? `1–${visible.length}` : '0' }}</span> из <span class="tabular-nums text-zinc-900 font-medium">{{ roleRows.length }}</span>
        </div>
        <div class="flex items-center gap-2 text-sm text-zinc-500">
          <span>На странице</span>
          <USelect v-model="perPage" :options="['10', '20', '50', 'Все']" size="xs" />
        </div>
      </div>
    </section>

    <ModalsProjectCreate v-model="createOpen" @created="onCreated" />
  </PageRegistry>
</template>
