<script setup lang="ts">
// task.html → Сетка 2 (Split): статус и этапы задачи, описание, подзадачи, лента комментариев с редактором;
// сайдбар — учёт времени, ожидание клиента, атрибуты, история.
import { shortName } from '~/constants/directory'
import { COMMENTS_KEY, esc, fmtH, sortKey, stamp, type CommentDraft, type CommentStore, type ReasonOptions, type TaskComment } from '~/types/task'

definePageMeta({ roles: ['owner', 'seo_head', 'mgr_head', 'pm', 'employee', 'contractor'] })
useHead({ title: 'Задача — SEO Control' })

const { can, hasRole, isLead, role, user, roleLabel } = useRole()
const notify = useNotify()
const route = useRoute()

function taskApiId(): string | null {
  const raw = String(route.params.id || '')
  if (raw === '1') return 'tsk_gsc'
  if (/^\d+$/.test(raw)) return null
  return raw
}

async function syncTask(action: 'submit' | 'accept' | 'rework', comment?: string) {
  const id = taskApiId()
  if (!id) return
  try {
    await $fetch(`/api/tasks/${id}/status`, {
      method: 'PUT',
      credentials: 'include',
      body: { action, reason: comment }
    })
    window.dispatchEvent(new Event('notifications:refresh'))
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  }
}

const remoteTitle = ref('')
const remoteLoaded = ref(false)
const taskSaving = ref(false)
const taskAssignees = ref<{ value: string; label: string }[]>([])
const taskEdit = reactive({
  title: '',
  description: '',
  assigneeId: '',
  deadline: '',
  estimate: '',
  spent: '',
  report: false,
  reportNote: '',
  reviewComment: '',
  status: ''
})
const STATUS_LABEL: Record<string, string> = {
  PLANNED: 'Запланирована',
  IN_PROGRESS: 'В работе',
  ON_REVIEW: 'На проверке',
  WAITING_CLIENT: 'Ждёт клиента',
  DONE: 'Принята'
}
const TITLE = computed(() => remoteTitle.value || 'Проверить индексацию в GSC')
const crumbs = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Задачи', to: '/tasks' },
  { label: TITLE.value }
])
const ESTIMATE = 4

/* Лента: обсуждение, списанное время, возврат на доработку и сообщения «В отчёте» */
const SEED: TaskComment[] = [
  { id: 's1', author: 'А. Петров', initials: 'АП', dark: true, role: 'постановщик', time: '12.06, 10:05', hours: 0.3,
    html: 'Берём <b>40 приоритетных URL</b> — список во вложении. Выпавшие из индекса сразу отправляй на переобход.',
    files: [{ name: 'gsc-export.csv', size: 98304 }] },
  { id: 's2', author: 'М. Ким', initials: 'МК', role: 'исполнитель', time: '14.06, 12:20', hours: 1.2,
    html: 'Проверил отчёт «Индексирование»: основной массив в порядке, 3 URL выпали после релиза. Причины выясняю.' },
  { id: 's3', author: 'А. Петров', initials: 'АП', dark: true, role: 'постановщик', time: '14.06, 15:00', report: true,
    html: '<p>Проверили индексацию сайта: <b>92% страниц</b> находятся в поиске Google.</p><ul><li>Три страницы выпали после последнего обновления сайта — отправили их на повторную проверку.</li><li>Служебные страницы скрыты от поиска правильно.</li></ul>' },
  { id: 's4', author: 'М. Ким', initials: 'МК', role: 'исполнитель', time: '14.06, 16:40', hours: 1.0,
    html: 'Сверил проиндексированные страницы с sitemap, выпавшие URL отправил на переобход.' },
  { id: 's5', system: true, text: 'М. Ким передал задачу на проверку · <span class="tabular-nums">14.06, 17:05</span>' },
  { id: 's6', author: 'А. Петров', initials: 'АП', dark: true, role: 'постановщик', time: '15.06, 09:40', remark: true,
    html: 'Добавь таблицу выпавших URL с причинами — без неё не приму. И перепиши текст для отчёта проще, клиенту не нужно слово «canonical».' },
  { id: 's7', system: true, tone: 'amber', text: 'А. Петров вернул задачу на доработку · <span class="tabular-nums">15.06, 09:41</span>' },
  { id: 's8', author: 'М. Ким', initials: 'МК', role: 'исполнитель', time: '16.06, 18:10', hours: 0.5,
    html: 'Таблица выпавших URL с причинами во вложении, текст для отчёта упростил.',
    files: [{ name: 'vypavshie-url.xlsx', size: 22528 }] },
  { id: 's9', system: true, text: 'М. Ким повторно передал задачу на проверку · <span class="tabular-nums">16.06, 18:12</span>' }
]

