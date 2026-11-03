<script setup lang="ts">
// index.html → Сетка 1 (Registry): фильтр приёмки в тулбаре, приветствие, «На приёмке» и «Требует внимания».
import type { HomeSortKey, HomeTask } from '~/types/home'

definePageMeta({ roles: ['owner', 'seo_head', 'mgr_head', 'pm', 'employee'] })
useHead({ title: 'Главная — SEO Control' })

const { can, user, role, roleLabel, isLead, seesWorkspace } = useRole()
const notify = useNotify()

const PEOPLE: Record<string, [string, string]> = {
  smirnov: ['А. Смирнов', 'АС'], sidorov: ['И. Сидоров', 'ИС'], vetrova: ['О. Ветрова', 'ОВ'], morozov: ['Н. Морозов', 'НМ'],
  petrov: ['А. Петров', 'АП'], dronov: ['И. Дронов', 'ИД'], lebedev: ['П. Лебедев', 'ПЛ'], kim: ['М. Ким', 'МК']
}
const PROJECTS: Record<string, string> = { holod: 'Холод', remont: 'Ремонт+', medlife: 'МедЛайф', stroytech: 'Стройтех' }
const SETTER_NAME: Record<string, string> = {
  petrov: 'А. Петров', morozov: 'Н. Морозов', sidorov: 'И. Сидоров', kim: 'М. Ким',
  lebedev: 'П. Лебедев', smirnov: 'А. Смирнов', vetrova: 'О. Ветрова', dronov: 'И. Дронов'
}

// На приёмке: creator — постановщик, acceptor — кто принимает.
const queue = ref<HomeTask[]>([
  { id: 3, title: 'Мета-теги категорий', project: 'remont', dir: 'Внутренняя', assignee: 'lebedev', creator: 'petrov', days: 3, due: '16.06' },
  { id: 1, title: 'Проверить индексацию в GSC', project: 'holod', dir: 'Аудит', assignee: 'kim', creator: 'petrov', days: 2, due: '18.06', prio: true },
  { id: 2, title: 'Canonical для фильтров', project: 'holod', dir: 'Аудит', assignee: 'petrov', creator: 'morozov', acceptor: 'sidorov', days: 1, due: '17.06' },
  { id: 21, title: 'Кластеризация раздела «Морозильники»', project: 'holod', dir: 'Семантика', assignee: 'kim', creator: 'smirnov', days: 1, due: '19.06' },
  { id: 22, title: 'Перелинковка статей блога', project: 'remont', dir: 'Внутренняя', assignee: 'lebedev', creator: 'smirnov', days: 2, due: '20.06' },
  { id: 23, title: 'Технический аудит после релиза', project: 'medlife', dir: 'Аудит', assignee: 'dronov', creator: 'smirnov', days: 4, due: '14.06', prio: true },
  { id: 24, title: 'Тексты для 5 страниц услуг', project: 'medlife', dir: 'Контент', assignee: 'lebedev', creator: 'vetrova', days: 1, due: '21.06' },
  { id: 25, title: 'Размещение ссылок: отчёт за неделю', project: 'stroytech', dir: 'Внешняя', assignee: 'dronov', creator: 'morozov', days: 2, due: '18.06' }
])

// Требует внимания: причина — overdue (красный), waiting / returned (янтарный).
const ATTENTION: HomeTask[] = [
  { id: 13, title: 'Настройка целей в Метрике', project: 'medlife', dir: 'Аудит', assignee: 'lebedev', creator: 'vetrova', acceptor: 'sidorov', reason: 'overdue', days: 9, due: '09.06' },
  { id: 12, title: 'Оптимизация карточек услуг', project: 'remont', dir: 'Внутренняя', assignee: 'dronov', co: 'petrov', creator: 'morozov', acceptor: 'sidorov', reason: 'overdue', days: 8, due: '10.06' },
  { id: 11, title: 'Дубли Title на пагинации', project: 'remont', dir: 'Аудит', assignee: 'petrov', co: 'dronov', creator: 'sidorov', acceptor: 'sidorov', reason: 'overdue', days: 6, due: '12.06', prio: true },
  { id: 6, title: 'Статья «Как выбрать холодильник»', project: 'holod', dir: 'Контент', assignee: 'kim', creator: 'petrov', acceptor: 'petrov', reason: 'returned', due: '20.06' },
  { id: 9, title: 'Доступы к GSC и Метрике', project: 'holod', assignee: 'dronov', creator: 'morozov', acceptor: 'sidorov', reason: 'waiting', days: 6 },
  { id: 10, title: 'Тексты категорий на согласование', project: 'holod', dir: 'Контент', assignee: 'kim', creator: 'petrov', acceptor: 'petrov', reason: 'waiting', days: 3 },
  { title: 'Отчёт за май 2025', href: '/reports/2025-05', tag: 'Отчёт', project: 'medlife', assignee: 'dronov', reason: 'overdue', days: 13, due: '05.06', can: 'report.publish', noun: 'Просрочен' },
  { title: 'Переподключить Google Search Console', href: '/settings#integrations', tag: 'Авто', project: '', assignee: 'sidorov', reason: 'overdue', days: 3, due: '15.06', can: 'integrations.manage' }
]

