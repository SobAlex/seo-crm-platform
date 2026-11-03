<script setup lang="ts">
// reports.html → Сетка 1 (Registry): статусы отчётов и экспорт, фильтры проект / год / месяц / поиск, реестр, автосоздание черновиков.
import ReportCreateModal from '~/components/reports/ReportCreateModal.vue'

definePageMeta({ roles: ['owner', 'seo_head', 'mgr_head', 'pm', 'employee'] })
useHead({ title: 'Отчёты — SEO Control' })

const { can, canAny, user, seesWorkspace } = useRole()
const notify = useNotify()

type Status = 'draft' | 'review' | 'sent'
interface Report {
  m: string
  p: string
  by: string
  status: Status
  note?: string
  late?: boolean
  sent?: string
  opened?: string
  token?: string
}

const PROJECTS: Record<string, { name: string; client: string; clientId: string }> = {
  holod: { name: 'Интернет-магазин «Холод»', client: 'ООО «Холод Групп»', clientId: 'holod' },
  remont: { name: 'Сайт услуг «Ремонт+»', client: 'ИП Смирнов А.', clientId: 'smirnov' },
  medlife: { name: 'Клиника «МедЛайф»', client: 'ООО «МедЛайф»', clientId: 'medlife' },
  stroytech: { name: 'B2B портал «Стройтех»', client: 'АО «Стройтех»', clientId: 'stroytech' }
}
const PEOPLE: Record<string, string> = { petrov: 'А. Петров', dronov: 'И. Дронов', kovalev: 'Д. Ковалёв' }
const MONTH_NAME: Record<string, string> = { '01': 'Январь', '02': 'Февраль', '03': 'Март', '04': 'Апрель', '05': 'Май', '06': 'Июнь', '07': 'Июль', '08': 'Август', '09': 'Сентябрь', '10': 'Октябрь', '11': 'Ноябрь', '12': 'Декабрь' }
const MONTH: Record<string, string> = { '2025-06': 'Июнь 2025', '2025-05': 'Май 2025', '2025-04': 'Апрель 2025', '2025-03': 'Март 2025' }

const reports = ref<Report[]>([
  { m: '2025-06', p: 'holod', by: 'petrov', status: 'draft', note: 'собирается · до 05.07' },
  { m: '2025-06', p: 'remont', by: 'petrov', status: 'draft', note: 'собирается · до 05.07' },
  { m: '2025-06', p: 'medlife', by: 'dronov', status: 'draft', note: 'собирается · до 05.07' },
  { m: '2025-05', p: 'holod', by: 'petrov', status: 'sent', sent: '03.06', opened: '04.06', token: 'h7k2m9' },
  { m: '2025-05', p: 'remont', by: 'petrov', status: 'sent', sent: '03.06', opened: '04.06', token: 'r4p8x1' },
  { m: '2025-05', p: 'medlife', by: 'dronov', status: 'review', note: 'у Н. Морозова 3 дн. · срок 05.06', late: true },
  { m: '2025-05', p: 'stroytech', by: 'kovalev', status: 'sent', sent: '03.06', token: 's9d3q5' },
  { m: '2025-04', p: 'holod', by: 'petrov', status: 'sent', sent: '05.05', opened: '05.05', token: 'h1a6c4' },
  { m: '2025-04', p: 'remont', by: 'petrov', status: 'sent', sent: '05.05', opened: '07.05', token: 'r2n7v8' },
  { m: '2025-04', p: 'medlife', by: 'dronov', status: 'sent', sent: '06.05', opened: '06.05', token: 'm5t2b7' },
  { m: '2025-04', p: 'stroytech', by: 'kovalev', status: 'sent', sent: '05.05', opened: '12.05', token: 's3w8e2' },
  { m: '2025-03', p: 'holod', by: 'petrov', status: 'sent', sent: '03.04', opened: '03.04', token: 'h9z4y1' },
  { m: '2025-03', p: 'remont', by: 'petrov', status: 'sent', sent: '04.04', opened: '04.04', token: 'r6u1k3' },
  { m: '2025-03', p: 'medlife', by: 'dronov', status: 'sent', sent: '04.04', opened: '05.04', token: 'm8j5f6' },
  { m: '2025-03', p: 'stroytech', by: 'kovalev', status: 'sent', sent: '07.04', opened: '09.04', token: 's2l9h4' }
])

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

const TARGET_OPTIONS = [
  { value: '', label: 'Все проекты и клиенты' },
  { value: 'p:holod', label: 'Интернет-магазин «Холод»' },
  { value: 'p:remont', label: 'Сайт услуг «Ремонт+»' },
  { value: 'p:medlife', label: 'Клиника «МедЛайф»' },
  { value: 'p:stroytech', label: 'B2B портал «Стройтех»' }
]
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

