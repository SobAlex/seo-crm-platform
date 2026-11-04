<script setup lang="ts">
// tasks.html → Сетка 1 (Registry): строка 1 — личный фокус и вид (Доска / Список), строка 2 — фильтры и поиск.
// Доска по глобальным статусам или по этапам выбранного направления, список с группами по статусам и массовым переводом.
import {
  DIRS, FLAGS, PEOPLE, STATUSES, STATUS_NAME, TASK_PROJECTS, WORKS,
  isDir, isFlag, personName, stepsOf,
  type BoardTask, type DirId, type TaskFlag, type TaskFocus, type TaskStatus
} from '~/types/tasks'

definePageMeta({ roles: ['owner', 'seo_head', 'mgr_head', 'pm', 'employee', 'contractor'] })
useHead({ title: 'Задачи — SEO Control' })

const { can, hasRole, role, user, isLead, seesWorkspace } = useRole()
const notify = useNotify()
const route = useRoute()

const tasks = ref<BoardTask[]>([])
const tasksLoaded = ref(false)

const STATUS_DOT: Record<TaskStatus, string> = {
  planned: 'bg-zinc-400', progress: 'bg-blue-600', review: 'bg-amber-500', waiting: 'bg-violet-500', done: 'bg-emerald-500'
}
const SHADES: Record<DirId, string[]> = {
  audit: ['bg-sky-300', 'bg-sky-400', 'bg-sky-500', 'bg-sky-600', 'bg-sky-700'],
  semantic: ['bg-indigo-300', 'bg-indigo-400', 'bg-indigo-500', 'bg-indigo-600', 'bg-indigo-700'],
  onpage: ['bg-teal-300', 'bg-teal-400', 'bg-teal-500', 'bg-teal-600', 'bg-teal-700'],
  offpage: ['bg-orange-300', 'bg-orange-400', 'bg-orange-500', 'bg-orange-600', 'bg-orange-700'],
  content: ['bg-pink-300', 'bg-pink-400', 'bg-pink-500', 'bg-pink-600', 'bg-pink-700'],
  dev: ['bg-slate-300', 'bg-slate-400', 'bg-slate-500', 'bg-slate-600', 'bg-slate-700']
}

const me = computed(() => user.value.id)
const isContractor = computed(() => role.value === 'contractor')
const createTip = 'Подрядчик работает только с назначенными задачами'
const canCreate = computed(() => can('task.create') && !hasRole(['contractor']))

// Состояние тулбара: query-параметры ?project= ?direction= ?executor= ?view= ?work= задают стартовые фильтры.
const qs = (k: string) => (typeof route.query[k] === 'string' ? (route.query[k] as string) : '')
const focus = ref<TaskFocus>(isContractor.value ? 'exec' : 'all')
const mode = ref<'board' | 'list'>('board')
const project = ref('')
const direction = ref<DirId | ''>('')
const assignee = ref('')
const q = ref('')
const flag = ref<TaskFlag | ''>('')
const work = ref('')
const collapsed = ref<TaskStatus[]>(['done'])
const selected = ref<Array<number | string>>([])

function readQuery() {
  const dir = qs('direction')
  const view = qs('view')
  project.value = qs('project')
  direction.value = isDir(dir) ? dir : ''
  assignee.value = qs('executor')
  flag.value = isFlag(view) ? view : ''
  work.value = qs('work') in WORKS ? qs('work') : ''
}
readQuery()
watch(() => route.query, readQuery)