const days = (n = 0) => n + ' ' + plural(n, ['день', 'дня', 'дней'])
const me = computed(() => user.value.id)
const firstName = computed(() => user.value.name.split(' ')[0])

// Приёмка: постановщик, менеджер и руководство. Исполнитель — только если он же постановщик.
const canAccept = (t: HomeTask) => can('task.review') && (isLead.value || role.value === 'account_manager' || t.creator === me.value)

// Область «Вся компания» на ленте «Главной»: не-руководитель видит только поставленное им.
function matches(t: HomeTask, inQueue: boolean): boolean {
  if (t.can && !can(t.can)) return false
  if (!seesWorkspace() && t.project && !user.value.projects.includes(t.project)) return false
  if (!isLead.value && t.creator !== me.value) return false
  return inQueue ? canAccept(t) : true
}

// Фильтр приёмки «Все / Где я постановщик».
const mode = ref('all')
const queueAll = computed(() => queue.value.filter(t => matches(t, true)))
const queueMine = computed(() => queueAll.value.filter(t => t.creator === me.value))
const queueRows = computed(() => sortRows(mode.value === 'mine' ? queueMine.value : queueAll.value, queueSort.value, 'queue'))
const queueOptions = computed(() => [
  { value: 'all', label: 'Все', count: queueAll.value.length },
  { value: 'mine', label: 'Где я постановщик', count: queueMine.value.length }
])
const attentionRows = computed(() => sortRows(ATTENTION.filter(t => matches(t, false)), attentionSort.value, 'attention'))

// Сортировка по клику на заголовок (data-sortable): текст ячейки, ru + numeric, первый клик — по возрастанию.
interface SortState { key: HomeSortKey | null; dir: 'asc' | 'desc' }
const queueSort = ref<SortState>({ key: null, dir: 'asc' })
const attentionSort = ref<SortState>({ key: null, dir: 'asc' })
function reasonText(t: HomeTask): string {
  if (t.reason === 'overdue') return `${t.noun || 'Просрочена'} на ${days(t.days)}`
  if (t.reason === 'waiting') return `Ждёт клиента ${days(t.days)}`
  return 'Возвращена на доработку'
}
function sortText(t: HomeTask, k: HomeSortKey, table: 'queue' | 'attention'): string {
  switch (k) {
    case 'task': return t.title
    case 'project': return t.project ? PROJECTS[t.project] + (t.dir ? ' ' + t.dir : '') : 'Вся компания'
    case 'setter': return SETTER_NAME[t.creator ?? ''] || '—'
    case 'assignee': return PEOPLE[t.assignee]![0]
    case 'status': return table === 'queue' ? `На проверке ${t.days} дн.` : reasonText(t)
    case 'due': return t.due || '—'
  }
}
function sortRows(rows: HomeTask[], s: SortState, table: 'queue' | 'attention'): HomeTask[] {
  if (!s.key) return rows
  const k = s.key
  return [...rows].sort((a, b) => {
    const cmp = sortText(a, k, table).localeCompare(sortText(b, k, table), 'ru', { numeric: true })
    return s.dir === 'asc' ? cmp : -cmp
  })
}
function sortBy(state: SortState, k: HomeSortKey) {
  state.dir = state.key === k && state.dir === 'asc' ? 'desc' : 'asc'
  state.key = k
}

const QUEUE_COLUMNS: { key: HomeSortKey; label: string; cls: string }[] = [
  { key: 'task', label: 'Задача', cls: 'text-left px-4 lg:px-6' },
  { key: 'project', label: 'Проект', cls: 'text-left px-3' },
  { key: 'setter', label: 'Постановщик', cls: 'text-left px-3' },
  { key: 'assignee', label: 'Исполнитель', cls: 'text-left px-3' },
  { key: 'status', label: 'Статус', cls: 'text-left px-3' },
  { key: 'due', label: 'Срок', cls: 'text-right px-3' }
]
const ATTENTION_COLUMNS: { key: HomeSortKey; label: string; cls: string }[] = [
  { key: 'task', label: 'Задача', cls: 'text-left px-4 lg:px-6' },
  { key: 'project', label: 'Проект', cls: 'text-left px-3' },
  { key: 'setter', label: 'Постановщик', cls: 'text-left px-3' },
  { key: 'assignee', label: 'Исполнитель', cls: 'text-left px-3' },
  { key: 'status', label: 'Причина', cls: 'text-left px-3' },
  { key: 'due', label: 'Срок', cls: 'text-right px-4 lg:px-6' }
]

