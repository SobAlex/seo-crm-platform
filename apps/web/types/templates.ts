// templates.html: типы и mock-данные библиотеки шаблонов (типы проектов, дорожные карты, месячные планы, бизнес-процессы, бриф).
import { plural } from '~/utils/proto'

export type WorkRole = 'seo' | 'pm' | 'contractor'

export interface ProjectType {
  id: string
  name: string
  color: TypeColor
  desc: string
}

export interface RoadmapWork {
  id: string
  title: string
  role: WorkRole
  hours: number
}

export interface RoadmapDirection {
  id: string
  name: string
  works: RoadmapWork[]
}

export interface Roadmap {
  id: string
  type: string
  name: string
  desc: string
  open: boolean
  /** Подсветка только что созданной или скопированной карты. */
  ring?: boolean
  /** Показывать номера работ 1.1, 1.2… (карты из конструктора). */
  codes?: boolean
  directions: RoadmapDirection[]
}

export interface PlanRow {
  id: string
  /** Подпись направления слева («1.1 · Аудит», «— Не привязано —»). */
  label: string
  title: string
  role: WorkRole
  hours: number
}

export interface MonthPlan {
  id: string
  type: string
  name: string
  /** Номер месяца в бейдже «Тип: … · Месяц N». */
  month?: number
  desc: string
  open: boolean
  ring?: boolean
  /** Строка «Дублировать · Редактировать · Удалить». */
  actions: boolean
  /** Форма «Добавить задачу» внизу карточки. */
  quickAdd: boolean
  rows: PlanRow[]
}

/** Задача в редакторе месячного плана (модалки создания и редактирования). */
export interface PlanItem {
  code?: string
  dir?: string
  title: string
  role: WorkRole
  hours: number
}

export interface PlanDraft {
  type: string
  name: string
  desc: string
  items: PlanItem[]
}

export interface BriefQuestion {
  id: string
  text: string
  placeholder?: string
  /** Подпись над вариантами; без вариантов — пояснение «Клиент ответит свободным текстом». */
  optionsLabel: string
  options: { id: string; value: string; placeholder?: string }[]
}

export const TIP_MANAGE = 'Управление библиотекой шаблонов доступно только Руководителю SEO или Владельцу'
export const TIP_DELETE = 'Удаление шаблонов доступно только Руководителю SEO или Владельцу'

export const CONFIRM_TEMPLATE = {
  title: 'Удалить шаблон?',
  text: 'Шаблон будет удалён из библиотеки. Связанные проекты сохранят уже скопированные карты и планы.',
  ok: 'Удалить',
  toast: 'Шаблон удалён'
}
export const CONFIRM_WORK = {
  title: 'Удалить работу из шаблона?',
  text: 'Работа исчезнет из шаблона дорожной карты. Уже созданные задачи в проектах не затронутся.',
  ok: 'Удалить',
  toast: 'Работа удалена из шаблона'
}
export const CONFIRM_ITEM = {
  title: 'Удалить элемент шаблона?',
  text: 'Элемент будет удалён из библиотеки шаблонов. Уже созданные проекты не затронутся.',
  ok: 'Удалить',
  toast: 'Удалено'
}
export const CONFIRM_DIRECTION = {
  title: 'Удалить направление?',
  text: 'Вместе с направлением удалятся его работы. Задачи в действующих проектах останутся.',
  ok: 'Удалить',
  toast: 'Направление удалено'
}

// Классы Tailwind здесь не держим: каталог types/ не входит в content-сканирование, карты классов — в компонентах.
export type TypeColor = 'violet' | 'emerald' | 'blue' | 'amber' | 'cyan' | 'rose'
export const TYPE_COLORS: TypeColor[] = ['violet', 'emerald', 'blue', 'amber', 'cyan', 'rose']

/** Короткая подпись бейджа дорожной карты. */
export const TYPE_LABEL: Record<string, string> = {
  ecommerce: 'E-commerce',
  info: 'Контент',
  landing: 'Landing',
  b2b: 'B2B',
  services: 'Услуги'
}

/** Длина карты в бейдже над месячными планами. */
export const TYPE_MONTHS: Record<string, string> = {
  ecommerce: '6 месяцев',
  info: '6 месяцев',
  landing: '3 месяца',
  b2b: '6 месяцев',
  services: '6 месяцев'
}