const FOCUS_KEY = computed(() => 'seo_tasks_focus_' + role.value)
const MODE_KEY = 'seo_tasks_mode'
onMounted(async () => {
  try {
    const f = localStorage.getItem(FOCUS_KEY.value)
    if (!isContractor.value && (f === 'all' || f === 'exec' || f === 'set')) focus.value = f
    if (localStorage.getItem(MODE_KEY) === 'list') mode.value = 'list'
  } catch { /* ignore */ }
  try {
    const rows = await $fetch<Array<{ id: string; title: string; projectId: string; projectName: string; status: string; assigneeId: string | null; assigneeName: string; deadline: string | null; isInReport: boolean }>>('/api/tasks', { credentials: 'include' })
    const statusMap: Record<string, BoardTask['status']> = {
      PLANNED: 'planned', IN_PROGRESS: 'progress', ON_REVIEW: 'review', WAITING_CLIENT: 'waiting', DONE: 'done'
    }
    tasks.value = rows.map(row => ({
      id: row.id,
      title: row.title,
      project: row.projectId,
      projectLabel: row.projectName,
      dir: null,
      assignee: row.assigneeId || '',
      assigneeName: row.assigneeName || '',
      co: [],
      creator: '',
      acceptor: '',
      status: statusMap[row.status] ?? 'planned',
      stage: null,
      due: row.deadline ? row.deadline.slice(0, 10) : null,
      report: row.isInReport
    }))
  } catch (error) {
    tasks.value = []
    notify(apiErrorMessage(error), 'error')
  } finally {
    tasksLoaded.value = true
  }
})
watch(focus, v => { try { localStorage.setItem(FOCUS_KEY.value, v) } catch { /* ignore */ } })
watch(mode, v => { try { localStorage.setItem(MODE_KEY, v) } catch { /* ignore */ } })
watch(isContractor, c => { if (c) focus.value = 'exec' })
const { confirm } = useConfirm()
async function removeTask(task: BoardTask) {
  if (!(await confirm({ title: 'Удалить задачу?', text: task.title, ok: 'Удалить', toast: false }))) return
  try {
    await $fetch(`/api/tasks/${task.id}`, { method: 'DELETE', credentials: 'include' })
    tasks.value = tasks.value.filter(row => row.id !== task.id)
    notify('Задача удалена', 'success')
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  }
}

// Фильтрация: видимость по роли, фокус, фильтры тулбара, быстрый вид (?view=) и пункт дорожной карты (?work=).
const isExec = (t: BoardTask) => t.assignee === me.value || t.co.includes(me.value) || (isContractor.value && Boolean(t.projectLabel))
const visibleToMe = (t: BoardTask) => {
  if (!seesWorkspace() && !user.value.projects.includes(t.project)) return false
  return !isContractor.value || isExec(t)
}
const pickPeople = computed(() => focus.value === 'all' && !isContractor.value && ['owner', 'seo_head', 'mgr_head', 'account_manager'].includes(role.value))
const personal = computed(() => isContractor.value || focus.value === 'exec' || focus.value === 'set')

function matches(t: BoardTask, f: TaskFocus) {
  if (!visibleToMe(t)) return false
  if (f === 'exec' && !isExec(t)) return false
  if (f === 'set' && !(t.creator === me.value && t.assignee !== me.value)) return false
  if (project.value && t.project !== project.value) return false
  if (direction.value && t.dir !== direction.value) return false
  if (pickPeople.value && assignee.value && t.assignee !== assignee.value && !t.co.includes(assignee.value)) return false
  const needle = q.value.trim().toLowerCase()
  if (needle && !t.title.toLowerCase().includes(needle)) return false
  if (flag.value && !FLAGS[flag.value][1](t)) return false
  if (work.value && t.work !== work.value) return false
  return true
}
const current = computed(() => tasks.value.filter(t => matches(t, focus.value)))

const visibleTasks = computed(() => tasks.value.filter(visibleToMe))
const projectIds = computed(() => Object.keys(TASK_PROJECTS).filter(id => visibleTasks.value.some(t => t.project === id)))
const peopleIds = computed(() => Object.keys(PEOPLE).filter(id => visibleTasks.value.some(t => t.assignee === id || t.co.includes(id))))
watch([projectIds, peopleIds], () => {
  if (project.value && !projectIds.value.includes(project.value)) project.value = ''
  if (assignee.value && !peopleIds.value.includes(assignee.value)) assignee.value = ''
}, { immediate: true })

const projectOptions = computed(() => [{ value: '', label: 'Все проекты' }, ...projectIds.value.map(id => ({ value: id, label: TASK_PROJECTS[id] }))])
const directionOptions = [{ value: '', label: 'Все направления' }, ...(Object.keys(DIRS) as DirId[]).map(id => ({ value: id, label: DIRS[id].name }))]
const assigneeOptions = computed(() => {
  const list = [{ value: '', label: 'Вся команда' }, ...peopleIds.value.map(id => ({ value: id, label: personName(id) + (id === me.value ? ' (я)' : '') }))]
  if (personal.value && !peopleIds.value.includes(me.value)) list.push({ value: me.value, label: personName(me.value) + ' (я)' })
  return list
})
const assigneeValue = computed({
  get: () => (personal.value ? me.value : assignee.value),
  set: v => { assignee.value = v }
})
const assigneeTip = computed(() => isContractor.value
  ? 'Подрядчик видит только назначенные на него задачи'
  : (personal.value ? 'Исполнитель уже задан этой вкладкой' : 'Фильтр команды доступен владельцу, руководителям и менеджеру проекта'))