const cellProps = (t: HomeTask) => ({
  task: t,
  assignee: PEOPLE[t.assignee]!,
  co: t.co ? PEOPLE[t.co] : null,
  projectName: PROJECTS[t.project],
  setter: SETTER_NAME[t.creator ?? ''] || '—',
  coMe: !!t.co && t.co.split(' ').includes(me.value)
})

function accept(t: HomeTask) {
  queue.value = queue.value.filter(x => x !== t)
  notify(`Принято: «${t.title}»`)
}

const reworkAnchor = ref<HTMLElement | null>(null)
const reworkTask = ref<HomeTask | null>(null)
function askRework(e: MouseEvent, t: HomeTask) {
  reworkTask.value = t
  reworkAnchor.value = e.currentTarget as HTMLElement
}
function onReason(reason: string | null) {
  const t = reworkTask.value
  reworkAnchor.value = null
  reworkTask.value = null
  if (!t || !reason) return
  queue.value = queue.value.filter(x => x !== t)
  notify(`«${t.title}» отправлена на доработку · ${PEOPLE[t.assignee]![0]} получит замечание`, 'warning')
}

const TD = 'md:px-3 md:py-3 lg:py-4 text-sm min-w-0 before:block before:text-[11px] before:text-zinc-500 before:mb-0.5 before:content-[attr(data-label)] md:before:hidden'
const ROW = 'hover:bg-zinc-50/50 transition grid grid-cols-2 gap-x-4 gap-y-3 p-4 md:p-0 md:table-row'
</script>