const SUBTASKS = [
  { title: 'Выгрузить список URL из sitemap', note: '1,0 ч · в отчёт' },
  { title: 'Проверить статус в отчёте «Индексирование»', note: '0,5 ч · в отчёт' },
  { title: 'Сверить количество проиндексированных страниц', note: '0,5 ч' },
  { title: 'Проверить служебные страницы (закрыты от индексации)', note: '0,5 ч' },
  { title: 'Финальная сверка с техническим SEO-аудитом', note: 'принята' }
]
const DONE_WHEN = [
  'Проверены ключевые категории и карточки товаров',
  'Выпавшие из индекса URL переданы в переобход',
  'Результат для клиента написан простым языком и включён в отчёт'
]

/* ---------- Состояние задачи ---------- */
type Status = 'progress' | 'WAITING_CLIENT' | 'review' | 'rework' | 'done'
const task = reactive({
  status: 'review' as Status,
  dates: { planned: '10.06', progress: '12.06', review: '16.06', done: '', waiting: '' },
  returns: [{ date: '15.06', who: 'А. Петров', reason: 'Нет таблицы выпавших URL с причинами, текст для отчёта нужно упростить.' }]
})

const history = ref([
  { id: 'h5', time: '16.06 18:12', text: 'М. Ким повторно передал задачу на проверку', dot: 'bg-amber-500' },
  { id: 'h4', time: '15.06 09:41', text: 'А. Петров вернул задачу на доработку', dot: 'bg-amber-500' },
  { id: 'h3', time: '14.06 16:40', text: 'М. Ким списал 1,0 ч в комментарии', dot: 'bg-zinc-300' },
  { id: 'h2', time: '14.06 15:00', text: 'Комментарий А. Петрова включён в отчёт клиенту', dot: 'bg-zinc-300' },
  { id: 'h1', time: '10.06 09:12', text: 'Задача создана', dot: 'bg-zinc-300' }
])
let historySeq = 0
function addHistory(text: string, dot = 'bg-zinc-300') {
  history.value.unshift({ id: 'n' + (++historySeq), time: stamp(new Date()).replace(',', ''), text, dot })
}

/* ---------- Лента ---------- */
const store = ref<CommentStore>({ items: [], flags: {} })
const events = ref<TaskComment[]>([])

function loadStore(): CommentStore {
  try { return Object.assign({ items: [], flags: {} }, JSON.parse(localStorage.getItem(COMMENTS_KEY) || 'null')) } catch { return { items: [], flags: {} } }
}
function saveStore(): boolean {
  try { localStorage.setItem(COMMENTS_KEY, JSON.stringify(store.value)); return true } catch { return false }
}

/* Единый поток: seed + сохранённые + сессионные события, строго по возрастанию времени */
const all = computed(() =>
  SEED.map(c => (c.id in store.value.flags ? { ...c, report: store.value.flags[c.id] } : c))
    .concat(store.value.items, events.value)
    .sort((a, b) => sortKey(a) - sortKey(b) || String(a.id).localeCompare(String(b.id)))
)
const messages = computed(() => all.value.filter(c => !c.system))
const inReport = computed(() => messages.value.filter(c => c.report).length)

const feed = ref<HTMLElement | null>(null)
function scrollFeed() {
  const toBottom = () => { if (feed.value) feed.value.scrollTop = feed.value.scrollHeight }
  nextTick(() => {
    toBottom()
    requestAnimationFrame(toBottom)
  })
}

