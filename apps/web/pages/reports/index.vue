<script setup lang="ts">
// reports.html → Сетка 1 (Registry): статусы отчётов и экспорт, фильтры проект / год / месяц / поиск, реестр, автосоздание черновиков.
import ReportCreateModal from '~/components/reports/ReportCreateModal.vue'
import ReportSendModal from '~/components/reports/ReportSendModal.vue'

definePageMeta({ roles: ['owner', 'seo_head', 'mgr_head', 'pm', 'employee'] })
useHead({ title: 'Отчёты — SEO Control' })

const { can, canAny, user, seesWorkspace } = useRole()
const notify = useNotify()

type Status = 'draft' | 'review' | 'sent'
interface Report {
  id: string
  m: string
  p: string
  projectId: string
  name: string
  client: string
  clientEmail: string
  by: string
  status: Status
  rawStatus: string
  note?: string
  late?: boolean
  sent?: string
  sentTo?: string
  token: string
  title: string
}

interface ApiReport {
  id: string
  projectId: string
  projectSlug: string
  projectName: string
  clientName: string
  clientEmail: string
  month: string
  title: string
  status: string
  publicToken: string
  summaryText: string | null
  sentAt: string | null
  sentToEmail: string | null
  authorName: string
}

interface ApiProject {
  id: string
  name: string
}

const MONTH_NAME: Record<string, string> = { '01': 'Январь', '02': 'Февраль', '03': 'Март', '04': 'Апрель', '05': 'Май', '06': 'Июнь', '07': 'Июль', '08': 'Август', '09': 'Сентябрь', '10': 'Октябрь', '11': 'Ноябрь', '12': 'Декабрь' }

const reports = ref<Report[]>([])
const projects = ref<ApiProject[]>([])
const loaded = ref(false)
const sendOpen = ref(false)
const sendTarget = ref<Report | null>(null)

const BADGE: Record<Status, [string, string, string]> = {
  draft: ['bg-zinc-100 text-zinc-700', 'bg-zinc-400', 'Черновик'],
  review: ['bg-amber-50 text-amber-700', 'bg-amber-500', 'На согласовании'],
  sent: ['bg-emerald-50 text-emerald-700', 'bg-emerald-500', 'Отправлен клиенту']
}

// Тулбар: строка 1 — статус отчётов и экспорт, строка 2 — проект, год, месяц, поиск.
const view = ref('all')
const target = ref('')
const year = ref('2025')
const month = ref('05')
const q = ref('')

const TARGET_OPTIONS = computed(() => [
  { value: '', label: 'Все проекты и клиенты' },
  ...projects.value.map(project => ({ value: project.id, label: project.name }))
])
const YEAR_OPTIONS = [
  { value: 'all', label: 'Все годы' },
  { value: '2026', label: '2026' },
  { value: '2025', label: '2025' },
  { value: '2024', label: '2024' }
]
const MONTH_OPTIONS = [{ value: 'all', label: 'Все месяцы' }, ...MONTHS.map((label, i) => ({ value: String(i + 1).padStart(2, '0'), label }))]

const dirty = computed(() => year.value !== '2025' || month.value !== '05' || !!target.value || !!q.value.trim())
function resetFilters() {
  year.value = 'all'
  month.value = 'all'
  target.value = ''
  q.value = ''
  view.value = 'all'
}

function monthLabel(key: string) {
  const [y, m] = key.split('-')
  return `${MONTH_NAME[m!] || key} ${y}`
}