<template>
  <PageRegistry title="Главная">
    <template #focus>
      <UiSegmented v-model="mode" :options="queueOptions" aria-label="Фильтр приёмки">
        <template #option="{ option }">
          {{ option.label }} <span class="ml-0.5 tabular-nums opacity-60">{{ option.count }}</span>
        </template>
      </UiSegmented>
    </template>

    <div>
      <h2 class="text-2xl lg:text-3xl font-semibold tracking-tight">Здравствуйте, {{ firstName }}</h2>
      <p class="text-sm text-zinc-500 mt-1">Среда, 18 июня · {{ roleLabel }}</p>
    </div>

    <section v-if="can('task.review') && queueAll.length" class="bg-white rounded-2xl shadow-card overflow-hidden">
      <div class="px-4 lg:px-6 py-4 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h3 class="text-sm font-semibold tracking-tight flex items-center gap-2">На приёмке <span class="px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-xs font-medium tabular-nums">{{ queueRows.length }}</span></h3>
        </div>
        <NuxtLink to="/tasks?view=review" class="text-sm text-zinc-500 hover:text-zinc-900 transition shrink-0">Все →</NuxtLink>
      </div>
      <div class="overflow-x-auto border-t border-zinc-100 -mx-4 sm:mx-0 px-4 sm:px-0 max-w-full">
        <table class="w-full block md:table">
          <thead class="hidden md:table-header-group">
            <tr class="border-b border-zinc-100">
              <th v-for="c in QUEUE_COLUMNS" :key="c.key" class="text-xs font-medium text-zinc-500 whitespace-nowrap py-3" :class="c.cls">
                <button type="button" class="inline-flex items-center gap-1 hover:text-zinc-900 transition select-none" :class="queueSort.key === c.key && 'text-zinc-900'" @click="sortBy(queueSort, c.key)">{{ c.label }}<svg class="w-3 h-3 text-zinc-400" viewBox="0 0 16 16" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 3v10M5 6l3-3 3 3M5 10l3 3 3-3" /></svg></button>
              </th>
              <th class="text-right text-xs font-medium text-zinc-500 whitespace-nowrap px-4 lg:px-6 py-3 lg:!pl-10" />
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 block md:table-row-group">
            <tr v-for="t in queueRows" :key="t.id" :class="ROW">
              <HomeTaskCells v-bind="cellProps(t)" />
              <td data-label="Статус" :class="TD">
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1"><span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 whitespace-nowrap shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-amber-500" />На проверке</span><span class="text-xs text-zinc-500 tabular-nums">{{ t.days }} дн.</span></div>
              </td>
              <td data-label="Срок" :class="[TD, 'md:text-right whitespace-nowrap tabular-nums text-zinc-500']">{{ t.due }}</td>
              <td data-label="" class="md:px-4 lg:px-6 md:py-3 lg:py-4 col-span-2 md:col-span-1 md:text-right">
                <div class="flex gap-2 md:justify-end">
                  <button type="button" title="Принять" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-600 text-white text-xs font-medium hover:bg-emerald-700 active:scale-[.97] transition whitespace-nowrap shrink-0" @click="accept(t)"><svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>Принять</button>
                  <button type="button" class="px-2.5 py-1 rounded-full bg-amber-500 text-white text-xs font-medium hover:bg-amber-600 active:scale-[.97] transition whitespace-nowrap shrink-0" @click="askRework($event, t)">На доработку</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!queueRows.length" class="px-4 lg:px-6 py-8 text-center text-sm text-zinc-500">{{ mode === 'mine' ? 'Задач, которые вы поставили, на приёмке нет' : 'Нет работ, ожидающих приёмки' }}</div>
    </section>

    <section class="bg-white rounded-2xl shadow-card overflow-hidden">
      <div class="px-4 lg:px-6 py-4 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h3 class="text-sm font-semibold tracking-tight flex items-center gap-2">Требует внимания <span class="px-1.5 py-0.5 rounded-full bg-zinc-100 text-zinc-600 text-xs font-medium tabular-nums">{{ attentionRows.length }}</span></h3>
        </div>
        <NuxtLink to="/tasks?view=attention" class="text-sm text-zinc-500 hover:text-zinc-900 transition shrink-0">Все →</NuxtLink>
      </div>
      <div class="overflow-x-auto border-t border-zinc-100 -mx-4 sm:mx-0 px-4 sm:px-0 max-w-full">
        <table class="w-full block md:table">
          <thead class="hidden md:table-header-group">
            <tr class="border-b border-zinc-100">
              <th v-for="c in ATTENTION_COLUMNS" :key="c.key" class="text-xs font-medium text-zinc-500 whitespace-nowrap py-3" :class="c.cls">
                <button type="button" class="inline-flex items-center gap-1 hover:text-zinc-900 transition select-none" :class="attentionSort.key === c.key && 'text-zinc-900'" @click="sortBy(attentionSort, c.key)">{{ c.label }}<svg class="w-3 h-3 text-zinc-400" viewBox="0 0 16 16" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 3v10M5 6l3-3 3 3M5 10l3 3 3-3" /></svg></button>
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 block md:table-row-group">
            <tr v-for="t in attentionRows" :key="t.id ?? t.title" :class="ROW">
              <HomeTaskCells v-bind="cellProps(t)" />
              <td data-label="Причина" :class="TD">
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span v-if="t.reason === 'overdue'" class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 ring-1 ring-red-100 whitespace-nowrap shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-red-500" />{{ t.noun || 'Просрочена' }} на {{ days(t.days) }}</span>
                  <template v-else-if="t.reason === 'waiting'">
                    <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-100 whitespace-nowrap shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-amber-500" />Ждёт клиента</span><span class="text-xs text-zinc-500 tabular-nums">{{ days(t.days) }}</span>
                  </template>
                  <span v-else class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 ring-1 ring-amber-100 whitespace-nowrap shrink-0"><span class="w-1.5 h-1.5 rounded-full bg-amber-500" />Возвращена на доработку</span>
                </div>
              </td>
              <td data-label="Срок" class="md:px-4 lg:px-6 md:py-3 lg:py-4 text-sm min-w-0 before:block before:text-[11px] before:text-zinc-500 before:mb-0.5 before:content-[attr(data-label)] md:before:hidden md:text-right whitespace-nowrap tabular-nums" :class="t.reason === 'overdue' ? 'text-red-600 font-medium' : 'text-zinc-500'">{{ t.due || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="!attentionRows.length" class="px-4 lg:px-6 py-8 text-center text-sm text-zinc-500">В отделе всё спокойно</div>
    </section>

    <HomeReasonPop
      :anchor="reworkAnchor"
      title="Вернуть на доработку"
      :sub="reworkTask ? `${reworkTask.title} · ${PEOPLE[reworkTask.assignee]![0]}` : undefined"
      placeholder="Обязательно опишите, что исправить — исполнитель увидит это в задаче"
      ok="Вернуть"
      @resolve="onReason"
    />
  </PageRegistry>
</template>
