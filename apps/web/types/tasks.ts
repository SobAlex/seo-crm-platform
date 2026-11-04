// tasks.html: справочники и помощники доски и списка задач.
// Tailwind не сканирует types/, поэтому классы цветов живут в components/tasks и pages/tasks.

export type TaskStatus = 'planned' | 'progress' | 'review' | 'waiting' | 'done'
export type DirId = 'audit' | 'semantic' | 'onpage' | 'offpage' | 'content' | 'dev'
export type TaskFocus = 'all' | 'exec' | 'set'
export type TaskFlag = 'attention' | 'review' | 'overdue' | 'waiting'
export type DueTone = 'wait' | 'none' | 'done' | 'over' | 'soon' | 'ok'

export interface BoardTask {
  id: number | string
  title: string
  project: string
  dir: DirId | null
  assignee: string
  co: string[]
  creator: string
  acceptor: string
  status: TaskStatus
  /** Индекс локального этапа направления (null — работа ещё не начата). */
  stage: number | null
  due: string | null
  report: boolean
  prio?: 'high'
  returned?: boolean
  reviewDays?: number
  wait?: number
  /** Пункт дорожной карты (?work= из project.html). */
  work?: string
  projectLabel?: string
  assigneeName?: string
}

export const PEOPLE: Record<string, [string, string]> = {
  smirnov: ['А. Смирнов', 'АС'], sidorov: ['И. Сидоров', 'ИС'], vetrova: ['О. Ветрова', 'ОВ'],
  morozov: ['Н. Морозов', 'НМ'], petrov: ['А. Петров', 'АП'], dronov: ['И. Дронов', 'ИД'],
  lebedev: ['П. Лебедев', 'ПЛ'], kim: ['М. Ким', 'МК']
}
export const TASK_PROJECTS: Record<string, string> = { holod: 'Холод', remont: 'Ремонт+', medlife: 'МедЛайф', stroytech: 'Стройтех' }

/** Направления и их локальные этапы — те же, что в «Шаблоны → Бизнес-процессы». */
export const DIRS: Record<DirId, { name: string; short: string; steps: string[] }> = {
  audit: { name: 'Аудит', short: 'Аудит', steps: ['Очередь', 'В проверке', 'Отчёт', 'Закрыт'] },
  semantic: { name: 'Семантика', short: 'Семантика', steps: ['Сбор', 'Кластеризация', 'Распределение', 'Готово'] },
  onpage: { name: 'Внутренняя оптимизация', short: 'Внутренняя', steps: ['К выполнению', 'В работе', 'На проверке', 'Готово'] },
  offpage: { name: 'Внешняя оптимизация', short: 'Внешняя', steps: ['Поиск', 'Согласование', 'Размещение', 'Готово'] },
  content: { name: 'Контент', short: 'Контент', steps: ['ТЗ', 'Написание', 'Согласование', 'Опубликовано'] },
  dev: { name: 'Программирование', short: 'Разработка', steps: ['Бэклог', 'В разработке', 'На ревью', 'Выложено'] }
}
export const isDir = (v: unknown): v is DirId => typeof v === 'string' && v in DIRS

/** Глобальный жизненный цикл задачи — одинаков для всех направлений. */
export const STATUSES: { id: TaskStatus; name: string; board?: string }[] = [
  { id: 'planned', name: 'Запланирована' },
  { id: 'progress', name: 'В работе' },
  { id: 'review', name: 'На проверке', board: 'На проверке / Ждёт приёмки' },
  { id: 'waiting', name: 'Ждёт клиента' },
  { id: 'done', name: 'Принята' }
]
export const STATUS_NAME = Object.fromEntries(STATUSES.map(s => [s.id, s.name])) as Record<TaskStatus, string>

/** Пункты дорожной карты (task-form.html → «Пункт дорожной карты»). */
export const WORKS: Record<string, string> = {
  'audit-tech': 'Технический аудит', 'audit-behavior': 'Аудит поведенческих факторов', 'audit-commercial': 'Аудит коммерческих факторов',
  'sem-collect': 'Сбор семантического ядра', 'sem-cluster': 'Кластеризация запросов', 'sem-pages': 'Распределение по страницам',
  'in-meta': 'Оптимизация мета-тегов', 'in-content': 'Написание текстов категорий', 'in-microdata': 'Внедрение микроразметки Schema.org',
  'out-links': 'Размещение внешних ссылок', 'out-crowd': 'Крауд-маркетинг'
}

/** «Сегодня» демо-данных — фиксированная дата, чтобы SSR и клиент совпадали. */
const TODAY = Date.UTC(2025, 5, 18)

export const personName = (id: string) => (PEOPLE[id] ?? [id || '—'])[0]
export const personInitials = (id: string) => (PEOPLE[id] ?? ['', '?'])[1]
export const daysTo = (iso: string) => Math.round((Date.parse(iso + 'T00:00:00Z') - TODAY) / 864e5)
const ddmm = (iso: string) => iso.slice(8, 10) + '.' + iso.slice(5, 7)
export const isOverdue = (t: BoardTask) => !!t.due && t.status !== 'done' && t.status !== 'waiting' && daysTo(t.due) < 0
export const stepsOf = (t: BoardTask) => (t.dir ? DIRS[t.dir].steps : null)

export interface DueInfo { text: string; sub?: string; tone: DueTone }

export function dueOf(t: BoardTask): DueInfo {
  if (t.status === 'waiting') return { text: 'пауза', sub: 'ждём ' + (t.wait || 0) + ' дн.', tone: 'wait' }
  if (!t.due) return { text: '—', tone: 'none' }
  const d = daysTo(t.due)
  const text = ddmm(t.due)
  if (t.status === 'done') return { text, tone: 'done' }
  if (d < 0) return { text, sub: 'просрочена ' + -d + ' дн.', tone: 'over' }
  if (d === 0) return { text, sub: 'сегодня', tone: 'soon' }
  if (d <= 3) return { text, sub: 'через ' + d + ' дн.', tone: 'soon' }
  return { text, tone: 'ok' }
}

export const FLAGS: Record<TaskFlag, [string, (t: BoardTask) => boolean]> = {
  attention: ['Требуют внимания', t => isOverdue(t) || !!t.returned || t.status === 'waiting'],
  review: ['На проверке', t => t.status === 'review'],
  overdue: ['Просроченные', t => isOverdue(t)],
  waiting: ['Ждут клиента', t => t.status === 'waiting']
}
export const isFlag = (v: unknown): v is TaskFlag => typeof v === 'string' && v in FLAGS