function shortDate(iso: string | null) {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}`
}

function uiStatus(status: string): Status {
  if (status === 'ON_REVIEW') return 'review'
  if (status === 'SENT' || status === 'APPROVED') return 'sent'
  return 'draft'
}

function mapReport(row: ApiReport): Report {
  const status = uiStatus(row.status)
  return {
    id: row.id,
    m: row.month,
    p: row.projectSlug,
    projectId: row.projectId,
    name: row.projectName,
    client: row.clientName,
    clientEmail: row.clientEmail,
    by: row.authorName,
    status,
    rawStatus: row.status,
    note: row.status === 'APPROVED' ? 'утверждён клиентом' : status === 'draft' ? 'черновик' : status === 'review' ? 'на согласовании' : undefined,
    sent: shortDate(row.sentAt),
    sentTo: row.sentToEmail || undefined,
    token: row.publicToken,
    title: row.title
  }
}

async function loadReports() {
  try {
    const [list, projectList] = await Promise.all([
      $fetch<ApiReport[]>('/api/reports', { credentials: 'include' }),
      $fetch<ApiProject[]>('/api/projects', { credentials: 'include' })
    ])
    reports.value = list.map(mapReport)
    projects.value = projectList
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  } finally {
    loaded.value = true
  }
}

onMounted(loadReports)

const inScope = (r: Report) => {
  if (!seesWorkspace() && !user.value.projects.includes(r.p)) return false
  const [ry, rm] = r.m.split('-')
  const needle = q.value.trim().toLowerCase()
  return (year.value === 'all' || ry === year.value) &&
    (month.value === 'all' || rm === month.value) &&
    (!target.value || target.value === r.projectId) &&
    (!needle || `${r.name} ${r.client}`.toLowerCase().includes(needle))
}
const scoped = computed(() => reports.value.filter(inScope))
const visible = computed(() => scoped.value.filter(r => view.value === 'all' || r.status === view.value))

const viewOptions = computed(() => ([
  { value: 'all', label: 'Все отчёты' },
  { value: 'draft', label: 'Черновики' },
  { value: 'review', label: 'На согласовании' },
  { value: 'sent', label: 'Отправлены клиенту' }
]).map(o => ({ ...o, count: o.value === 'all' ? scoped.value.length : scoped.value.filter(r => r.status === o.value).length })))

function copyLink(r: Report) {
  const url = `${window.location.origin}/public/reports/${r.token}`
  const done = () => notify('Ссылка скопирована', 'success')
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, () => notify(url, 'success'))
  else notify(url, 'success')
}

function sendReport(r: Report) {
  if (!can('report.publish')) return notify('Недостаточно прав: отправлять отчёты клиенту может менеджер проекта', 'error')
  sendTarget.value = r
  sendOpen.value = true
}

async function submitReport(r: Report) {
  if (!can('report.draft')) return notify('Недостаточно прав: составлять отчёты может сотрудник компании', 'error')
  try {
    await $fetch(`/api/reports/${r.id}/status`, {
      method: 'PUT',
      body: { status: 'ON_REVIEW' },
      credentials: 'include'
    })
    notify('Отчёт передан на согласование менеджеру', 'success')
    await loadReports()
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  }
}

function onCreated(monthKey: string) {
  const [y, m] = monthKey.split('-')
  if (y && m) {
    year.value = y
    month.value = m
  }
  loadReports()
}

function exportRegistry() {
  const n = visible.value.length
  const y = year.value
  const m = month.value
  const period = (y === 'all' && m === 'all') ? 'все периоды'
    : (y === 'all' ? (MONTH_NAME[m] || m) + ' · все годы'
      : (m === 'all' ? y + ' · все месяцы'
        : (MONTH_NAME[m] || m) + ' ' + y))
  notify('Реестр · ' + period + ' · выгружен в XLSX · ' + n + ' ' + plural(n, ['отчёт', 'отчёта', 'отчётов']), 'success')
}

const autoCreate = ref(true)
const createOpen = ref(false)

const TIP_COMPOSE = 'Составлять отчёты может сотрудник компании'
const TIP_SEND = 'Отправлять отчёты клиенту может менеджер проекта'
const TD = 'md:px-3 md:py-3 lg:py-4 text-sm min-w-0 before:block before:text-[11px] before:text-zinc-500 before:mb-0.5 before:content-[attr(data-label)] md:before:hidden'
const PILL = 'rounded-full h-8 px-3 text-xs font-medium'
</script>

<template>
  <PageRegistry title="Отчёты">
    <template #actions>
      <AccessGate :allowed="can('report.draft')" :tip="TIP_COMPOSE">
        <UButton :disabled="!can('report.draft')" :data-deny-tip="TIP_COMPOSE" @click="createOpen = true">
          <span class="sm:hidden">+ Создать</span><span class="hidden sm:inline">+ Создать отчёт</span>
        </UButton>
      </AccessGate>
    </template>

    <template #focus>
      <UiSegmented v-model="view" :options="viewOptions" aria-label="Статус отчётов">
        <template #option="{ option }">
          {{ option.label }}<span class="ml-1.5 tabular-nums opacity-60">{{ option.count }}</span>
        </template>
      </UiSegmented>
    </template>

    <template #view>
      <AccessGate :allowed="canAny('report.view', 'portal.view')">
        <UButton color="white" :disabled="!canAny('report.view', 'portal.view')" class="gap-1.5" @click="exportRegistry">
          <svg class="w-3.5 h-3.5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          <span>Экспорт реестра</span>
        </UButton>
      </AccessGate>
    </template>

    <template #filters>
      <USelect v-model="target" :options="TARGET_OPTIONS" size="xs" aria-label="Проект / Клиент" class="w-full sm:w-auto" />
      <div class="flex items-center gap-1.5 w-full sm:w-auto">
        <USelect v-model="year" :options="YEAR_OPTIONS" size="xs" aria-label="Год отчёта" class="flex-1 sm:flex-none" />
        <USelect v-model="month" :options="MONTH_OPTIONS" size="xs" aria-label="Месяц отчёта" class="flex-1 sm:flex-none" />
      </div>
      <UInput
        v-model="q"
        type="search"
        size="xs"
        placeholder="Поиск по проекту или клиенту..."
        aria-label="Поиск отчётов"
        icon="i-heroicons-magnifying-glass-20-solid"
        class="w-full sm:w-64 shrink-0 sm:ml-auto"
      />
      <UButton v-if="dirty" color="gray" variant="ghost" size="xs" class="bg-zinc-100 hover:bg-zinc-200 text-zinc-700" @click="resetFilters">Сбросить фильтры</UButton>
    </template>

    <section class="bg-white rounded-2xl shadow-card overflow-hidden">
      <div class="overflow-x-auto w-full">
        <table class="w-full block md:table">
          <thead class="hidden md:table-header-group">
            <tr class="border-b border-black/[0.04] text-[11px] font-medium text-zinc-400 uppercase tracking-wider bg-zinc-50/50">
              <th class="text-left py-3 px-4 lg:px-6">Проект и клиент</th>
              <th class="text-left py-3 px-4">Период и автор</th>
              <th class="text-left py-3 px-4">Статус отчёта</th>
              <th class="text-right py-3 px-4 lg:px-6">Действия</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-black/[0.04] block md:table-row-group">
            <tr
              v-for="r in visible"
              :key="r.id"
              class="hover:bg-zinc-50/50 transition grid grid-cols-2 gap-x-4 gap-y-3 p-4 md:p-0 md:table-row align-top"
            >
              <td data-label="Проект и клиент" class="md:px-4 lg:px-6 md:py-3 lg:py-4 col-span-2 md:col-span-1 min-w-0 before:block before:text-[11px] before:text-zinc-500 before:mb-0.5 before:content-[attr(data-label)] md:before:hidden">
                <NuxtLink :to="`/projects/${r.p}`" class="text-sm font-semibold text-zinc-900 hover:underline">{{ r.name }}</NuxtLink>
                <div class="text-xs text-zinc-400 mt-0.5">Клиент: {{ r.client || '—' }}</div>
              </td>
              <td data-label="Период и автор" :class="TD">
                <span class="text-sm font-medium text-zinc-800">{{ monthLabel(r.m) }}</span>
                <div class="text-xs text-zinc-400 mt-0.5">составил: {{ r.by }}</div>
              </td>
              <td data-label="Статус отчёта" :class="TD">
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" :class="BADGE[r.status][0]"><span class="w-1.5 h-1.5 rounded-full" :class="BADGE[r.status][1]" />{{ BADGE[r.status][2] }}</span>
                <div v-if="r.status === 'sent'" class="text-xs text-zinc-500 mt-0.5">отправлен {{ r.sent || '—' }}<template v-if="r.sentTo"> · {{ r.sentTo }}</template></div>
                <div v-else-if="r.note" class="text-xs mt-0.5" :class="r.late ? 'text-red-600' : 'text-zinc-500'">{{ r.note }}</div>
              </td>
              <td data-label="Действия" class="md:px-4 lg:px-6 md:py-3 lg:py-4 col-span-2 md:col-span-1 md:text-right before:block before:text-[11px] before:text-zinc-500 before:mb-0.5 before:content-[attr(data-label)] md:before:hidden">
                <div class="inline-flex items-center justify-end gap-2 flex-wrap">
                  <template v-if="r.status === 'sent'">
                    <UButton :to="`/public/reports/${r.token}`" target="_blank" color="gray" variant="ghost" :class="[PILL, 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200']">Веб-версия</UButton>
                  </template>
                  <template v-else-if="r.status === 'review'">
                    <UButton :to="`/reports/${r.m}`" color="white" :class="[PILL, 'border-zinc-200 text-zinc-700 shadow-none']">Проверить</UButton>
                    <AccessGate :allowed="can('report.publish')" :tip="TIP_SEND">
                      <UButton :disabled="!can('report.publish')" :data-deny-tip="TIP_SEND" @click="sendReport(r)">Отправить клиенту</UButton>
                    </AccessGate>
                  </template>
                  <template v-else>
                    <AccessGate :allowed="can('report.draft')" :tip="TIP_COMPOSE">
                      <UButton :to="can('report.draft') ? `/reports/${r.m}` : undefined" :disabled="!can('report.draft')" color="white" :class="[PILL, 'border-zinc-200 text-zinc-700 shadow-none']">Редактировать</UButton>
                    </AccessGate>
                    <AccessGate :allowed="can('report.draft')" :tip="TIP_COMPOSE">
                      <UButton :disabled="!can('report.draft')" color="black" :class="PILL" @click="submitReport(r)">На согласование</UButton>
                    </AccessGate>
                  </template>
                  <UButton
                    color="white"
                    variant="ghost"
                    square
                    size="xs"
                    title="Скопировать ссылку для клиента"
                    aria-label="Скопировать ссылку для клиента"
                    class="rounded-full border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
                    @click="copyLink(r)"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14a4 4 0 005.66 0l3-3a4 4 0 00-5.66-5.66l-1 1M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 005.66 5.66l1-1" /></svg>
                  </UButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="loaded && !visible.length" class="px-4 lg:px-6 py-14 text-center">
        <div class="mx-auto w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" /></svg>
        </div>
        <h3 class="text-sm font-semibold text-zinc-900">Ничего не найдено</h3>
        <p class="text-xs text-zinc-500 mt-1">Попробуйте изменить параметры поиска или сбросить фильтры</p>
        <UButton color="gray" variant="ghost" size="xs" class="mt-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700" @click="resetFilters">Сбросить фильтры</UButton>
      </div>
    </section>

    <section class="bg-white rounded-2xl shadow-card p-4 lg:p-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="text-sm font-semibold tracking-tight">Автоматическое создание черновиков</h3>
          <p class="text-xs text-zinc-500 mt-1">1-го числа каждого месяца система соберёт метрики, принятые работы и план на следующий месяц.</p>
        </div>
        <AccessGate :allowed="can('report.publish')" :tip="TIP_SEND">
          <UToggle v-model="autoCreate" :disabled="!can('report.publish')" aria-label="Автосоздание отчётов" class="shrink-0" />
        </AccessGate>
      </div>
    </section>

    <ReportCreateModal v-model="createOpen" @created="onCreated" />
    <ReportSendModal v-model="sendOpen" :report="sendTarget" @sent="loadReports" />
  </PageRegistry>
</template>