const inScope = (r: Report) => {
  if (!seesWorkspace() && !user.value.projects.includes(r.p)) return false
  const [ry, rm] = r.m.split('-')
  const pr = PROJECTS[r.p]!
  const needle = q.value.trim().toLowerCase()
  const t = target.value
  return (year.value === 'all' || ry === year.value) &&
    (month.value === 'all' || rm === month.value) &&
    (!t || (t[0] === 'p' ? r.p : pr.clientId) === t.slice(2)) &&
    (!needle || `${pr.name} ${pr.client}`.toLowerCase().includes(needle))
}
const scoped = computed(() => reports.value.filter(inScope))
const visible = computed(() => scoped.value.filter(r => view.value === 'all' || r.status === view.value))

const viewOptions = computed(() => ([
  { value: 'all', label: 'Все отчёты' },
  { value: 'draft', label: 'Черновики' },
  { value: 'review', label: 'На согласовании' },
  { value: 'sent', label: 'Отправлены клиенту' }
]).map(o => ({ ...o, count: o.value === 'all' ? scoped.value.length : scoped.value.filter(r => r.status === o.value).length })))

const linkUrl = (r: Report) => `https://${COMPANY.workspace}/r/${r.token}`

function copyLink(r: Report) {
  const url = linkUrl(r)
  const done = () => notify('Ссылка скопирована: ' + url.replace('https://', ''), 'success')
  if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(url).then(done, done)
  else done()
}

function sendReport(r: Report) {
  if (!can('report.publish')) return notify('Недостаточно прав: отправлять отчёты клиенту может менеджер проекта', 'error')
  Object.assign(r, { status: 'sent', sent: '18.06', note: '', late: false, token: Math.random().toString(36).slice(2, 8) })
  notify('Отчёт отправлен клиенту · ' + PROJECTS[r.p]!.client, 'success')
}

function submitReport(r: Report) {
  if (!can('report.draft')) return notify('Недостаточно прав: составлять отчёты может сотрудник компании', 'error')
  Object.assign(r, { status: 'review', note: 'у Н. Морозова · с 18.06' })
  notify('Отчёт передан на согласование менеджеру', 'success')
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
              :key="r.m + r.p"
              class="hover:bg-zinc-50/50 transition grid grid-cols-2 gap-x-4 gap-y-3 p-4 md:p-0 md:table-row align-top"
            >
              <td data-label="Проект и клиент" class="md:px-4 lg:px-6 md:py-3 lg:py-4 col-span-2 md:col-span-1 min-w-0 before:block before:text-[11px] before:text-zinc-500 before:mb-0.5 before:content-[attr(data-label)] md:before:hidden">
                <NuxtLink :to="`/projects/${r.p}`" class="text-sm font-semibold text-zinc-900 hover:underline">{{ PROJECTS[r.p]!.name }}</NuxtLink>
                <div class="text-xs text-zinc-400 mt-0.5">Клиент: {{ PROJECTS[r.p]!.client }}</div>
              </td>
              <td data-label="Период и автор" :class="TD">
                <span class="text-sm font-medium text-zinc-800">{{ MONTH[r.m] }}</span>
                <div class="text-xs text-zinc-400 mt-0.5">составил: {{ PEOPLE[r.by] }}</div>
              </td>
              <td data-label="Статус отчёта" :class="TD">
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" :class="BADGE[r.status][0]"><span class="w-1.5 h-1.5 rounded-full" :class="BADGE[r.status][1]" />{{ BADGE[r.status][2] }}</span>
                <div v-if="r.status === 'sent'" class="text-xs text-zinc-500 mt-0.5">отправлен {{ r.sent }} · {{ r.opened ? 'открыт ' + r.opened : 'не открыт' }}</div>
                <div v-else-if="r.note" class="text-xs mt-0.5" :class="r.late ? 'text-red-600' : 'text-zinc-500'">{{ r.note }}</div>
              </td>
              <td data-label="Действия" class="md:px-4 lg:px-6 md:py-3 lg:py-4 col-span-2 md:col-span-1 md:text-right before:block before:text-[11px] before:text-zinc-500 before:mb-0.5 before:content-[attr(data-label)] md:before:hidden">
                <div class="inline-flex items-center justify-end gap-2 flex-wrap">
                  <template v-if="r.status === 'sent'">
                    <UButton :to="`/reports/${r.m}?view=client`" color="gray" variant="ghost" :class="[PILL, 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200']">Веб-версия</UButton>
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
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!visible.length" class="px-4 lg:px-6 py-14 text-center">
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

    <ReportCreateModal v-model="createOpen" />
  </PageRegistry>
</template>