function pushEvent(entry: Omit<TaskComment, 'id'> & { id?: string }) {
  const ts = entry.ts ?? Date.now()
  events.value.push({ ...entry, id: entry.id ?? 'e' + ts, ts })
}

const canReport = computed(() => can('report.draft'))
const canWrite = computed(() => can('task.update'))
const draftHours = ref(0)

function onSend(d: CommentDraft) {
  const now = Date.now()
  store.value.items.push({
    id: 'u' + now, ts: now, author: user.value.name, initials: user.value.initials, dark: true, role: roleLabel.value, time: stamp(new Date()),
    html: d.html || `<span class="text-zinc-500">${d.files.length ? 'Вложение' : 'Списано время'}</span>`,
    files: d.files, report: d.report, hours: d.hours || undefined
  })
  const text = (d.html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || (d.hours ? 'Списано время' : 'Комментарий')
  const id = taskApiId()
  if (id && text) {
    void $fetch(`/api/tasks/${id}/comments`, {
      method: 'POST',
      credentials: 'include',
      body: { text, isInReport: !!d.report, hours: d.hours || undefined }
    }).catch((error) => notify(apiErrorMessage(error), 'error'))
  }
  if (!saveStore()) {
    store.value.items[store.value.items.length - 1]!.files?.forEach(f => { delete f.url })
    if (!saveStore()) notify('Не удалось сохранить комментарий в браузере — он останется до перезагрузки', 'warning')
    else notify('Изображения слишком большие для демо-хранилища — сохранены только названия файлов', 'warning')
  }
  draftHours.value = 0
  scrollFeed()
  const extra = d.hours ? ` · списано ${fmtH(d.hours)}` : ''
  notify((d.report ? 'Комментарий добавлен и включён в отчёт клиенту' : 'Комментарий отправлен команде') + extra, 'success')
}

function flip(id: string) {
  const own = store.value.items.find(c => c.id === id) ?? events.value.find(c => c.id === id)
  let now: boolean
  if (own) {
    own.report = !own.report
    now = own.report
  } else {
    const seed = SEED.find(c => c.id === id)
    now = !(id in store.value.flags ? store.value.flags[id] : !!seed?.report)
    store.value.flags[id] = now
  }
  saveStore()
  notify(now ? 'Комментарий включён в отчёт клиенту' : 'Комментарий снят с отчёта', now ? 'success' : 'warning')
}

/* ---------- Жизненный цикл: Запланирована → В работе → Ждёт клиента → На проверке / На доработке → Принята ---------- */
const STATUS: Record<Status, { label: string; badge: string; dot: string }> = {
  progress: { label: 'В работе', badge: 'bg-blue-50 text-blue-700', dot: 'bg-blue-600' },
  WAITING_CLIENT: { label: 'Ждёт клиента', badge: 'bg-sky-50 text-sky-700', dot: 'bg-sky-600' },
  review: { label: 'На проверке', badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-600' },
  rework: { label: 'На доработке', badge: 'bg-amber-500 text-white', dot: 'bg-white' },
  done: { label: 'Принята', badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-600' }
}
const PILL = {
  past: 'bg-zinc-900 text-white',
  current: 'bg-accent text-white',
  waiting: 'bg-sky-500 text-white',
  rework: 'bg-amber-500 text-white',
  done: 'bg-emerald-600 text-white',
  next: 'bg-white border border-zinc-200 text-zinc-500'
} as const
type StepState = keyof typeof PILL

const st = computed(() => STATUS[task.status])
const lastReturn = computed(() => task.returns[task.returns.length - 1])
const steps = computed(() => {
  const s = task.status
  const afterWait = s === 'review' || s === 'rework' || s === 'done'
  const list: { label: string; state: StepState }[] = [
    { label: 'Запланирована', state: 'past' },
    { label: 'В работе', state: s === 'progress' ? 'current' : (s === 'WAITING_CLIENT' || afterWait) ? 'past' : 'next' },
    { label: 'Ждёт клиента', state: s === 'WAITING_CLIENT' ? 'waiting' : afterWait ? 'past' : 'next' },
    { label: s === 'rework' ? 'На доработке' : 'На проверке', state: s === 'rework' ? 'rework' : s === 'review' ? 'current' : s === 'done' ? 'past' : 'next' },
    { label: 'Принята', state: s === 'done' ? 'done' : 'next' }
  ]
  return list
})

/* Исполнитель — М. Ким; постановщик и приёмка — А. Петров, PM или руководство. */
const execOnly = computed(() => user.value.id === 'kim')
const setter = computed(() => !execOnly.value && can('task.review') && (user.value.id === 'petrov' || isLead.value || role.value === 'account_manager'))
const open = computed(() => task.status !== 'done')

const NOW_TIP = 'Сейчас это действие недоступно'
const actionOk = computed(() => ({
  progress: task.status === 'WAITING_CLIENT',
  wait_client: open.value && task.status !== 'WAITING_CLIENT' && task.status !== 'review',
  submit: open.value && task.status !== 'review',
  accept: task.status === 'review',
  rework: task.status === 'review'
}))

const statusNote = computed(() => {
  const waitingReview = execOnly.value && task.status === 'review'
  const hide = (task.status === 'review' && !waitingReview) || task.status === 'progress' || task.status === 'WAITING_CLIENT'
  if (hide) return null
  return {
    cls: waitingReview ? 'bg-amber-50 text-amber-700' : st.value.badge,
    dot: waitingReview ? 'bg-amber-600' : st.value.dot,
    text: waitingReview ? 'На проверке у А. Петрова' : task.status === 'rework' ? 'Ждём исправлений от М. Кима' : 'Принята ' + task.dates.done
  }
})

const reasonPop = ref<{ ask: (anchor: HTMLElement, opts?: ReasonOptions) => Promise<string | null> } | null>(null)

async function act(action: 'progress' | 'wait_client' | 'submit' | 'accept' | 'rework', e?: MouseEvent) {
  if (!actionOk.value[action]) return
  const who = shortName(user.value.name)
  const time = () => `<span class="tabular-nums">${stamp(new Date())}</span>`
  if (action === 'progress') {
    task.status = 'progress'
    task.dates.progress = task.dates.progress || '18.06'
    pushEvent({ system: true, text: `${esc(who)} вернул задачу в работу · ${time()}` })
    addHistory(`${who} перевёл задачу в работу`, 'bg-blue-500')
    scrollFeed()
    return notify('Задача снова в работе', 'success')
  }
  if (action === 'wait_client') {
    task.status = 'WAITING_CLIENT'
    task.dates.waiting = '18.06'
    pushEvent({ system: true, text: `${esc(who)} поставил задачу в ожидание клиента · ${time()}` })
    addHistory(`${who} перевёл задачу в ожидание клиента`, 'bg-sky-500')
    scrollFeed()
    return notify('Задача переведена в статус: Ждёт ответа клиента', 'warning')
  }
  if (action === 'submit') {
    task.status = 'review'
    task.dates.review = '18.06'
    pushEvent({ system: true, text: `${esc(who)} передал задачу на проверку · ${time()}` })
    addHistory(`${who} отправил задачу на проверку`, 'bg-amber-500')
    scrollFeed()
    void syncTask('submit')
    return notify('Задача на проверке · А. Петров получит уведомление', 'success')
  }
  if (action === 'accept') {
    task.status = 'done'
    task.dates.done = '18.06'
    pushEvent({ system: true, tone: 'green', text: `${esc(who)} принял задачу · ${time()}` })
    addHistory(`${who} принял задачу`, 'bg-emerald-500')
    scrollFeed()
    void syncTask('accept')
    return notify('Задача принята · исполнитель уведомлён', 'success')
  }
  const anchor = (e?.currentTarget as HTMLElement | null) ?? document.body
  const reason = await reasonPop.value?.ask(anchor, {
    title: 'Вернуть на доработку',
    sub: `${TITLE.value} · М. Ким`,
    placeholder: 'Обязательно опишите, что исправить — исполнитель увидит это в задаче',
    ok: 'Вернуть'
  })
  if (!reason || !reason.trim() || task.status !== 'review') return
  task.status = 'rework'
  task.returns.push({ date: '18.06', who, reason: reason.trim() })
  const t0 = Date.now()
  pushEvent({ id: 'e' + t0, ts: t0, author: user.value.name, initials: user.value.initials, dark: true, role: 'принимает работу', time: stamp(new Date()), remark: true, html: esc(reason) })
  pushEvent({ id: 'e' + t0 + 'r', ts: t0 + 1, system: true, tone: 'amber', text: `${esc(who)} вернул задачу на доработку · ${time()}` })
  addHistory(`${who} вернул задачу на доработку`, 'bg-amber-500')
  scrollFeed()
  void syncTask('rework', reason.trim())
  notify('Задача отправлена на доработку · исполнитель уведомлён', 'warning')
}

const canSubtask = computed(() => can('task.create') && !hasRole(['contractor']))
const SUBTASK_TIP = 'Подрядчик не может создавать задачи другим участникам'

const requestOpen = ref(false)

async function saveTaskFields() {
  const id = taskApiId()
  if (!id || !taskEdit.title.trim()) return
  taskSaving.value = true
  try {
    await $fetch(`/api/tasks/${id}`, {
      method: 'PUT',
      credentials: 'include',
      body: {
        title: taskEdit.title.trim(),
        description: taskEdit.description.trim(),
        assigneeId: taskEdit.assigneeId || undefined,
        deadline: taskEdit.deadline || undefined,
        estimatedHours: taskEdit.estimate ? Number(taskEdit.estimate) : 0,
        spentHours: taskEdit.spent ? Number(taskEdit.spent) : 0,
        isInReport: taskEdit.report,
        reportNote: taskEdit.reportNote,
        reviewComment: taskEdit.reviewComment
      }
    })
    remoteTitle.value = taskEdit.title.trim()
    notify('Задача сохранена', 'success')
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  } finally {
    taskSaving.value = false
  }
}

onMounted(async () => {
  store.value = loadStore()
  scrollFeed()
  const id = taskApiId()
  if (!id || id === 'tsk_gsc') return
  try {
    const [row, people] = await Promise.all([
      $fetch<{
        title: string
        description: string | null
        assigneeId: string | null
        deadline: string | null
        plannedHours: number
        actualHours: number
        isInReport: boolean
        reportNote: string | null
        reviewComment: string | null
        lifecycleStatus: string
      }>(`/api/tasks/${id}`, { credentials: 'include' }),
      $fetch<Array<{ id: string; name: string }>>('/api/members', { credentials: 'include' })
    ])
    taskAssignees.value = people.map(person => ({ value: person.id, label: person.name }))
    remoteTitle.value = row.title
    taskEdit.title = row.title
    taskEdit.description = row.description || ''
    taskEdit.assigneeId = row.assigneeId || ''
    taskEdit.deadline = row.deadline ? String(row.deadline).slice(0, 10) : ''
    taskEdit.estimate = row.plannedHours ? String(row.plannedHours) : ''
    taskEdit.spent = row.actualHours ? String(row.actualHours) : ''
    taskEdit.report = row.isInReport
    taskEdit.reportNote = row.reportNote || ''
    taskEdit.reviewComment = row.reviewComment || ''
    taskEdit.status = STATUS_LABEL[row.lifecycleStatus] || row.lifecycleStatus
    remoteLoaded.value = true
  } catch { /* карточка прототипа */ }
})
</script>

<template>
  <PageSplit :back="{ to: '/tasks', label: 'Задачи' }" :crumbs="crumbs">
    <template #title>
      <h1 :title="TITLE" class="text-base font-semibold tracking-tight text-ink leading-none truncate max-w-[200px]">{{ TITLE }}</h1>
    </template>

    <template #actions>
      <template v-if="execOnly">
        <AccessGate v-if="task.status === 'WAITING_CLIENT'" :allowed="actionOk.progress" :tip="NOW_TIP">
          <UButton color="white" :disabled="!actionOk.progress" class="whitespace-nowrap" @click="act('progress')">Вернуть в работу</UButton>
        </AccessGate>
        <AccessGate :allowed="actionOk.wait_client" :tip="NOW_TIP">
          <UButton color="white" :disabled="!actionOk.wait_client" class="whitespace-nowrap" @click="act('wait_client')">Ждёт клиента</UButton>
        </AccessGate>
        <AccessGate :allowed="actionOk.submit" :tip="NOW_TIP">
          <UButton :disabled="!actionOk.submit" class="whitespace-nowrap" @click="act('submit')">Сдать на проверку</UButton>
        </AccessGate>
      </template>
      <template v-if="setter">
        <AccessGate :allowed="actionOk.rework" :tip="NOW_TIP">
          <UButton color="white" :disabled="!actionOk.rework" class="whitespace-nowrap" @click="act('rework', $event)">На доработку</UButton>
        </AccessGate>
        <AccessGate :allowed="actionOk.accept" :tip="NOW_TIP">
          <UButton color="black" :disabled="!actionOk.accept" class="whitespace-nowrap" @click="act('accept')">Принять</UButton>
        </AccessGate>
      </template>
      <span v-if="statusNote" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap" :class="statusNote.cls">
        <span class="w-1.5 h-1.5 rounded-full" :class="statusNote.dot" />{{ statusNote.text }}
      </span>
    </template>

    <template #top>
      <div>
        <div class="flex flex-wrap items-center gap-3 mb-2">
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium" :class="st.badge"><span class="w-1.5 h-1.5 rounded-full" :class="st.dot" />{{ st.label }}</span>
          <NuxtLink to="/tasks?direction=audit" class="text-xs text-zinc-500 hover:text-zinc-900 hover:underline">Аудит · Аудит технический</NuxtLink>
        </div>
        <h2 class="text-2xl lg:text-3xl font-semibold tracking-tight">{{ TITLE }}</h2>
        <ol aria-label="Этапы задачи" class="mt-4 flex flex-wrap items-center gap-1.5">
          <li
            v-for="s in steps"
            :key="s.label"
            :aria-current="s.state === 'current' || s.state === 'rework' || s.state === 'waiting' ? 'step' : undefined"
            class="inline-flex items-center h-7 px-3 rounded-full text-[11px] font-medium whitespace-nowrap"
            :class="PILL[s.state]"
          >{{ s.label }}</li>
        </ol>
      </div>
    </template>

    <div v-if="task.status === 'rework' && lastReturn" class="rounded-2xl bg-amber-50 border border-amber-200/80 p-4 flex items-start gap-3">
      <span class="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
      </span>
      <div class="min-w-0 flex-1">
        <div class="text-sm font-semibold text-amber-900">Задача возвращена на доработку постановщиком: <span class="font-medium">{{ lastReturn.reason }}</span></div>
        <UButton v-if="execOnly && open" class="mt-3" @click="act('submit')">Исправлено, сдать на проверку</UButton>
      </div>
    </div>
    <div v-if="lastReturn && task.status !== 'done' && task.status !== 'rework'">
      <div class="flex gap-3 rounded-2xl px-3.5 py-3 bg-white ring-1 ring-black/5">
        <span class="mt-0.5 shrink-0 inline-flex items-center px-1.5 py-0.5 h-fit rounded-md text-[10px] font-semibold bg-amber-500 text-white">REWORK</span>
        <div class="min-w-0 text-sm">
          <div class="text-zinc-700">Возвращалась на доработку · <span class="tabular-nums">{{ lastReturn.date }}</span> · {{ lastReturn.who }}</div>
          <div class="text-xs mt-0.5 text-zinc-500">Причина: {{ lastReturn.reason }}</div>
        </div>
      </div>
    </div>

    <section v-if="remoteLoaded" class="bg-white rounded-2xl shadow-card p-4 lg:p-6 space-y-4">
      <h3 class="text-sm font-semibold tracking-tight">Задача</h3>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UiField label="Название" class="sm:col-span-2"><UInput v-model="taskEdit.title" /></UiField>
        <UiField label="Описание" class="sm:col-span-2"><UTextarea v-model="taskEdit.description" :rows="3" resize /></UiField>
        <UiField label="Исполнитель"><USelect v-model="taskEdit.assigneeId" :options="taskAssignees" placeholder="Не назначен" /></UiField>
        <UiField label="Статус"><UInput :model-value="taskEdit.status" disabled /></UiField>
        <UiField label="Дедлайн"><UInput v-model="taskEdit.deadline" type="date" /></UiField>
        <UiField label="Плановые часы"><UInput v-model="taskEdit.estimate" type="number" min="0" step="0.25" /></UiField>
        <UiField label="Списанные часы"><UInput v-model="taskEdit.spent" type="number" min="0" step="0.25" /></UiField>
        <label class="flex items-center gap-2.5 text-sm text-zinc-700 sm:mt-6">
          <input v-model="taskEdit.report" type="checkbox" class="w-4 h-4 rounded border-zinc-300 text-accent focus:ring-accent accent-accent">
          В отчёт
        </label>
        <UiField label="Заметка к отчёту" class="sm:col-span-2"><UInput v-model="taskEdit.reportNote" /></UiField>
        <UiField label="Причина возврата" class="sm:col-span-2"><UTextarea v-model="taskEdit.reviewComment" :rows="2" resize /></UiField>
      </div>
      <UButton :loading="taskSaving" :disabled="taskSaving" @click="saveTaskFields">Сохранить</UButton>
    </section>
    <section v-else class="bg-white rounded-2xl shadow-card p-4 lg:p-6">
      <h3 class="text-sm font-semibold tracking-tight mb-3">Описание задачи</h3>
      <p class="text-sm text-zinc-700 leading-relaxed">Проверить индексацию ключевых категорий и карточек товаров после внедрения canonical. Убедиться, что служебные страницы закрыты от обхода.</p>
      <div class="mt-4 pt-4 border-t border-zinc-100">
        <div class="text-xs font-medium text-zinc-500 mb-2">Готово, когда</div>
        <ul class="space-y-1.5 text-sm text-zinc-700">
          <li v-for="d in DONE_WHEN" :key="d" class="flex gap-2"><svg class="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" d="M5 13l4 4L19 7" /></svg>{{ d }}</li>
        </ul>
      </div>
    </section>

    <section class="bg-white rounded-2xl shadow-card overflow-hidden">
      <div class="px-4 lg:px-6 py-4 flex items-center justify-between">
        <div>
          <h3 class="text-sm font-semibold tracking-tight">Подзадачи</h3>
        </div>
        <AccessGate :allowed="canSubtask" :tip="SUBTASK_TIP">
          <NuxtLink
            to="/tasks/new"
            :aria-disabled="canSubtask ? undefined : 'true'"
            :tabindex="canSubtask ? undefined : -1"
            class="text-xs text-zinc-500 hover:text-zinc-900 transition"
            :class="!canSubtask && 'opacity-50'"
          >+ Подзадача</NuxtLink>
        </AccessGate>
      </div>
      <ul class="divide-y divide-zinc-100 border-t border-zinc-100">
        <li v-for="s in SUBTASKS" :key="s.title" class="px-4 lg:px-6 py-3 flex items-center justify-between gap-3 hover:bg-zinc-50/50 transition">
          <NuxtLink to="/tasks/1" class="text-sm font-medium hover:underline min-w-0 truncate">{{ s.title }}</NuxtLink>
          <span class="text-xs text-zinc-500 shrink-0">{{ s.note }}</span>
        </li>
      </ul>
    </section>

    <section id="comments" class="bg-white rounded-2xl shadow-card overflow-hidden flex flex-col">
      <div class="px-4 lg:px-6 py-4 flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <div>
          <h3 class="text-sm font-semibold tracking-tight">Комментарии <span class="ml-1 text-xs font-normal text-zinc-500 tabular-nums">{{ messages.length }}</span></h3>
          <p class="text-xs text-zinc-500 mt-0.5">Обсуждение, ход работ и списание времени. Сообщения с отметкой «В отчёте» уходят клиенту.</p>
        </div>
        <NuxtLink v-if="inReport" to="/reports/2025-06" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6M9 17h4M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8l-5-5z" /></svg>
          В отчёте: <span class="tabular-nums">{{ inReport }}</span> · открыть
        </NuxtLink>
      </div>

      <ul ref="feed" class="max-h-[380px] overflow-y-auto overscroll-contain pr-1 divide-y divide-zinc-100 border-t border-zinc-100 [scrollbar-width:thin]">
        <TaskFeedMessage v-for="c in all" :key="c.id" :c="c" :can-report="canReport" @flip="flip" />
      </ul>

      <TaskComposer
        :can-write="canWrite"
        :can-report="canReport"
        :can-track="can('time.log')"
        @send="onSend"
        @draft-hours="draftHours = $event"
      />
    </section>

    <template #aside>
      <TaskTimeWidget :messages="messages" :estimate="ESTIMATE" :draft-hours="draftHours" />

      <section class="bg-white rounded-2xl shadow-card p-4 lg:p-6">
        <h3 class="text-sm font-semibold tracking-tight mb-1">Ожидание клиента</h3>
        <p class="text-xs text-zinc-500 mb-4">Если работа упирается в доступы или согласование, поставьте задачу на паузу: срок не считается просроченным.</p>
        <UButton color="white" block @click="requestOpen = true">Запросить у клиента</UButton>
      </section>

      <section class="bg-white rounded-2xl shadow-card p-4 lg:p-6">
        <h3 class="text-sm font-semibold tracking-tight mb-4">Атрибуты</h3>
        <dl class="space-y-3 text-sm">
          <div class="flex justify-between gap-3">
            <dt class="text-zinc-500">Проект</dt>
            <dd><NuxtLink to="/tasks?project=holod" class="hover:underline">Холод</NuxtLink></dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-zinc-500">Направление</dt>
            <dd class="text-right">Аудит</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-zinc-500">Работа</dt>
            <dd class="text-right"><NuxtLink to="/tasks?work=audit-tech" class="hover:underline">Аудит технический</NuxtLink></dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-zinc-500">Месяц</dt>
            <dd class="text-right tabular-nums">Июнь 2025</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-zinc-500">Исполнитель</dt>
            <dd><NuxtLink to="/tasks?executor=kim" class="hover:underline">М. Ким</NuxtLink></dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-zinc-500">Соисполнители</dt>
            <dd class="text-right text-zinc-500">—</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-zinc-500">Принимает работу</dt>
            <dd><NuxtLink to="/tasks?executor=petrov" class="hover:underline">А. Петров</NuxtLink></dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-zinc-500">Постановщик</dt>
            <dd><NuxtLink to="/tasks?executor=petrov" class="hover:underline">А. Петров</NuxtLink></dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-zinc-500">Приоритет</dt>
            <dd>
              <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                <span class="w-1.5 h-1.5 rounded-full bg-red-600" />Высокий
              </span>
            </dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-zinc-500">Срок</dt>
            <dd class="tabular-nums">18.06.2025</dd>
          </div>
        </dl>
      </section>

      <section class="bg-white rounded-2xl shadow-card p-4 lg:p-6">
        <h3 class="text-sm font-semibold tracking-tight mb-4">История</h3>
        <ul class="space-y-4 text-sm">
          <li v-for="h in history" :key="h.id" class="flex gap-3">
            <span class="w-1.5 h-1.5 rounded-full mt-2 shrink-0" :class="h.dot" />
            <div>
              <div class="text-zinc-500 text-xs tabular-nums">{{ h.time }}</div>
              <div class="text-zinc-700">{{ h.text }}</div>
            </div>
          </li>
        </ul>
      </section>
    </template>

    <TaskClientRequestModal v-model="requestOpen" />
    <TaskReasonPopover ref="reasonPop" />
  </PageSplit>
</template>
