<script setup lang="ts">
// project.html → Сетка 2 (Split): шапка проекта, KPI, динамика, табы «Дорожная карта / План месяца / Отчёты / Источники», сайдбар команды и финансов.
import type { FactSaved, MetricKey, ProjectMetrics, ProjectRole, SourceConnected, TeamMember, TeamPerson } from '~/types/project'
import { ROLE_TONE, readProjectKpis } from '~/types/project'

definePageMeta({ roles: ['owner', 'seo_head', 'mgr_head', 'pm', 'employee'] })
useHead({ title: 'Проект · Холод — SEO Control' })

const { can, canAny, hasRole, user } = useRole()
const { confirm } = useConfirm()
const notify = useNotify()
const route = useRoute()

const PROJECT = { name: 'Интернет-магазин «Холод»', site: 'holod-shop.ru', start: '01.05.2025' }
const projectTitle = ref(PROJECT.name)
const projectSite = ref(PROJECT.site)
const projectStart = ref(PROJECT.start)
const fresh = ref(false)
const liveTasks = ref<{ id: string; title: string; plannedHours: number; status: string }[]>([])
const crumbs = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Проекты', to: '/projects' },
  { label: projectTitle.value }
])
const KNOWN = new Set(['holod', 'remont', 'medlife', 'stroytech', 'holodb2b'])
const projectKey = computed(() => {
  const raw = route.params.id
  return typeof raw === 'string' && raw ? raw : 'holod'
})

/* ---------- KPI ---------- */
interface Kpi { key?: MetricKey; label: string; value: string; of: string; bar: string; width: string; style?: string; note: string; tone: string; wide?: boolean }
const kpis = ref<Kpi[]>([
  { key: 'traffic', label: 'Трафик', value: '24 380', of: 'из 26 000', bar: 'bg-amber-500', width: 'w-[94%]', note: '94% плана', tone: 'text-amber-700' },
  { key: 'leads', label: 'Лиды', value: '312', of: 'из 290', bar: 'bg-emerald-500', width: 'w-full', note: '108% плана', tone: 'text-emerald-700' },
  { key: 'top10', label: 'ТОП-10', value: '148', of: 'из 130', bar: 'bg-emerald-500', width: 'w-full', note: '114% плана', tone: 'text-emerald-700' },
  { label: 'Работы', value: '22', of: 'из 23', bar: 'bg-amber-500', width: 'w-[96%]', note: '96% плана', tone: 'text-amber-700' },
  { label: 'Часы', value: '82', of: 'из 96 ч', bar: 'bg-zinc-400', width: 'w-[85%]', note: '85% лимита', tone: 'text-zinc-500', wide: true }
])

/* ---------- Динамика проекта ---------- */
const metrics = ref<ProjectMetrics>({
  months: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн'],
  series: {
    traffic: { label: 'Трафик', color: '#0071e3', fact: [14200, 16100, 18300, 20500, 22600, 24380], plan: [15000, 17000, 19000, 21500, 24000, 26000] },
    leads: { label: 'Лиды', color: '#059669', fact: [168, 196, 228, 256, 287, 312], plan: [180, 200, 220, 245, 270, 290] },
    top10: { label: '% в ТОП-10', color: '#7c3aed', suffix: '%', fact: [18.5, 22.1, 25.7, 28.6, 32.4, 35.2], plan: [20, 22, 25, 27, 29, 31] }
  }
})
const chartCaption = ref('Январь–июнь 2025 · пунктир — план из дорожной карты')

interface MarkerItem {
  id: string
  query: string
  targetUrl: string | null
  position: number | null
  delta: number | null
}
interface DashboardPayload {
  mode: 'live' | 'fallback'
  periodLabel: string
  visibilityTop10: number | null
  months: string[]
  series: Record<MetricKey, { fact: number[]; plan: number[] }>
  kpi: Record<MetricKey, { fact: number; plan: number; pct: number }>
}
const markers = ref<MarkerItem[]>([])
const visibilityTop10 = ref<number | null>(null)
const queryPlaceholder = 'Вставьте поисковые фразы (каждая с новой строки).\nПример: купить кондиционер; /catalog/split; 1200'
const sourceForm = reactive({ metrikaCounter: '', goalIds: '' })
const queriesText = ref('')
const sourceSaving = ref(false)
const queriesSaving = ref(false)
const visibilityLabel = computed(() => {
  if (visibilityTop10.value == null) return '—'
  const rounded = Math.round(visibilityTop10.value * 10) / 10
  const text = Number.isInteger(rounded) ? String(rounded) : rounded.toLocaleString('ru-RU', { maximumFractionDigits: 1 })
  return `${text}%`
})
function positionBadge(item: MarkerItem) {
  if (item.position == null) return { text: '—', cls: 'bg-zinc-100 text-zinc-600' }
  if (item.delta == null || item.delta === 0) return { text: `${item.position} =`, cls: 'bg-zinc-100 text-zinc-700' }
  if (item.delta > 0) return { text: `${item.position} ▲+${item.delta}`, cls: 'bg-emerald-50 text-emerald-700' }
  return { text: `${item.position} ▼${item.delta}`, cls: 'bg-red-50 text-red-700' }
}
const metricOptions = [
  { value: 'leads', label: 'Лиды' },
  { value: 'traffic', label: 'Трафик' },
  { value: 'top10', label: '% в ТОП-10' }
]
const isMetric = (v: unknown): v is MetricKey => v === 'traffic' || v === 'leads' || v === 'top10'
const queryMetric = isMetric(route.query.metric) ? route.query.metric : null
const metric = ref<string>(queryMetric ?? 'traffic')
const analytics = ref<HTMLElement | null>(null)
const highlight = ref(false)

onMounted(() => {
  if (!queryMetric) {
    metric.value = readProjectKpis()[0] ?? 'leads'
    return
  }
  analytics.value?.scrollIntoView({ block: 'start' })
  highlight.value = true
  setTimeout(() => { highlight.value = false }, 1600)
})

const factOpen = ref(false)
const TONE = (pct: number) => pct >= 100 ? ['text-emerald-700', 'bg-emerald-500'] : pct >= 90 ? ['text-amber-700', 'bg-amber-500'] : ['text-red-700', 'bg-red-500']
function onFact({ index, values }: FactSaved) {
  const m = metrics.value
  ;(Object.keys(values) as MetricKey[]).forEach(k => { m.series[k].fact[index] = values[k] })
  if (index !== m.months.length - 1) return
  kpis.value.forEach(card => {
    if (!card.key) return
    const pct = Math.round(values[card.key] / m.series[card.key].plan![index]! * 100)
    const [text, bar] = TONE(pct) as [string, string]
    card.value = values[card.key].toLocaleString('ru-RU')
    card.note = pct + '% плана'
    card.tone = text
    card.bar = bar
    card.width = ''
    card.style = `width: ${Math.min(pct, 100)}%`
  })
}

