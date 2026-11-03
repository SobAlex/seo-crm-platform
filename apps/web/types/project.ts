// Карточка проекта (project.html) и её окна: команда, факт, источники.
import type { MetricSeries } from '~/types/ui'

export type MetricKey = 'traffic' | 'leads' | 'top10'

export interface ProjectMetrics {
  months: string[]
  series: Record<MetricKey, MetricSeries>
}

export interface FactSaved {
  index: number
  month: string
  values: Record<MetricKey, number>
}

export interface SourceConnected {
  type: 'metrika' | 'webmaster' | 'gsc' | 'callibri'
  name: string
  id: string
  account: string
}

export interface TeamPerson {
  id: string
  name: string
}

export interface TeamMember {
  id: string
  name: string
  initials: string
  note: string
  role: string
  tone: string
  /** Аватар: bg-zinc-900 text-white у сотрудников, bg-zinc-200 text-zinc-700 у подрядчика. */
  avatar: string
  isNew?: boolean
}

/** Роли в команде проекта (PROJECT_ROLES в assets/modals.js). */
export const PROJECT_ROLES = [
  { id: 'seo_head', name: 'Руководитель SEO', short: 'Рук. SEO', tone: 'bg-blue-50 text-blue-700' },
  { id: 'pm', name: 'Менеджер проекта', short: 'Менеджер', tone: 'bg-amber-50 text-amber-700' },
  { id: 'employee', name: 'SEO-специалист', short: 'SEO-специалист', tone: 'bg-emerald-50 text-emerald-700' },
  { id: 'contractor', name: 'Подрядчик', short: 'Подрядчик', tone: 'bg-zinc-100 text-zinc-700' }
] as const

export type ProjectRole = (typeof PROJECT_ROLES)[number]

/** Тон бейджа роли по подписи (ROLE_TONE в project.html). */
export const ROLE_TONE: Record<string, string> = {
  'Руководитель SEO': 'bg-blue-50 text-blue-700',
  'Рук. SEO': 'bg-blue-50 text-blue-700',
  'Менеджер проекта': 'bg-amber-50 text-amber-700',
  'Менеджер': 'bg-amber-50 text-amber-700',
  'SEO-специалист': 'bg-emerald-50 text-emerald-700',
  'Подрядчик': 'bg-zinc-100 text-zinc-700'
}

const KPI_STORE = 'seo_project_kpis_holod'
const KPI_ALLOWED: MetricKey[] = ['traffic', 'leads', 'top10']
const KPI_FALLBACK: MetricKey[] = ['traffic', 'leads']

function normalizeKpis(list: unknown): MetricKey[] {
  const picked = Array.isArray(list) ? list : []
  const out = KPI_ALLOWED.filter(id => picked.includes(id))
  return out.length ? out : [...KPI_FALLBACK]
}

/** Метрики проекта из localStorage (getProjectKpis прототипа). Только на клиенте. */
export function readProjectKpis(): MetricKey[] {
  let raw: string | null = null
  try { raw = localStorage.getItem(KPI_STORE) } catch { /* ignore */ }
  if (!raw) {
    try {
      const legacy = localStorage.getItem('seo_primary_kpi_holod')
      if (legacy) return normalizeKpis([legacy])
    } catch { /* ignore */ }
    return [...KPI_FALLBACK]
  }
  try {
    const parsed = JSON.parse(raw)
    return normalizeKpis(Array.isArray(parsed) ? parsed : [parsed])
  } catch {
    return normalizeKpis([raw])
  }
}

export function writeProjectKpis(list: string[]): MetricKey[] {
  const kpis = normalizeKpis(list)
  try { localStorage.setItem(KPI_STORE, JSON.stringify(kpis)) } catch { /* ignore */ }
  return kpis
}