const focusOptions = computed(() => [
  { value: 'all', label: 'Все задачи', count: tasks.value.filter(t => matches(t, 'all')).length, disabled: isContractor.value, tip: isContractor.value ? 'Подрядчик видит только задачи, где он исполнитель' : undefined },
  { value: 'exec', label: 'Я исполнитель', count: tasks.value.filter(t => matches(t, 'exec')).length },
  { value: 'set', label: 'Я постановщик', count: tasks.value.filter(t => matches(t, 'set')).length, disabled: isContractor.value, tip: isContractor.value ? 'Подрядчик не ставит задачи другим' : undefined }
])
const modeOptions = [{ value: 'board', label: 'Доска' }, { value: 'list', label: 'Список' }]

const dirty = computed(() => !!(project.value || direction.value || assignee.value || q.value || flag.value || work.value))
function resetFilters() {
  project.value = ''
  direction.value = ''
  assignee.value = ''
  q.value = ''
  flag.value = ''
  work.value = ''
}

const EMPTY: Record<TaskFocus, string> = {
  all: 'Задач по выбранным фильтрам нет',
  exec: 'Задач, где вы исполнитель или соисполнитель, по этим фильтрам нет',
  set: 'Задач, которые вы поставили другим, по этим фильтрам нет'
}

// Доска: колонки статусов или этапов выбранного направления.
const COL = 'w-[82vw] sm:w-[320px] lg:w-auto lg:min-w-0 shrink-0 snap-start rounded-2xl bg-black/[0.04] p-2 flex flex-col'
interface Column { key: string; title: string; dot: string; items: BoardTask[]; local: boolean; add: boolean }
const columns = computed<Column[]>(() => {
  const d = direction.value
  if (d) {
    return DIRS[d].steps.map((s, i) => ({
      key: 'stage:' + i, title: s, dot: SHADES[d][Math.min(i, 4)]!, local: true, add: i === 0,
      items: current.value.filter(t => (t.stage == null ? 0 : t.stage) === i)
    }))
  }
  return STATUSES.map(s => ({
    key: s.id, title: s.board || s.name, dot: STATUS_DOT[s.id], local: false, add: s.id === 'planned',
    items: current.value.filter(t => t.status === s.id)
  }))
})

// Список: группы по статусам, свёрнутые группы, выбор строк и массовый перевод.
const groups = computed(() => STATUSES
  .map(s => ({ ...s, dot: STATUS_DOT[s.id], items: current.value.filter(t => t.status === s.id) }))
  .filter(g => g.items.length))
function toggleGroup(id: TaskStatus) {
  collapsed.value = collapsed.value.includes(id) ? collapsed.value.filter(x => x !== id) : [...collapsed.value, id]
}
watch(current, list => {
  const ids = list.map(t => t.id)
  selected.value = selected.value.filter(id => ids.includes(id))
})
const allChecked = computed(() => selected.value.length > 0 && selected.value.length === current.value.length)
const someChecked = computed(() => selected.value.length > 0 && selected.value.length < current.value.length)
function toggleAll(on: boolean) {
  selected.value = on ? current.value.map(t => t.id) : []
}
function toggleRow(id: number | string, on: boolean) {
  selected.value = on ? [...selected.value, id] : selected.value.filter(x => x !== id)
}

// Перемещение задач. Порученную задачу принимает постановщик (или руководитель/менеджер), принять можно только с проверки.
// Перенос в «В работе» ставит первый этап направления, в «Принята» — финальный; промежуточные этапы сохраняются.
const canAccept = (t: BoardTask) => can('task.review') && (isLead.value || role.value === 'account_manager' || t.creator === me.value)
const acceptorName = (t: BoardTask) => (t.acceptor ? personName(t.acceptor) : 'постановщик')
const fail = (msg: string) => { notify(msg, 'error'); return false }