export const ROLE_LABEL: Record<WorkRole, string> = {
  seo: 'SEO-специалист',
  pm: 'Менеджер проекта',
  contractor: 'Подрядчик'
}
export const ROLE_OPTIONS = (Object.keys(ROLE_LABEL) as WorkRole[]).map(r => ({ value: r, label: ROLE_LABEL[r] }))

type DirSeed = [string, [string, WorkRole, number][]]

/** Дорожные карты по типам проекта: направление N, работа N.M. Из них собираются месячные планы. */
export const ROADMAP_WORKS: Record<string, DirSeed[]> = {
  ecommerce: [
    ['Аудит', [['Аудит технический', 'seo', 8], ['Аудит коммерческих факторов', 'seo', 6], ['Аудит ассортимента', 'seo', 4], ['Конкурентный анализ', 'seo', 4]]],
    ['Семантика', [['Сбор маркеров', 'seo', 4], ['Сбор семантики', 'seo', 10], ['Кластеризация', 'seo', 6], ['Распределение по страницам', 'seo', 4]]],
    ['Внутренняя оптимизация', [['Оптимизация метаданных', 'seo', 4], ['Оптимизация текстов', 'contractor', 4], ['Перелинковка', 'seo', 4]]],
    ['Внешняя оптимизация', [['Поиск подходящих конкурентов', 'seo', 4], ['Сбор ссылочного профиля конкурентов', 'contractor', 4], ['Стратегия по наращиванию ссылок', 'contractor', 4]]]
  ],
  info: [
    ['Аудит', [['Аудит технический', 'seo', 6], ['Аудит контента', 'seo', 6], ['Аудит поведенческих факторов', 'seo', 4]]],
    ['Семантика', [['Сбор маркеров', 'seo', 4], ['Сбор семантики', 'seo', 8], ['Кластеризация', 'seo', 6], ['Контент-план', 'contractor', 6]]],
    ['Продвижение', [['Внутренняя перелинковка', 'seo', 4], ['Внешние упоминания', 'seo', 4], ['Отчёт по видимости', 'seo', 2]]]
  ],
  landing: [
    ['Аудит', [['Аудит технический', 'seo', 4], ['Аудит конверсии', 'seo', 4], ['Проверка скорости загрузки', 'seo', 2]]],
    ['Оптимизация', [['Микроразметка', 'seo', 3], ['Скорость посадочной', 'seo', 4], ['Тексты оффера', 'contractor', 4]]]
  ],
  b2b: [
    ['Аудит', [['Аудит технический', 'seo', 8], ['Аудит коммерческих факторов', 'seo', 6]]],
    ['Семантика', [['Сбор семантики', 'seo', 10], ['Кластеризация', 'seo', 6]]],
    ['Запуск', [['Доступы к GSC и Метрике', 'pm', 2], ['Тексты отраслевых страниц', 'contractor', 8]]]
  ],
  services: [
    ['Аудит', [['Аудит технический', 'seo', 6], ['Аудит конверсии', 'seo', 4]]],
    ['Семантика', [['Сбор семантики', 'seo', 8], ['Распределение по страницам', 'seo', 4]]],
    ['Страницы', [['Тексты услуг', 'contractor', 8], ['Перелинковка', 'seo', 4]]]
  ]
}

export interface CodedWork {
  code: string
  dir: string
  dirCode: number
  title: string
  role: WorkRole
  hours: number
}

export function roadmapWorks(type: string): CodedWork[] {
  return (ROADMAP_WORKS[type] ?? []).flatMap(([dir, works], d) =>
    works.map(([title, role, hours], w) => ({ code: `${d + 1}.${w + 1}`, dir, dirCode: d + 1, title, role, hours }))
  )
}
export const findWork = (type: string, code: string) => roadmapWorks(type).find(w => w.code === code)

export const hoursText = (h: number) => String(Math.round(h * 100) / 100).replace('.', ',')
/** Часы строки плана: «8,0 ч», «4,25 ч». */
export const rowHours = (h: number) => h.toLocaleString('ru-RU', { minimumFractionDigits: 1, maximumFractionDigits: 2 })

export const count = (n: number, forms: [string, string, string]) => `${n} ${plural(n, forms)}`
export const TASKS: [string, string, string] = ['задача', 'задачи', 'задач']
export const WORKS: [string, string, string] = ['работа', 'работы', 'работ']
export const DIRECTIONS: [string, string, string] = ['направление', 'направления', 'направлений']