function paintKpi(card: Kpi, fact: number, plan: number, percent: number) {
  const [text, bar] = TONE(percent) as [string, string]
  const digits = card.key === 'top10' ? 1 : 0
  card.value = fact.toLocaleString('ru-RU', { maximumFractionDigits: digits })
  card.of = `из ${plan.toLocaleString('ru-RU', { maximumFractionDigits: digits })}`
  card.note = `${percent}% плана`
  card.tone = text
  card.bar = bar
  card.width = ''
  card.style = `width: ${Math.min(percent, 100)}%`
}

function applyDashboard(data: DashboardPayload) {
  if (data.months.length >= 2) {
    (Object.keys(data.series) as MetricKey[]).forEach(key => {
      metrics.value.series[key].fact = data.series[key].fact
      metrics.value.series[key].plan = data.series[key].plan
    })
    metrics.value.months = data.months
    chartCaption.value = `${data.periodLabel} · пунктир — план из дорожной карты`
  }
  visibilityTop10.value = data.visibilityTop10
  kpis.value.forEach(card => {
    if (!card.key) return
    const point = data.kpi[card.key]
    paintKpi(card, point.fact, point.plan, point.pct)
  })
}

async function loadAnalytics() {
  const id = projectKey.value
  const [dashboard, marker, source] = await Promise.allSettled([
    $fetch<DashboardPayload>(`/api/projects/${id}/analytics/dashboard`, { credentials: 'include' }),
    $fetch<{ visibilityTop10: number | null; items: MarkerItem[] }>(`/api/projects/${id}/analytics/marker-queries`, { credentials: 'include' }),
    $fetch<{ metrikaCounter: string | null; goalIds: string[] }>(`/api/projects/${id}/source`, { credentials: 'include' })
  ])
  if (dashboard.status === 'fulfilled') applyDashboard(dashboard.value)
  if (marker.status === 'fulfilled') {
    markers.value = marker.value.items
    if (dashboard.status !== 'fulfilled') visibilityTop10.value = marker.value.visibilityTop10
  }
  if (source.status === 'fulfilled') {
    sourceForm.metrikaCounter = source.value.metrikaCounter ?? ''
    sourceForm.goalIds = source.value.goalIds.join(', ')
  }
}

async function saveSource() {
  sourceSaving.value = true
  try {
    const goalIds = sourceForm.goalIds.split(/[,;\s]+/).map(item => item.trim()).filter(Boolean)
    const saved = await $fetch<{ metrikaCounter: string | null; goalIds: string[] }>(`/api/projects/${projectKey.value}/source`, {
      method: 'PUT',
      body: { metrikaCounter: sourceForm.metrikaCounter.trim(), goalIds },
      credentials: 'include'
    })
    sourceForm.metrikaCounter = saved.metrikaCounter ?? ''
    sourceForm.goalIds = saved.goalIds.join(', ')
    notify('Параметры источника сохранены')
    await loadAnalytics()
  } catch (error: unknown) {
    notify(apiErrorMessage(error), 'error')
  } finally {
    sourceSaving.value = false
  }
}

async function saveQueries() {
  queriesSaving.value = true
  try {
    const result = await $fetch<{ imported: number }>(`/api/projects/${projectKey.value}/queries/import`, {
      method: 'POST',
      body: { rawText: queriesText.value },
      credentials: 'include'
    })
    notify(`Список запросов сохранён: ${result.imported}`)
    await loadAnalytics()
  } catch (error: unknown) {
    notify(apiErrorMessage(error), 'error')
  } finally {
    queriesSaving.value = false
  }
}

onMounted(async () => {
  void loadAnalytics()
  try {
    const row = await $fetch<{
      name: string
      domain: string | null
      startDate: string | null
      tasks: { id: string; title: string; plannedHours: number; status: string }[]
      plan: { targetTraffic: number; targetLeads: number } | null
    }>(`/api/projects/${projectKey.value}`, { credentials: 'include' })
    projectTitle.value = row.name
    projectSite.value = row.domain || projectSite.value
    if (row.startDate) projectStart.value = new Date(row.startDate).toLocaleDateString('ru-RU')
    liveTasks.value = row.tasks
    fresh.value = !KNOWN.has(projectKey.value)
    if (fresh.value && row.plan) {
      const traffic = kpis.value.find(item => item.key === 'traffic')
      const leads = kpis.value.find(item => item.key === 'leads')
      if (traffic) traffic.of = `из ${row.plan.targetTraffic.toLocaleString('ru-RU')}`
      if (leads) leads.of = `из ${row.plan.targetLeads.toLocaleString('ru-RU')}`
      const trafficPlan = metrics.value.series.traffic.plan
      const leadsPlan = metrics.value.series.leads.plan
      if (trafficPlan) metrics.value.series.traffic.plan = trafficPlan.map(() => row.plan!.targetTraffic)
      if (leadsPlan) metrics.value.series.leads.plan = leadsPlan.map(() => row.plan!.targetLeads)
    }
  } catch { /* карточка прототипа */ }
})

/* ---------- Табы ---------- */
const tab = ref('roadmap')
const tabOptions = computed(() => [
  { value: 'roadmap', label: 'Дорожная карта' },
  { value: 'month', label: 'План месяца' },
  { value: 'reports', label: 'Отчёты', disabled: !canAny('report.view', 'portal.view'), tip: TIP_TEAM },
  { value: 'sources', label: 'Источники', disabled: hasRole(['contractor']), tip: DENY_TIP }
])

/* ---------- Дорожная карта ---------- */
type RoadmapItem =
  | { kind: 'done'; title: string; date: string }
  | { kind: 'active'; title: string; month: string; date: string }
  | { kind: 'todo'; title: string }
interface Direction { name: string; status: { label: string; badge: string; dot: string }; progress: string; open?: boolean; items: RoadmapItem[] }
const IN_WORK = { label: 'В работе', badge: 'bg-blue-50 text-blue-700', dot: 'bg-blue-600' }
const PLANNED = { label: 'Запланирована', badge: 'bg-zinc-100 text-zinc-700', dot: 'bg-zinc-400' }
const ROADMAP: Direction[] = [
  { name: 'Аудит', status: IN_WORK, progress: '2 / 4 · 1 в плане', open: true, items: [
    { kind: 'done', title: 'Аудит поведенческих факторов', date: '12.05' },
    { kind: 'done', title: 'Аудит коммерческих факторов', date: '14.05' },
    { kind: 'active', title: 'Аудит технический', month: 'июнь', date: '14.06' },
    { kind: 'todo', title: 'Конкурентный анализ' }
  ] },
  { name: 'Семантика', status: IN_WORK, progress: '1 / 4 · 1 в плане', items: [
    { kind: 'done', title: 'Сбор маркеров', date: '20.05' },
    { kind: 'active', title: 'Сбор семантики', month: 'июнь', date: '22.06' },
    { kind: 'todo', title: 'Кластеризация' },
    { kind: 'todo', title: 'Распределение по страницам' }
  ] },
  { name: 'Внутренняя оптимизация', status: PLANNED, progress: '0 / 3 · 1 в плане', items: [
    { kind: 'todo', title: 'Оптимизация метаданных' },
    { kind: 'todo', title: 'Оптимизация текстов' },
    { kind: 'active', title: 'Перелинковка', month: 'июнь', date: '20.06' }
  ] },
  { name: 'Внешняя оптимизация', status: PLANNED, progress: '0 / 3 · 1 в плане', items: [
    { kind: 'todo', title: 'Поиск подходящих конкурентов' },
    { kind: 'todo', title: 'Сбор ссылочного профиля конкурентов' },
    { kind: 'active', title: 'Стратегия по наращиванию ссылок', month: 'июнь', date: '30.06' }
  ] }
]

