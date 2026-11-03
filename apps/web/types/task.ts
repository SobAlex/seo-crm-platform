// Лента задачи (task.html): комментарии, системные события, вложения и списанное время.

export interface TaskFile {
  id?: string
  name: string
  size?: number
  /** dataURL картинки — превью и галерея в ленте. */
  url?: string
}

export interface TaskComment {
  id: string
  /** Момент создания (ms) у сообщений сессии; у seed время берётся из time / text. */
  ts?: number
  system?: boolean
  tone?: 'amber' | 'green'
  /** Текст системного события (доверенный HTML). */
  text?: string
  author?: string
  initials?: string
  dark?: boolean
  role?: string
  time?: string
  hours?: number
  /** Очищенный HTML комментария. */
  html?: string
  files?: TaskFile[]
  report?: boolean
  remark?: boolean
}

/** SEOApp.comments прототипа: свои комментарии и переключатели «В отчёт» у seed. */
export interface CommentStore {
  items: TaskComment[]
  flags: Record<string, boolean>
}

export interface CommentDraft {
  html: string
  files: TaskFile[]
  hours: number
  report: boolean
}

export interface ReasonOptions {
  title?: string
  sub?: string
  placeholder?: string
  ok?: string
}

export const COMMENTS_KEY = 'seo_task_comments_1'

export const esc = (s: unknown) =>
  String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!)

const pad = (n: number) => String(n).padStart(2, '0')
/** Демо-дата ленты: «18.06, ЧЧ:ММ». */
export const stamp = (d: Date) => `18.06, ${pad(d.getHours())}:${pad(d.getMinutes())}`

export const fmtH = (h: number) => (Math.round(h * 10) / 10).toString().replace('.', ',') + ' ч'

export const fmtSize = (b?: number) =>
  b == null ? '' : b >= 1048576 ? (b / 1048576).toFixed(1).replace('.', ',') + ' МБ' : Math.max(1, Math.round(b / 1024)) + ' КБ'

/** «ДД.ММ, ЧЧ:ММ» → ms (демо-год 2025) для хронологии ленты. */
export function parseStamp(s?: string): number {
  const m = String(s || '').match(/(\d{1,2})\.(\d{1,2}),?\s*(\d{1,2}):(\d{2})/)
  if (!m) return 0
  return Date.UTC(2025, Number(m[2]) - 1, Number(m[1]), Number(m[3]), Number(m[4]))
}

export function sortKey(c: TaskComment): number {
  if (c.ts != null && !Number.isNaN(c.ts)) return Number(c.ts)
  if (c.time) return parseStamp(c.time)
  if (c.system && c.text) return parseStamp(c.text)
  return 0
}