export function initialTypes(): ProjectType[] {
  return [
    { id: 'ecommerce', name: 'Интернет-магазин', color: 'violet', desc: 'Проекты для интернет-магазинов и маркетплейсов.' },
    { id: 'info', name: 'Информационный сайт', color: 'emerald', desc: '' },
    { id: 'landing', name: 'Лендинг', color: 'blue', desc: '' },
    { id: 'b2b', name: 'B2B портал', color: 'amber', desc: '' },
    { id: 'services', name: 'Сайт услуг', color: 'cyan', desc: '' }
  ]
}

const ROADMAP_DESC: Record<string, string> = {
  ecommerce: 'Карта для интернет-магазинов и маркетплейсов.',
  info: 'Карта для блогов, медиа, информационных порталов.',
  landing: 'Компактный набор для одностраничных сайтов.',
  b2b: 'Длинный цикл сделки: семантика, посадочные под отрасли, доступы клиента.',
  services: 'Локальные услуги: семантика, страницы услуг, тексты.'
}

export function initialRoadmaps(types: ProjectType[]): Roadmap[] {
  return types.map((t, i) => ({
    id: `rm-${t.id}`,
    type: t.id,
    name: `Дорожная карта · ${t.name}`,
    desc: ROADMAP_DESC[t.id] ?? '',
    open: i === 0,
    directions: (ROADMAP_WORKS[t.id] ?? []).map(([name, works], d) => ({
      id: `rm-${t.id}-${d}`,
      name,
      works: works.map(([title, role, hours], w) => ({ id: `rm-${t.id}-${d}-${w}`, title, role, hours }))
    }))
  }))
}

type RowSeed = [string, string, WorkRole, number]
interface PlanSeed { type: string; name: string; month: number; desc: string; open?: boolean; first?: boolean; rows: RowSeed[] }
const PLANS: PlanSeed[] = [
  { type: 'ecommerce', name: 'Запуск магазина', month: 1, desc: 'Аудит, семантика, первые правки.', open: true, first: true, rows: [
    ['Аудит', 'Аудит технический', 'seo', 8], ['Семантика', 'Сбор семантики', 'seo', 10], ['Внутренняя', 'Перелинковка', 'seo', 4], ['— Не привязано —', 'Настроить доступы к GSC и Метрике', 'pm', 4]
  ] },
  { type: 'ecommerce', name: 'Каталог', month: 2, desc: 'Метаданные, тексты и перелинковка.', rows: [
    ['Внутренняя', 'Оптимизация метаданных', 'seo', 4], ['Внутренняя', 'Оптимизация текстов', 'contractor', 4], ['Внутренняя', 'Перелинковка', 'seo', 4]
  ] },
  { type: 'ecommerce', name: 'Ссылки', month: 3, desc: 'Внешняя оптимизация отдаётся подрядчику.', rows: [
    ['Внешняя', 'Поиск подходящих конкурентов', 'seo', 4], ['Внешняя', 'Сбор ссылочного профиля конкурентов', 'contractor', 4], ['Внешняя', 'Стратегия по наращиванию ссылок', 'contractor', 4]
  ] },
  { type: 'ecommerce', name: 'Удержание', month: 4, desc: 'Повторный срез и распределение запросов.', rows: [
    ['Аудит', 'Конкурентный анализ', 'seo', 4], ['Семантика', 'Распределение по страницам', 'seo', 4]
  ] },
  { type: 'info', name: 'Запуск контента', month: 1, desc: 'Аудит, семантика, контент-план.', open: true, first: true, rows: [
    ['Аудит', 'Аудит технический', 'seo', 6], ['Семантика', 'Сбор семантики', 'seo', 10], ['Продвижение', 'Контент-план', 'contractor', 6]
  ] },
  { type: 'info', name: 'Контент', month: 2, desc: 'Тексты готовит подрядчик, план ведёт специалист.', rows: [
    ['Продвижение', 'Контент-план', 'contractor', 4], ['Аудит', 'Аудит контента', 'seo', 4]
  ] },
  { type: 'landing', name: 'Аудит и запуск', month: 1, desc: 'Технический аудит, конверсия, скорость.', open: true, first: true, rows: [
    ['Аудит', 'Аудит технический', 'seo', 4], ['Аудит', 'Аудит конверсии', 'seo', 4], ['Оптимизация', 'Микроразметка', 'seo', 6]
  ] },
  { type: 'landing', name: 'Конверсия', month: 2, desc: 'Посадочная и микроразметка.', rows: [
    ['Аудит', 'Аудит конверсии', 'seo', 4], ['Оптимизация', 'Микроразметка', 'seo', 4]
  ] },
  { type: 'b2b', name: 'Запуск портала', month: 1, desc: 'Аудит, семантика и доступы клиента.', rows: [
    ['Аудит', 'Аудит технический', 'seo', 4], ['Семантика', 'Сбор семантики', 'seo', 4], ['Запуск', 'Доступы к GSC и Метрике', 'pm', 4]
  ] },
  { type: 'services', name: 'Страницы услуг', month: 1, desc: 'Семантика и тексты услуг.', rows: [
    ['Аудит', 'Аудит технический', 'seo', 4], ['Семантика', 'Сбор семантики', 'seo', 4], ['Страницы', 'Тексты услуг', 'contractor', 4]
  ] }
]