function moveGlobal(t: BoardTask, to: TaskStatus, quiet = false): boolean {
  const from = t.status
  if (from === to) return false
  if (from === 'done') return fail('Принятые задачи не перемещаются')
  const acceptable = canAccept(t)
  if (to === 'done') {
    if (!acceptable) return fail('Порученную задачу принимает постановщик' + (t.acceptor ? ' — ' + personName(t.acceptor) : ''))
    if (from !== 'review') return fail('Сначала задачу нужно передать на проверку')
  }
  if (from === 'review' && to !== 'done' && !acceptable) return fail('Вернуть из проверки может постановщик')
  const s = stepsOf(t)
  t.status = to
  t.returned = from === 'review' && to === 'progress'
  if (to === 'planned') t.stage = null
  if (to === 'progress' && t.stage == null && s) t.stage = 0
  if ((to === 'review' || to === 'waiting') && t.stage == null && s) t.stage = 0
  if (to === 'done' && s) t.stage = s.length - 1
  if (to === 'waiting') t.wait = 0
  if (to === 'review') t.reviewDays = 0
  if (!quiet) {
    let msg = '«' + t.title + '» → ' + STATUS_NAME[to]
    if (to === 'review') msg += ' · принимает ' + acceptorName(t)
    if (t.returned) msg = '«' + t.title + '» отправлена на доработку · исполнитель уведомлён'
    notify(msg, t.returned ? 'warning' : (to === 'done' ? 'success' : undefined))
  }
  return true
}

function moveLocal(t: BoardTask, i: number): boolean {
  const s = stepsOf(t)
  if (!s || !t.dir) return false
  const last = s.length - 1
  const stage = t.stage == null ? 0 : t.stage
  if (t.status === 'done') return fail('Принятые задачи не перемещаются')
  if (stage === i && !(i === last && t.status !== 'review')) return false
  const acceptable = canAccept(t)
  const label = DIRS[t.dir].short + ' · ' + s[i]
  if (i === last) {
    if (t.status === 'review') {
      if (!acceptable) return fail('Принимает ' + acceptorName(t) + ' — задача уже на проверке')
      t.status = 'done'; t.stage = last; t.returned = false
      notify('«' + t.title + '» принята · ' + label, 'success')
      return true
    }
    t.status = 'review'; t.stage = last; t.returned = false; t.reviewDays = 0
    notify('«' + t.title + '» → ' + label + ' · передана на проверку, принимает ' + acceptorName(t))
    return true
  }
  if (t.status === 'review') {
    if (!acceptable) return fail('Вернуть из проверки может постановщик')
    t.status = 'progress'; t.returned = true; t.stage = i
    notify('«' + t.title + '» отправлена на доработку · ' + label, 'warning')
    return true
  }
  if (t.status === 'planned') t.status = 'progress'
  t.stage = i
  notify('«' + t.title + '» → ' + label)
  return true
}

// Перетаскивание карточек между колонками.
const draggedId = ref<number | string | null>(null)
const fadedId = ref<number | string | null>(null)
const hoverZone = ref('')
function onDragStart(e: DragEvent, t: BoardTask) {
  draggedId.value = t.id
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(t.id))
  }
  setTimeout(() => { fadedId.value = t.id }, 0)
}
function onDragEnd() {
  draggedId.value = null
  fadedId.value = null
  hoverZone.value = ''
}
function onDragOver(e: DragEvent, key: string) {
  if (draggedId.value == null) return
  e.preventDefault()
  hoverZone.value = key
}
function onDrop(e: DragEvent, key: string) {
  const t = tasks.value.find(x => x.id === draggedId.value)
  if (!t) return
  e.preventDefault()
  onDragEnd()
  if (key.startsWith('stage:')) moveLocal(t, +key.slice(6))
  else moveGlobal(t, key as TaskStatus)
}

// Массовый перевод выбранных задач в статус.
const bulkTo = ref('')
const bulkOptions = STATUSES.map(s => ({ value: s.id, label: s.name }))
watch(bulkTo, to => {
  if (!to) return
  const status = to as TaskStatus
  const picked = tasks.value.filter(t => selected.value.includes(t.id))
  const done = picked.filter(t => t.status !== status && moveGlobal(t, status, true)).length
  if (done) notify(done + ' ' + plural(done, ['задача', 'задачи', 'задач']) + ' → ' + STATUS_NAME[status], 'success')
  if (done < picked.length && done > 0) notify('Часть задач не перенесена: их статус меняет постановщик или они уже в этом статусе', 'warning')
  selected.value = []
  nextTick(() => { bulkTo.value = '' })
})

const SEL = 'w-full sm:w-auto'
</script>