/* ---------- План месяца ---------- */
interface Status { label: string; badge: string; dot: string }
const S_REVIEW: Status = { label: 'На проверке', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-600' }
const S_WORK: Status = { label: 'В работе', badge: 'bg-blue-50 text-blue-700', dot: 'bg-blue-600' }
const S_PLANNED: Status = { label: 'Запланирована', badge: 'bg-zinc-100 text-zinc-700', dot: 'bg-zinc-500' }
const S_CLIENT: Status = { label: 'Ждёт клиента', badge: 'bg-violet-50 text-violet-700', dot: 'bg-violet-600' }
interface MonthTask {
  title: string
  tags?: { label: string; cls: string }[]
  direction?: string
  executor: { id: string; name: string; initials: string }
  co?: { id: string; name: string; initials: string }
  status: Status
  statusNote?: string
  due: string
}
const PETROV = { id: 'petrov', name: 'А. Петров', initials: 'АП' }
const KIM = { id: 'kim', name: 'М. Ким', initials: 'МК' }
const SIDOROV = { id: 'sidorov', name: 'И. Сидоров', initials: 'ИС' }
const MONTH_TASKS: MonthTask[] = [
  { title: 'Canonical для фильтров', direction: 'Аудит', executor: PETROV, status: S_REVIEW, statusNote: '1 дн.', due: '17.06' },
  { title: 'Проверить индексацию в GSC', tags: [{ label: 'Высокий', cls: 'bg-red-50 text-red-700' }, { label: '5 подзадач', cls: 'bg-zinc-100 text-zinc-600' }], direction: 'Аудит', executor: KIM, status: S_REVIEW, statusNote: '2 дн.', due: '18.06' },
  { title: 'Статья «Как выбрать холодильник»', tags: [{ label: 'На доработке', cls: 'bg-orange-50 text-orange-700' }], direction: 'Текстовая', executor: KIM, status: S_WORK, due: '20.06' },
  { title: 'Чек-лист аудита для шаблона', direction: 'Аудит', executor: PETROV, status: S_WORK, due: '21.06' },
  { title: 'Сбор семантики', direction: 'Семантика', executor: SIDOROV, co: KIM, status: S_WORK, due: '22.06' },
  { title: 'Перелинковка в карточках', direction: 'Внутренняя', executor: PETROV, status: S_PLANNED, due: '24.06' },
  { title: 'Кластеризация запросов', direction: 'Семантика', executor: SIDOROV, status: S_PLANNED, due: '27.06' },
  { title: 'Стратегия по наращиванию ссылок', direction: 'Внешняя', executor: { id: 'lebedev', name: 'П. Лебедев', initials: 'ПЛ' }, co: PETROV, status: S_WORK, due: '30.06' },
  { title: 'Доступы к GSC и Метрике', executor: { id: 'dronov', name: 'И. Дронов', initials: 'ИД' }, status: S_CLIENT, statusNote: 'ждём 6 дн.', due: '—' },
  { title: 'Тексты категорий на согласование', direction: 'Текстовая', executor: KIM, status: S_CLIENT, statusNote: 'ждём 3 дн.', due: '—' }
]
const MONTH_IN = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
const MONTH_SUB: Record<string, string> = {
  '2025-05': '12 задач · все приняты · месяц закрыт',
  '2025-07': 'План ещё не собран',
  '2025-08': 'План ещё не собран'
}
const month = ref('2025-06')
const monthTitle = computed(() => 'Задачи на ' + MONTH_IN[Number(month.value.split('-')[1]) - 1])
const monthSub = computed(() => MONTH_SUB[month.value] ?? '10 задач · 2 на проверке · 2 ждут клиента')

/* ---------- Источники ---------- */
type IntStatus = 'connected' | 'expired' | 'off'
const integrations = ref<Record<'yandex' | 'google' | 'callibri', IntStatus>>({ yandex: 'connected', google: 'expired', callibri: 'off' })
function readIntegrations() {
  try {
    const raw = JSON.parse(localStorage.getItem('seo_company_integrations') || 'null') || {}
    integrations.value = {
      yandex: raw.yandex?.status ?? 'connected',
      google: raw.google?.status ?? 'expired',
      callibri: raw.callibri?.status ?? 'off'
    }
  } catch { /* ignore */ }
}
onMounted(readIntegrations)
const yandexOn = computed(() => integrations.value.yandex === 'connected')
const callibriOn = computed(() => integrations.value.callibri === 'connected')
const gscSource = computed(() => integrations.value.google === 'connected' ? 'GSC · holod-shop.ru' : integrations.value.google === 'expired' ? 'GSC · токен истёк' : 'GSC · не подключён')

interface SourceRow { metric: string; source: string; value: string; updated: string; loading?: boolean; isNew?: boolean; gsc?: boolean; callibri?: boolean; synced?: boolean }
const seoRows = ref<SourceRow[]>([
  { metric: 'Трафик', source: 'Метрика · счётчик 94512367', value: '24 380', updated: 'сегодня 04:15', synced: true },
  { metric: 'Топ-10', source: 'Вебмастер · holod-shop.ru', value: '148', updated: 'вчера 22:15' },
  { metric: 'Показы', source: 'GSC · holod-shop.ru', value: '12 400', updated: 'сегодня 05:00', gsc: true }
])
const clientRows = ref<SourceRow[]>([
  { metric: 'Лиды из звонков', source: 'Callibri · holod-shop', value: '87', updated: 'сегодня 06:00', callibri: true }
])
const SOURCE_METRIC: Record<SourceConnected['type'], string> = { metrika: 'Трафик и цели', webmaster: 'Позиции и индексация', gsc: 'Показы и клики', callibri: 'Звонки и заявки' }
function onSource(s: SourceConnected) {
  const rows = s.type === 'callibri' ? clientRows : seoRows
  rows.value.push({ metric: SOURCE_METRIC[s.type], source: `${s.name} · ${s.id}`, value: '', updated: 'только что', loading: true, isNew: true })
}

const syncing = ref(false)
const lastExport = ref('сегодня в 04:15')
function sync() {
  if (syncing.value) return
  syncing.value = true
  setTimeout(() => {
    syncing.value = false
    seoRows.value.forEach(r => { if (r.synced) r.updated = 'только что' })
    lastExport.value = 'только что'
    notify('Данные за май успешно обновлены из Яндекс.Метрики')
  }, 900)
}

/* ---------- Команда ---------- */
const initials = (name: string) => name.split(' ').map(s => s[0]).join('')
const team = ref<TeamMember[]>([
  { id: 'sidorov', name: 'Иван Сидоров', initials: 'ИС', note: 'Методология и приёмка', role: 'Рук. SEO', tone: 'bg-blue-50 text-blue-700', avatar: 'bg-zinc-900 text-white' },
  { id: 'morozov', name: 'Никита Морозов', initials: 'НМ', note: 'Клиент, отчёты, коллтрекинг', role: 'Менеджер', tone: 'bg-amber-50 text-amber-700', avatar: 'bg-zinc-900 text-white' },
  { id: 'petrov', name: 'Алексей Петров', initials: 'АП', note: 'Технический SEO', role: 'SEO-специалист', tone: 'bg-emerald-50 text-emerald-700', avatar: 'bg-zinc-900 text-white' },
  { id: 'kim', name: 'Мария Ким', initials: 'МК', note: 'Тексты · доступ до 30.06', role: 'Подрядчик', tone: 'bg-zinc-100 text-zinc-700', avatar: 'bg-zinc-200 text-zinc-700' }
])
const teamRow = (person: TeamPerson, note: string, role: string): TeamMember => ({
  id: person.id, name: person.name, initials: initials(person.name), note, role,
  tone: ROLE_TONE[role] ?? 'bg-zinc-100 text-zinc-700', avatar: 'bg-zinc-900 text-white', isNew: true
})

const teamAddOpen = ref(false)
function onTeamAdded({ person, role }: { person: TeamPerson; role: ProjectRole }) {
  team.value.push(teamRow(person, role.name, role.name))
}

const teamRoleOpen = ref(false)
const roleMember = ref<TeamMember | null>(null)
function openRole(m: TeamMember) {
  roleMember.value = m
  teamRoleOpen.value = true
}
function onRoleSaved(role: ProjectRole) {
  if (!roleMember.value) return
  roleMember.value.role = role.short
  roleMember.value.tone = role.tone
  roleMember.value = null
}

async function removeMember(m: TeamMember) {
  if (await confirm({
    title: 'Удалить сотрудника из команды проекта?',
    text: 'Сотрудник потеряет доступ к задачам и отчётам этого проекта.',
    toast: 'Сотрудник удалён из команды проекта'
  })) team.value = team.value.filter(x => x !== m)
}

const transferOpen = ref(false)
function onTransferred({ person }: { person: TeamPerson }) {
  const row = teamRow(person, 'Ответственный SEO · принял проект', 'Руководитель SEO')
  const i = team.value.findIndex(m => m.name.includes('Алексей Петров'))
  if (i !== -1) team.value.splice(i, 1, row)
  else team.value.unshift(row)
}

/* ---------- Действия проекта ---------- */
async function archive() {
  await confirm({
    title: 'Отправить проект в архив?',
    text: 'Проект уйдёт из активных. Задачи, отчёты и часы сохранятся — вернуть можно из архива.',
    ok: 'В архив',
    toast: 'Проект отправлен в архив'
  })
}
async function remove() {
  await confirm({
    title: 'Удалить проект «Холод»?',
    text: 'Удалятся дорожная карта, планы месяцев, задачи и отчёты проекта. Действие нельзя отменить.',
    toast: 'Проект удалён'
  })
}

const editOpen = ref(false)
function onUpdated(p: { kpis: MetricKey[] }) {
  if (p.kpis[0]) metric.value = p.kpis[0]
}
const sourceOpen = ref(false)
const roadmapEditOpen = ref(false)
const templateOpen = ref(false)
const workOpen = ref(false)

const canDelete = computed(() => hasRole(['owner']) && can('project.delete'))
const canBrief = computed(() => hasRole(['owner', 'seo_head', 'mgr_head', 'pm', 'employee']))
const canSources = computed(() => can('integrations.manage'))

const PILL = 'px-3.5 py-1.5 rounded-full bg-white border border-zinc-200 text-sm font-medium hover:bg-zinc-50 transition disabled:opacity-50 disabled:cursor-not-allowed'
const TAB_GHOST = 'h-8 lg:h-9 px-3.5 lg:px-4 rounded-full bg-white border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition shrink-0 disabled:opacity-50 disabled:cursor-not-allowed'
const TD = 'md:px-3 md:py-3 lg:py-4 text-sm min-w-0 before:block before:text-[11px] before:text-zinc-500 before:mb-0.5 before:content-[attr(data-label)] md:before:hidden'
const TD_END = 'md:px-4 lg:px-6 md:py-3 lg:py-4 text-sm min-w-0 before:block before:text-[11px] before:text-zinc-500 before:mb-0.5 before:content-[attr(data-label)] md:before:hidden'
const TH = 'text-xs font-medium text-zinc-500 whitespace-nowrap py-3'
const ROW = 'hover:bg-zinc-50/50 transition grid grid-cols-2 gap-x-4 gap-y-3 p-4 md:p-0 md:table-row'
const TAG = 'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap'
const CHECK = 'w-4 h-4 rounded-full bg-zinc-900 flex items-center justify-center shrink-0'
</script>

<template>
  <PageSplit :title="projectTitle" :back="{ to: '/projects', label: 'Проекты' }" :crumbs="crumbs">
    <template #actions>
      <AccessGate :allowed="can('project.update')" :tip="TIP_TEAM">
        <UButton color="white" :disabled="!can('project.update')" class="gap-1.5 shrink-0" @click="editOpen = true">
          <svg class="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          <span class="sm:hidden">Настройки</span><span class="hidden sm:inline">Настройки проекта</span>
        </UButton>
      </AccessGate>
    </template>

    <template #top>
      <div>
        <h2 class="text-2xl lg:text-3xl font-semibold tracking-tight">{{ projectTitle }}</h2>
        <p class="text-sm text-zinc-500 mt-1">{{ projectSite }} · Старт {{ projectStart }}</p>
        <ul v-if="fresh && liveTasks.length" class="mt-4 divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white">
          <li v-for="task in liveTasks" :key="task.id" class="px-4 py-3 flex items-center justify-between gap-3">
            <NuxtLink :to="`/tasks/${task.id}`" class="text-sm font-medium hover:underline truncate">{{ task.title }}</NuxtLink>
            <span class="text-xs text-zinc-500 shrink-0 tabular-nums">{{ task.plannedHours }} ч · {{ task.status === 'PLANNED' ? 'бэклог' : task.status }}</span>
          </li>
        </ul>
        <div class="flex flex-wrap gap-2 mt-3">
          <NuxtLink to="/audit" class="px-3.5 py-1.5 rounded-full bg-white border border-zinc-200 text-sm font-medium hover:bg-zinc-50 transition">ИИ-аудит</NuxtLink>
          <AccessGate :allowed="canBrief" :tip="TIP_TEAM">
            <NuxtLink
              to="/brief?client=holod"
              class="h-8 lg:h-9 px-3.5 lg:px-4 rounded-full bg-white border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition inline-flex items-center justify-center shrink-0"
              :class="!canBrief && 'opacity-50'"
              :aria-disabled="!canBrief || undefined"
              :tabindex="canBrief ? undefined : -1"
            >Бриф проекта</NuxtLink>
          </AccessGate>
          <AccessGate :allowed="can('project.assign_team')" :tip="TIP_TEAM">
            <button type="button" :disabled="!can('project.assign_team')" :class="PILL" @click="transferOpen = true">Передать проект</button>
          </AccessGate>
          <AccessGate :allowed="can('project.archive')" :tip="TIP_TEAM">
            <button type="button" :disabled="!can('project.archive')" :class="PILL" @click="archive">В архив</button>
          </AccessGate>
          <AccessGate :allowed="canDelete" tip="Удаление проекта доступно только владельцу компании">
            <button
              type="button"
              :disabled="!canDelete"
              data-deny-tip="Удаление проекта доступно только владельцу компании"
              class="px-3.5 py-1.5 rounded-full bg-white border border-zinc-200 text-sm font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              @click="remove"
            >Удалить</button>
          </AccessGate>
        </div>
      </div>

      <section class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 w-full">
        <div
          v-for="k in kpis"
          :key="k.label"
          class="bg-white rounded-2xl shadow-card p-3 sm:p-4 flex flex-col justify-between min-w-0"
          :class="k.wide && 'col-span-2 md:col-span-1 xl:col-span-1'"
        >
          <div class="text-xs font-medium text-zinc-500 truncate mb-1">{{ k.label }}</div>
          <div class="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1.5 min-w-0">
            <span class="text-lg sm:text-2xl font-bold tracking-tight text-ink tabular-nums leading-tight">{{ k.value }}</span>
            <span class="text-[11px] sm:text-xs text-zinc-400 tabular-nums">{{ k.of }}</span>
          </div>
          <div class="mt-2 h-1.5 bg-zinc-100 rounded-full overflow-hidden w-full">
            <div class="h-full rounded-full" :class="[k.bar, k.width]" :style="k.style" />
          </div>
          <div class="text-xs font-medium tabular-nums mt-1" :class="k.tone">{{ k.note }}</div>
        </div>
      </section>

      <section
        id="analytics"
        ref="analytics"
        class="w-full bg-white rounded-2xl shadow-card p-4 lg:p-6 scroll-mt-20 transition-shadow duration-700"
        :class="highlight && 'ring-4 ring-accent/20'"
      >
        <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 class="text-sm font-semibold tracking-tight">Динамика проекта</h3>
            <p class="text-xs text-zinc-500 mt-0.5">{{ chartCaption }}</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <UiSegmented v-model="metric" :options="metricOptions" size="md" aria-label="Показатель" />
            <AccessGate :allowed="can('project.update')" :tip="TIP_TEAM">
              <UButton :disabled="!can('project.update')" class="whitespace-nowrap" @click="factOpen = true">Внести факт за месяц</UButton>
            </AccessGate>
          </div>
        </div>
        <UiMetricChart :months="metrics.months" :series="metrics.series" :metric="metric" />
      </section>

      <section class="w-full bg-white rounded-2xl shadow-card p-4 lg:p-5">
        <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
          <h3 class="text-sm font-semibold tracking-tight">Маркерные запросы (ТОП)</h3>
          <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 tabular-nums">Видимость ядра: {{ visibilityLabel }} в ТОП-10</span>
        </div>
        <p v-if="!markers.length" class="text-sm text-zinc-500 mt-3">Маркерных запросов пока нет. Добавьте фразы во вкладке «Источники».</p>
        <ul v-else class="mt-1 divide-y divide-zinc-100">
          <li v-for="item in markers" :key="item.id" class="py-2.5 flex items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="text-sm font-medium truncate">{{ item.query }}</div>
              <div v-if="item.targetUrl" class="text-[11px] text-zinc-400 truncate">{{ item.targetUrl }}</div>
            </div>
            <span class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums" :class="positionBadge(item).cls">{{ positionBadge(item).text }}</span>
          </li>
        </ul>
      </section>

      <div class="w-full max-w-full bg-white rounded-2xl shadow-card overflow-hidden p-3 lg:p-3.5 flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
        <UiSegmented v-model="tab" :options="tabOptions" :hash="true" aria-label="Разделы проекта" class="min-w-0" />
        <div class="flex items-center gap-2 shrink-0 ml-auto">
          <div v-if="tab === 'roadmap'" class="flex items-center gap-2">
            <AccessGate :allowed="can('project.update')" :tip="TIP_TEAM">
              <button type="button" :disabled="!can('project.update')" :class="TAB_GHOST" @click="roadmapEditOpen = true">Редактировать карту</button>
            </AccessGate>
            <AccessGate :allowed="can('project.update')" :tip="TIP_TEAM">
              <UButton :disabled="!can('project.update')" class="shrink-0" @click="workOpen = true">+ Работа</UButton>
            </AccessGate>
          </div>
          <div v-else-if="tab === 'month'" class="flex items-center gap-2">
            <AccessGate :allowed="can('project.update')" :tip="TIP_TEAM">
              <button type="button" :disabled="!can('project.update')" :class="TAB_GHOST" @click="templateOpen = true">Загрузить шаблон</button>
            </AccessGate>
            <AccessGate :allowed="can('task.create')" :tip="TIP_TEAM">
              <UButton to="/tasks/new" :disabled="!can('task.create')" class="shrink-0">+ Задача</UButton>
            </AccessGate>
          </div>
          <div v-else-if="tab === 'reports'" class="flex items-center gap-2">
            <AccessGate :allowed="can('report.draft')" :tip="TIP_TEAM">
              <UButton to="/reports/2025-06" :disabled="!can('report.draft')" class="shrink-0">+ Отчёт</UButton>
            </AccessGate>
          </div>
          <div v-else-if="tab === 'sources'" class="flex items-center gap-2">
            <AccessGate :allowed="canSources" :tip="TIP_SYSTEM">
              <UButton :disabled="!canSources" class="shrink-0" @click="sourceOpen = true">+ Источник</UButton>
            </AccessGate>
          </div>
        </div>
      </div>
    </template>

    <!-- ДОРОЖНАЯ КАРТА -->
    <div v-show="tab === 'roadmap'" class="mt-0 pt-0 space-y-6">
      <section class="bg-white rounded-2xl shadow-card overflow-hidden">
        <div class="px-4 lg:px-6 py-4 flex items-center justify-between">
          <h3 class="text-sm font-semibold tracking-tight">Дорожная карта</h3>
        </div>
        <div class="border-t border-zinc-100 divide-y divide-zinc-100">
          <details v-for="d in ROADMAP" :key="d.name" :open="d.open" class="group">
            <summary class="px-4 lg:px-6 py-4 flex items-center justify-between cursor-pointer list-none hover:bg-zinc-50/50 transition gap-3">
              <div class="flex items-center gap-3 lg:gap-4 min-w-0">
                <svg class="w-3 h-3 text-zinc-500 transition-transform group-open:rotate-90 shrink-0" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
                <span class="text-sm font-medium truncate">{{ d.name }}</span>
                <span class="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium shrink-0" :class="d.status.badge">
                  <span class="w-1.5 h-1.5 rounded-full" :class="d.status.dot" />{{ d.status.label }}
                </span>
              </div>
              <div class="text-xs text-zinc-500 tabular-nums shrink-0">{{ d.progress }}</div>
            </summary>
            <ul class="px-4 lg:px-6 pb-4 border-t border-zinc-100 pt-3 divide-y divide-zinc-50">
              <li v-for="it in d.items" :key="it.title" class="flex items-center justify-between py-2.5 pl-6 lg:pl-8 text-sm gap-2">
                <template v-if="it.kind === 'done'">
                  <div class="flex items-center gap-3 min-w-0">
                    <span :class="CHECK">
                      <svg class="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none"><path d="M2.5 6l2.5 2.5L9.5 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
                    </span>
                    <span class="text-zinc-500 line-through truncate">{{ it.title }}</span>
                  </div>
                  <span class="text-xs text-zinc-500 tabular-nums shrink-0">{{ it.date }}</span>
                </template>
                <template v-else-if="it.kind === 'active'">
                  <div class="flex items-center gap-3 min-w-0">
                    <span class="w-4 h-4 rounded-full border-2 border-blue-600 shrink-0" />
                    <NuxtLink to="/tasks/1" class="font-medium hover:underline truncate">{{ it.title }}</NuxtLink>
                    <span class="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 shrink-0">
                      <span class="w-1 h-1 rounded-full bg-blue-600" />{{ it.month }}
                    </span>
                  </div>
                  <div class="flex items-center gap-3 shrink-0">
                    <span class="text-xs text-zinc-500 tabular-nums">{{ it.date }}</span>
                    <NuxtLink to="/tasks/1" class="text-xs text-zinc-500 hover:text-zinc-900 transition hidden sm:inline">Задача →</NuxtLink>
                  </div>
                </template>
                <template v-else>
                  <div class="flex items-center gap-3 min-w-0">
                    <span class="w-4 h-4 rounded-full border border-zinc-300 shrink-0" />
                    <span class="text-zinc-500 truncate">{{ it.title }}</span>
                  </div>
                  <button type="button" class="text-xs text-zinc-500 hover:text-zinc-900 transition shrink-0" @click="workOpen = true">+ Запланировать</button>
                </template>
              </li>
            </ul>
          </details>
        </div>
      </section>
    </div>

    <!-- ПЛАН МЕСЯЦА -->
    <div v-show="tab === 'month'" class="mt-0 pt-0 space-y-6">
      <section class="bg-white rounded-2xl shadow-card overflow-hidden">
        <div class="px-4 lg:px-6 py-4 flex items-center justify-between gap-3">
          <div class="min-w-0">
            <h3 class="text-sm font-semibold tracking-tight">{{ monthTitle }}</h3>
            <p class="text-xs text-zinc-500 mt-0.5">{{ monthSub }}</p>
          </div>
          <UiMonthNav v-model="month" min="2025-05" max="2025-08" />
        </div>

        <div v-if="month === '2025-05'" class="border-t border-zinc-100 px-4 lg:px-6 py-10 text-center">
          <div class="text-sm font-medium">Май закрыт</div>
          <div class="text-xs text-zinc-500 mt-1">12 задач принято · 94 ч из 96 · отчёт отправлен клиенту 03.06</div>
          <NuxtLink to="/reports/2025-05" class="inline-flex mt-4 px-3.5 py-1.5 rounded-full bg-white border border-zinc-200 text-sm font-medium hover:bg-zinc-50 transition">Открыть отчёт за май</NuxtLink>
        </div>
        <div v-else-if="month === '2025-07'" class="border-t border-zinc-100 px-4 lg:px-6 py-10 text-center">
          <div class="text-sm font-medium">План на июль ещё не собран</div>
          <div class="text-xs text-zinc-500 mt-1">По дорожной карте на месяц 3 — 7 работ, ≈ 64 ч</div>
          <UButton v-if="can('project.update')" class="mt-4" @click="templateOpen = true">Собрать из шаблона</UButton>
        </div>
        <div v-else-if="month === '2025-08'" class="border-t border-zinc-100 px-4 lg:px-6 py-10 text-center">
          <div class="text-sm font-medium">Август — после плана июля</div>
          <div class="text-xs text-zinc-500 mt-1">Соберите сначала план на июль, затем на август</div>
        </div>
        <div v-else class="overflow-x-auto border-t border-zinc-100">
          <table class="w-full block md:table">
            <thead class="hidden md:table-header-group">
              <tr class="border-b border-zinc-100">
                <th class="text-left px-4 lg:px-6" :class="TH">Задача</th>
                <th class="text-left px-3" :class="TH">Исполнитель</th>
                <th class="text-left px-3" :class="TH">Статус</th>
                <th class="text-right px-4 lg:px-6" :class="TH">Срок</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100 block md:table-row-group">
              <tr v-for="t in MONTH_TASKS" :key="t.title" :class="ROW">
                <td class="md:px-4 lg:px-6 md:py-3 lg:py-4 col-span-2 md:col-span-1">
                  <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <NuxtLink to="/tasks/1" class="text-base font-medium hover:underline">{{ t.title }}</NuxtLink>
                    <span v-for="tag in t.tags" :key="tag.label" :class="[TAG, tag.cls]">{{ tag.label }}</span>
                    <span v-if="t.co && t.co.id === user.id" :class="TAG" class="bg-blue-50 text-blue-700">соисполнитель</span>
                  </div>
                  <div v-if="t.direction" class="text-xs text-zinc-500 mt-0.5">{{ t.direction }}</div>
                </td>
                <td data-label="Исполнитель" :class="TD">
                  <NuxtLink :to="`/tasks?executor=${t.executor.id}`" class="flex items-center gap-2 hover:underline">
                    <span class="flex -space-x-2">
                      <span class="w-7 h-7 rounded-full bg-zinc-900 text-white text-[10px] font-semibold flex items-center justify-center shrink-0 ring-2 ring-white">{{ t.executor.initials }}</span>
                      <span v-if="t.co" :title="`Соисполнитель: ${t.co.name}`" class="w-7 h-7 rounded-full bg-zinc-200 text-zinc-700 text-[10px] font-semibold flex items-center justify-center shrink-0 ring-2 ring-white">{{ t.co.initials }}</span>
                    </span>
                    <span class="text-sm whitespace-nowrap">{{ t.executor.name }}</span>
                    <span v-if="t.co" class="text-xs text-zinc-500 tabular-nums">+1</span>
                  </NuxtLink>
                </td>
                <td data-label="Статус" :class="TD">
                  <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" :class="t.status.badge"><span class="w-1.5 h-1.5 rounded-full" :class="t.status.dot" />{{ t.status.label }}</span>
                    <span v-if="t.statusNote" class="text-xs text-zinc-500 tabular-nums">{{ t.statusNote }}</span>
                  </div>
                </td>
                <td data-label="Срок" :class="TD_END" class="md:text-right whitespace-nowrap tabular-nums text-zinc-500">{{ t.due }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- ОТЧЁТЫ -->
    <div v-show="tab === 'reports'" class="mt-0 pt-0 space-y-6">
      <section class="bg-white rounded-2xl shadow-card overflow-hidden">
        <div class="px-4 lg:px-6 py-4">
          <h3 class="text-sm font-semibold tracking-tight">Отчёты клиенту</h3>
        </div>
        <ul class="divide-y divide-zinc-100 border-t border-zinc-100">
          <li>
            <NuxtLink to="/reports/2025-06" class="px-4 lg:px-6 py-4 flex items-center justify-between gap-3 hover:bg-zinc-50 transition">
              <div class="min-w-0">
                <div class="text-sm font-medium">Отчёт за июнь 2025</div>
                <div class="text-xs text-zinc-500 mt-0.5">Составляет А. Петров · создан автоматически 01.06</div>
              </div>
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-zinc-500" />Черновик</span>
            </NuxtLink>
          </li>
          <li>
            <NuxtLink to="/reports/2025-05" class="px-4 lg:px-6 py-4 flex items-center justify-between gap-3 hover:bg-zinc-50 transition">
              <div class="min-w-0">
                <div class="text-sm font-medium">Отчёт за май 2025</div>
                <div class="text-xs text-zinc-500 mt-0.5">Отправлен 03.06 · Н. Морозов · клиент открыл 04.06</div>
              </div>
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-emerald-600" />Отправлен</span>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </div>

    <!-- ИСТОЧНИКИ -->
    <div v-show="tab === 'sources'" class="mt-0 pt-0 space-y-6">
      <section class="bg-white rounded-2xl shadow-card p-4 lg:p-6 space-y-4">
        <div>
          <h3 class="text-sm font-semibold tracking-tight">Привязка Яндекс.Метрики</h3>
          <p class="text-xs text-zinc-500 mt-0.5">Без токена интеграции график остаётся на ручных фактах.</p>
        </div>
        <div class="grid sm:grid-cols-2 gap-3">
          <label class="block">
            <span class="block text-xs font-medium text-zinc-500 mb-1.5">Номер счётчика</span>
            <input v-model="sourceForm.metrikaCounter" type="text" inputmode="numeric" placeholder="94512367" class="w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-accent/30">
          </label>
          <label class="block">
            <span class="block text-xs font-medium text-zinc-500 mb-1.5">Номера целей через запятую</span>
            <input v-model="sourceForm.goalIds" type="text" placeholder="31245612, 31245615" class="w-full h-10 px-3 rounded-xl border border-zinc-200 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-accent/30">
          </label>
        </div>
        <UButton :loading="sourceSaving" :disabled="sourceSaving" @click="saveSource">Сохранить параметры источника</UButton>
      </section>

      <section class="bg-white rounded-2xl shadow-card p-4 lg:p-6 space-y-4">
        <div>
          <h3 class="text-sm font-semibold tracking-tight">Семантическое ядро проекта</h3>
          <p class="text-xs text-zinc-500 mt-0.5">Первые 10 фраз становятся маркерными.</p>
        </div>
        <textarea v-model="queriesText" rows="6" class="w-full px-3 py-2 rounded-xl border border-zinc-200 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-accent/30" :placeholder="queryPlaceholder" />
        <UButton :loading="queriesSaving" :disabled="queriesSaving" @click="saveQueries">Сохранить список запросов</UButton>
      </section>

      <div v-if="!yandexOn" class="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-4 sm:px-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div class="min-w-0 flex-1">
          <div class="text-sm font-medium text-amber-950">Автоматический сбор данных не настроен</div>
          <p class="text-xs text-amber-900/80 mt-1 leading-relaxed">Вы можете вносить фактические показатели вручную в разделе аналитики проекта.</p>
        </div>
        <AccessGate :allowed="can('project.update')" :tip="TIP_TEAM">
          <button type="button" :disabled="!can('project.update')" class="shrink-0 h-9 px-4 rounded-full bg-white border border-amber-200 text-sm font-medium text-amber-950 hover:bg-amber-100/60 transition inline-flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed" @click="factOpen = true">Внести факт за месяц</button>
        </AccessGate>
      </div>

      <section v-if="yandexOn" class="bg-white rounded-2xl shadow-card overflow-hidden">
        <div class="px-4 lg:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <div class="flex items-center gap-3 flex-1 min-w-0">
            <span class="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
            <div class="min-w-0">
              <h3 class="text-sm font-semibold tracking-tight">Привязанные счётчики</h3>
              <p class="text-xs text-zinc-500 mt-0.5">Источники данных проекта «Холод»</p>
            </div>
          </div>
          <AccessGate :allowed="can('project.sources.link')" :tip="TIP_SYSTEM">
            <button type="button" :disabled="!can('project.sources.link') || syncing" class="shrink-0 h-9 px-3.5 rounded-full bg-white border border-zinc-200 text-xs font-medium hover:bg-zinc-50 transition inline-flex items-center gap-1.5 disabled:cursor-not-allowed" :class="!can('project.sources.link') && 'opacity-50'" @click="sync">
              <svg class="w-3.5 h-3.5" :class="syncing && 'animate-spin'" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Синхронизировать данные
            </button>
          </AccessGate>
        </div>
        <ul class="border-t border-zinc-100 divide-y divide-zinc-100">
          <li class="px-4 lg:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold shrink-0">Я</span>
            <div class="min-w-0 flex-1">
              <div class="text-sm font-medium">Яндекс.Метрика</div>
              <div class="text-xs text-zinc-500 mt-0.5 tabular-nums">ID счётчика <span class="text-zinc-800 font-medium">{{ sourceForm.metrikaCounter || 'не указан' }}</span> · последняя выгрузка: {{ lastExport }}</div>
            </div>
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />Активен</span>
          </li>
          <li class="px-4 lg:px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <span class="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold shrink-0">В</span>
            <div class="min-w-0 flex-1">
              <div class="text-sm font-medium">Яндекс.Вебмастер</div>
              <div class="text-xs text-zinc-500 mt-0.5">Сайт holod-shop.ru · индексация и запросы</div>
            </div>
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />Активен</span>
          </li>
        </ul>
      </section>

      <section
        v-for="block in [
          { key: 'seo', dot: 'bg-blue-600', title: 'SEO-инструменты', sub: 'Метрика, Вебмастер, GSC', rows: seoRows },
          { key: 'client', dot: 'bg-amber-600', title: 'Клиентские метрики', sub: 'Коллтрекинг и CRM', rows: clientRows }
        ]"
        :key="block.key"
        class="bg-white rounded-2xl shadow-card overflow-hidden"
      >
        <div class="px-4 lg:px-6 py-4 flex items-center gap-3">
          <span class="w-2 h-2 rounded-full shrink-0" :class="block.dot" />
          <div class="flex-1 min-w-0">
            <h3 class="text-sm font-semibold tracking-tight">{{ block.title }}</h3>
            <p class="text-xs text-zinc-500 mt-0.5">{{ block.sub }}</p>
          </div>
        </div>
        <div class="overflow-x-auto border-t border-zinc-100">
          <table class="w-full block md:table">
            <thead class="hidden md:table-header-group">
              <tr class="border-b border-zinc-100">
                <th class="text-left px-4 lg:px-6" :class="TH">Метрика</th>
                <th class="text-left px-3" :class="TH">Источник</th>
                <th class="text-right px-3" :class="TH">Значение</th>
                <th class="text-right px-4 lg:px-6" :class="TH">Обновлено</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100 block md:table-row-group">
              <template v-for="r in block.rows" :key="r.metric + r.source">
                <tr v-if="!r.callibri || callibriOn" :class="[ROW, r.isNew && 'bg-accent/5']">
                  <td class="md:px-4 lg:px-6 md:py-3 lg:py-4 text-sm font-medium col-span-2 md:col-span-1">{{ r.metric }}</td>
                  <td data-label="Источник" :class="TD" class="text-zinc-500">{{ r.gsc ? gscSource : r.source }}</td>
                  <td data-label="Значение" :class="TD" class="md:text-right tabular-nums">
                    <span v-if="r.loading" class="text-xs font-medium text-blue-700">загружается</span>
                    <template v-else>{{ r.value }}</template>
                  </td>
                  <td data-label="Обновлено" :class="TD_END" class="md:text-right text-zinc-500 tabular-nums whitespace-nowrap">{{ r.updated }}</td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div v-if="block.key === 'client' && !callibriOn" class="px-4 lg:px-6 py-5 text-sm text-zinc-500 border-t border-zinc-100">
          Callibri не подключён на уровне компании — лиды из звонков можно внести вручную через «Внести факт».
        </div>
      </section>
    </div>

    <template #aside>
      <section class="bg-white rounded-2xl shadow-card p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-sm font-semibold tracking-tight">Команда проекта</h3>
          <AccessGate :allowed="can('project.assign_team')" tip="Назначать команду проекта могут менеджер и руководство">
            <button type="button" :disabled="!can('project.assign_team')" data-deny-tip="Назначать команду проекта могут менеджер и руководство" class="text-xs text-zinc-500 hover:text-zinc-900 transition disabled:opacity-50 disabled:cursor-not-allowed" @click="teamAddOpen = true">+ Добавить</button>
          </AccessGate>
        </div>
        <ul class="divide-y divide-zinc-100 -mx-5 border-t border-zinc-100">
          <li v-for="(m, i) in team" :key="i" class="px-5 py-3 flex items-center gap-3" :class="m.isNew && 'bg-accent/5'">
            <span class="w-8 h-8 rounded-full text-[10px] font-semibold flex items-center justify-center shrink-0" :class="m.avatar">{{ m.initials }}</span>
            <div class="min-w-0 flex-1"><div class="text-sm font-medium">{{ m.name }}</div><div class="text-xs text-zinc-500">{{ m.note }}</div></div>
            <AccessGate :allowed="can('project.assign_team')" :tip="TIP_SYSTEM">
              <button type="button" :disabled="!can('project.assign_team')" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 hover:ring-2 hover:ring-accent/20 transition disabled:opacity-50 disabled:cursor-not-allowed" :class="m.tone" @click="openRole(m)">{{ m.role }}</button>
            </AccessGate>
            <AccessGate :allowed="can('project.assign_team')" tip="Убирать участников команды могут менеджер и руководство">
              <button type="button" :disabled="!can('project.assign_team')" data-deny-tip="Убирать участников команды могут менеджер и руководство" aria-label="Удалить из команды" class="h-7 w-7 rounded-full hover:bg-red-50 hover:text-red-600 text-zinc-400 flex items-center justify-center transition shrink-0 disabled:opacity-50 disabled:cursor-not-allowed" @click="removeMember(m)">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </AccessGate>
          </li>
        </ul>
      </section>

      <section v-if="can('finance.fee.view')" class="bg-white rounded-2xl shadow-card p-5">
        <h3 class="text-sm font-semibold tracking-tight mb-4">Финансы проекта</h3>
        <dl class="grid grid-cols-2 gap-x-4 gap-y-4 text-sm pt-4 border-t border-zinc-100">
          <div><dt class="text-xs text-zinc-500 mb-0.5">Чек в месяц</dt><dd class="font-medium tabular-nums">240 000 ₽</dd></div>
          <div><dt class="text-xs text-zinc-500 mb-0.5">Ставка</dt><dd class="font-medium tabular-nums">2 500 ₽/ч</dd></div>
          <div><dt class="text-xs text-zinc-500 mb-0.5">Себестоимость часов</dt><dd class="font-medium tabular-nums">136 000 ₽</dd></div>
          <div><dt class="text-xs text-zinc-500 mb-0.5">Маржа</dt><dd class="font-medium tabular-nums text-emerald-700">104 000 ₽ · 43%</dd></div>
        </dl>
      </section>
    </template>

    <ModalsProjectEdit v-model="editOpen" @updated="onUpdated" />
    <ModalsFact v-model="factOpen" :metrics="metrics" project="holod" @saved="onFact" />
    <ModalsSource v-model="sourceOpen" @connected="onSource" />
    <ModalsTeamAdd v-model="teamAddOpen" @added="onTeamAdded" />
    <ModalsTeamRole v-model="teamRoleOpen" :name="roleMember?.name" :current="roleMember?.role" @saved="onRoleSaved" />
    <ModalsTransfer v-model="transferOpen" @transferred="onTransferred" />
    <ProjectRoadmapEditModal v-model="roadmapEditOpen" />
    <ProjectTemplateModal v-model="templateOpen" />
    <ProjectWorkModal v-model="workOpen" />
  </PageSplit>
</template>