/** Подпись направления дополняется номером работы из карты: «Аудит» → «1.1 · Аудит». */
function codedLabel(type: string, label: string, title: string): string {
  const w = roadmapWorks(type).find(x => x.title === title)
  return w ? `${w.code} · ${label}` : label
}

export function initialPlans(): MonthPlan[] {
  return PLANS.map((p, i) => ({
    id: `plan-${i}`,
    type: p.type,
    name: p.name,
    month: p.month,
    desc: p.desc,
    open: !!p.open,
    actions: !!p.first,
    quickAdd: !!p.first,
    rows: p.rows.map(([label, title, role, hours], j) => ({ id: `plan-${i}-${j}`, label: codedLabel(p.type, label, title), title, role, hours }))
  }))
}

/** Строки карточки плана → задачи редактора (по названию находим работу карты). */
export function planToItems(plan: MonthPlan): PlanItem[] {
  return plan.rows.map(r => {
    const w = roadmapWorks(plan.type).find(x => x.title === r.title)
    return w ? { code: w.code, dir: w.dir, title: w.title, role: w.role, hours: r.hours } : { title: r.title, role: r.role, hours: r.hours }
  })
}

/** Задачи редактора → строки карточки плана. */
export function itemsToRows(items: PlanItem[], prefix: string): PlanRow[] {
  return items.map((it, i) => ({
    id: `${prefix}-${i}`,
    label: it.code ? `${it.code} · ${it.dir}` : '— Не привязано —',
    title: it.title,
    role: it.role,
    hours: it.hours
  }))
}

export function initialWorkflows(): Record<string, string[]> {
  return {
    'Семантика': ['Сбор', 'Кластеризация', 'Распределение', 'Готово'],
    'Программирование': ['Бэклог', 'В разработке', 'На ревью', 'Выложено'],
    'Аудит': ['Очередь', 'В проверке', 'Отчёт', 'Закрыт'],
    'Внутренняя оптимизация': ['К выполнению', 'В работе', 'На проверке', 'Готово'],
    'Внешняя оптимизация': ['Поиск', 'Согласование', 'Размещение', 'Готово'],
    'Контент': ['ТЗ', 'Написание', 'Согласование', 'Опубликовано']
  }
}
export const WORKFLOW_DEFAULT = ['К выполнению', 'В работе', 'Готово']
export const WORKFLOW_ORDER = ['Аудит', 'Семантика', 'Внутренняя оптимизация', 'Внешняя оптимизация', 'Контент', 'Программирование']

export function initialBrief(): BriefQuestion[] {
  return [
    { id: 'q1', text: 'Какая главная цель на ближайшие 3 месяца?', optionsLabel: 'Варианты ответа', options: [
      { id: 'q1a', value: 'Рост органического трафика' }, { id: 'q1b', value: 'Заявки из поиска' }, { id: 'q1c', value: 'Выход в топ по категориям' }
    ] },
    { id: 'q2', text: 'Какие доступы уже есть у команды?', optionsLabel: 'Варианты ответа, можно выбрать несколько', options: [
      { id: 'q2a', value: 'Яндекс Метрика' }, { id: 'q2b', value: 'Google Search Console' }, { id: 'q2c', value: 'Админка сайта' }
    ] },
    { id: 'q3', text: 'Что важно учесть по ассортименту и сезонности?', optionsLabel: 'Клиент ответит свободным текстом.', options: [] }
  ]
}

/** Новый id для объектов, созданных на клиенте (только в обработчиках событий). */
export const newId = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