<template>
  <PageRegistry title="Задачи">
    <template #actions>
      <AccessGate :allowed="canCreate" :tip="createTip">
        <UButton to="/tasks/new" :disabled="!canCreate" :data-deny-tip="createTip" class="disabled:opacity-50 disabled:cursor-not-allowed">
          <span class="sm:hidden">+ Задача</span><span class="hidden sm:inline">+ Создать задачу</span>
        </UButton>
      </AccessGate>
    </template>

    <template #focus>
      <UiSegmented :model-value="focus" :options="focusOptions" aria-label="Фокус" @update:model-value="focus = $event as TaskFocus">
        <template #option="{ option }">
          {{ option.label }}<span class="ml-1.5 text-xs tabular-nums opacity-60">{{ option.count }}</span>
        </template>
      </UiSegmented>
    </template>

    <template #view>
      <UiSegmented :model-value="mode" :options="modeOptions" aria-label="Представление" @update:model-value="mode = $event === 'list' ? 'list' : 'board'" />
    </template>

    <template #filters>
      <div class="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto sm:flex-1 min-w-0">
        <USelect v-model="project" :options="projectOptions" size="xs" aria-label="Проект" :class="SEL" />
        <USelect v-model="direction" :options="directionOptions" size="xs" aria-label="Направление" :class="SEL" />
        <AccessGate :allowed="pickPeople" :tip="assigneeTip">
          <USelect v-model="assigneeValue" :options="assigneeOptions" size="xs" aria-label="Исполнитель" :disabled="!pickPeople" :title="pickPeople ? 'Исполнитель' : assigneeTip" :data-deny-tip="pickPeople ? undefined : assigneeTip" :class="SEL" />
        </AccessGate>
      </div>
      <UInput
        v-model="q"
        type="search"
        size="xs"
        placeholder="Поиск по названию…"
        aria-label="Поиск по названию"
        icon="i-heroicons-magnifying-glass-20-solid"
        class="w-full sm:w-64 shrink-0"
      />
      <span v-if="flag" class="inline-flex items-center gap-1 pl-2.5 pr-1 h-8 rounded-full bg-accent/10 text-accent text-xs font-medium shrink-0 w-fit">
        <span>{{ FLAGS[flag][0] }}</span>
        <button type="button" aria-label="Сбросить фильтр" class="w-5 h-5 rounded-full hover:bg-accent/15 flex items-center justify-center" @click="flag = ''">×</button>
      </span>
      <span v-if="work" class="inline-flex items-center gap-1 pl-2.5 pr-1 h-8 rounded-full bg-accent/10 text-accent text-xs font-medium shrink-0 w-fit">
        <span>Работа: {{ WORKS[work] }}</span>
        <button type="button" aria-label="Сбросить фильтр по работе" class="w-5 h-5 rounded-full hover:bg-accent/15 flex items-center justify-center" @click="work = ''">×</button>
      </span>
      <UButton v-if="dirty" color="gray" variant="ghost" size="xs" class="bg-zinc-100 hover:bg-zinc-200 text-zinc-700 shrink-0" @click="resetFilters">Сбросить фильтры</UButton>
    </template>

    <div class="w-full">
      <p v-if="tasksLoaded && !tasks.length" class="mb-4 px-4 py-8 rounded-2xl bg-white shadow-card text-sm text-zinc-500">Задач пока нет</p>
      <div v-if="mode === 'board'" class="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-5 lg:gap-4 no-scrollbar">
        <section v-for="col in columns" :key="col.key" :class="COL">
          <div class="flex items-center gap-2 px-2 py-2">
            <span class="w-2 h-2 rounded-full" :class="col.dot" />
            <h3 class="text-sm font-semibold tracking-tight truncate">{{ col.title }}</h3>
            <span class="text-xs text-zinc-500 tabular-nums">{{ col.items.length }}</span>
            <NuxtLink v-if="col.add && can('task.create')" to="/tasks/new" aria-label="Добавить задачу" class="ml-auto w-6 h-6 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-black/5 flex items-center justify-center transition">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14M5 12h14" /></svg>
            </NuxtLink>
            <AccessGate v-else-if="col.add && isContractor" :allowed="false" :tip="createTip" class="ml-auto">
              <button type="button" disabled aria-disabled="true" aria-label="Добавить задачу" class="w-6 h-6 rounded-full text-zinc-500 opacity-50 pointer-events-none flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v14M5 12h14" /></svg>
              </button>
            </AccessGate>
          </div>
          <div
            :data-drop="col.key"
            class="flex flex-col gap-2 min-h-28 flex-1 rounded-xl p-0.5 transition"
            :class="hoverZone === col.key && 'bg-accent/10 ring-2 ring-accent/30'"
            @dragover="onDragOver($event, col.key)"
            @drop="onDrop($event, col.key)"
          >
            <TasksCard
              v-for="t in col.items"
              :key="t.id"
              :task="t"
              :me="me"
              :local="col.local"
              :dragging="fadedId === t.id"
              @dragstart="onDragStart($event, t)"
              @dragend="onDragEnd"
              @remove="removeTask(t)"
            />
            <div v-if="!col.items.length" class="rounded-xl border border-dashed border-zinc-300 px-3 py-6 text-center text-xs text-zinc-500">Пусто</div>
          </div>
        </section>
      </div>

      <section v-else class="bg-white rounded-2xl shadow-card overflow-hidden">
        <div class="overflow-x-auto w-full">
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-black/[0.04] text-[11px] font-medium text-zinc-400 uppercase tracking-wider bg-zinc-50/50">
                <th class="px-4 py-3 w-[88px] text-left">
                  <label class="inline-flex items-center gap-2 cursor-pointer normal-case tracking-normal"><input type="checkbox" :checked="allChecked" :indeterminate="someChecked" class="w-4 h-4 rounded border-zinc-300 accent-[#0071e3]" aria-label="Выбрать все" @change="toggleAll(($event.target as HTMLInputElement).checked)">ID</label>
                </th>
                <th class="px-4 py-3 text-left">Задача</th>
                <th class="px-4 py-3 text-left">Проект</th>
                <th class="px-4 py-3 text-left">Направление и этап</th>
                <th class="px-4 py-3 text-left">Статус</th>
                <th class="px-4 py-3 text-left">Исполнитель</th>
                <th class="px-4 py-3 text-left">Дедлайн</th>
                <th class="px-4 py-3 text-center">В отчёт</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="g in groups" :key="g.id">
                <tr class="border-b border-zinc-100">
                  <td colspan="8" class="bg-zinc-50/80 px-4 py-2 font-semibold text-xs text-zinc-700">
                    <button type="button" :aria-expanded="!collapsed.includes(g.id)" class="w-full flex items-center gap-2 text-left hover:text-zinc-900 transition" @click="toggleGroup(g.id)">
                      <span class="inline-flex transition" :class="!collapsed.includes(g.id) && 'rotate-90'">
                        <svg class="w-4 h-4 text-zinc-400 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
                      </span>
                      <span class="w-2 h-2 rounded-full" :class="g.dot" />
                      <span>{{ g.board || g.name }}</span>
                      <span class="font-medium text-zinc-500 tabular-nums">{{ g.items.length }}</span>
                    </button>
                  </td>
                </tr>
                <template v-if="!collapsed.includes(g.id)">
                  <TasksRow v-for="t in g.items" :key="t.id" :task="t" :me="me" :selected="selected.includes(t.id)" @toggle="toggleRow(t.id, $event)" />
                </template>
              </template>
            </tbody>
          </table>
        </div>
        <div v-if="!current.length" class="px-4 lg:px-6 py-14 text-center">
          <div class="mx-auto w-12 h-12 rounded-2xl bg-zinc-100 text-zinc-400 flex items-center justify-center mb-3">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" /></svg>
          </div>
          <h3 class="text-sm font-semibold text-zinc-900">Ничего не найдено</h3>
          <p class="text-xs text-zinc-500 mt-1">{{ EMPTY[focus] }}</p>
          <UButton color="gray" variant="ghost" size="xs" class="mt-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700" @click="resetFilters">Сбросить фильтры</UButton>
        </div>
      </section>

      <div v-if="mode === 'list' && selected.length" class="sticky bottom-24 lg:bottom-6 z-20 mt-4 mx-auto w-fit max-w-full flex items-center gap-2 pl-4 pr-2 py-2 rounded-2xl sm:rounded-full bg-white/90 backdrop-blur-xl shadow-pop ring-1 ring-black/5 text-sm">
        <span class="font-medium whitespace-nowrap">Выбрано <span class="tabular-nums">{{ selected.length }}</span></span>
        <USelect v-model="bulkTo" :options="bulkOptions" placeholder="Перевести в статус…" size="xs" aria-label="Перевести в статус" class="min-w-0" />
        <button type="button" aria-label="Снять выделение" class="shrink-0 px-3 py-1.5 rounded-full text-sm text-zinc-500 hover:text-zinc-900 hover:bg-black/5 transition" @click="selected = []"><span class="hidden sm:inline">Снять выделение</span><span class="sm:hidden" aria-hidden="true">×</span></button>
      </div>
    </div>
  </PageRegistry>
</template>
