import type { Role } from '@crm/access'
import type { AppIconName } from './icons'
import { INTERNAL, LEADS, STAFF } from '~/composables/useRole'

export interface NavItem {
  id: string
  to: string
  label: string
  icon: AppIconName
  roles: Role[]
}

export const NAV: NavItem[] = [
  { id: 'index', to: '/', label: 'Главная', icon: 'home', roles: STAFF },
  { id: 'projects', to: '/projects', label: 'Проекты', icon: 'folder', roles: STAFF },
  { id: 'tasks', to: '/tasks', label: 'Задачи', icon: 'check', roles: INTERNAL },
  { id: 'reports', to: '/reports', label: 'Отчёты', icon: 'report', roles: STAFF },
  { id: 'clients', to: '/clients', label: 'Клиенты', icon: 'users', roles: STAFF },
  { id: 'executors', to: '/executors', label: 'Сотрудники', icon: 'team', roles: STAFF },
  { id: 'calendar', to: '/calendar', label: 'Календарь', icon: 'calendar', roles: STAFF },
  { id: 'templates', to: '/templates', label: 'Шаблоны', icon: 'layers', roles: LEADS },
  { id: 'portal', to: '/portal', label: 'Мой проект', icon: 'home', roles: ['client'] },
  { id: 'brief', to: '/brief-form', label: 'Бриф', icon: 'check', roles: ['client'] }
]

export const NAV_FOOT: NavItem[] = [
  { id: 'portal', to: '/portal', label: 'Портал клиента', icon: 'eye', roles: STAFF },
  { id: 'landing', to: '/landing', label: 'Сайт продукта', icon: 'globe', roles: STAFF }
]

export const BOTTOM = ['index', 'projects', 'tasks', 'calendar']

export function isActive(item: NavItem, path: string): boolean {
  if (item.to === '/') return path === '/'
  return path === item.to || path.startsWith(item.to + '/')
}
