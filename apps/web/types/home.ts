import type { Action } from '@crm/access'

/** Строка ленты «Главной» (data-task прототипа). */
export interface HomeTask {
  id?: number
  title: string
  project: string
  dir?: string
  assignee: string
  /** Соисполнитель (data-co). */
  co?: string
  /** Постановщик (data-creator). */
  creator?: string
  /** Кто принимает (data-acceptor); пусто — постановщик. */
  acceptor?: string
  days?: number
  due?: string
  prio?: boolean
  /** Ссылка вместо карточки задачи (отчёт, интеграция). */
  href?: string
  tag?: string
  /** Причина в «Требует внимания». */
  reason?: 'overdue' | 'waiting' | 'returned'
  /** Подпись просрочки: «Просрочен» вместо «Просрочена». */
  noun?: string
  /** data-can строки. */
  can?: Action
}

export type HomeSortKey = 'task' | 'project' | 'setter' | 'assignee' | 'status' | 'due'
