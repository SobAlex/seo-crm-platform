import {
  ROLES,
  ROLE_INFO,
  can as canAccess,
  canGrantRole,
  isRole,
  profileOf,
  scopeOf,
  type AccessContext,
  type Action,
  type Role
} from '@crm/access'

export interface DemoUser {
  /** Идентификатор человека в mock-данных (data-assignee, data-creator прототипа). */
  id: string
  name: string
  email: string
  initials: string
  /** Классы бейджа роли. */
  badge: string
  desc: string
  /** Проекты, где человек в команде. */
  projects: string[]
}

export const DEMO_USERS: Record<Role, DemoUser> = {
  owner: { id: 'smirnov', name: 'Александр Смирнов', email: 'alex@romashka.ru', initials: 'АС', badge: 'bg-zinc-900 text-white', desc: 'Делает всё в компании, включая профиль, тариф, смену ролей и удаление компании.', projects: [] },
  seo_head: { id: 'sidorov', name: 'Иван Сидоров', email: 'sidorov@romashka.ru', initials: 'ИС', badge: 'bg-blue-50 text-blue-700', desc: 'Полный доступ, кроме профиля компании, тарифа, смены ролей и удаления компании. Шаблоны и интеграции ему доступны.', projects: ['holod', 'remont'] },
  mgr_head: { id: 'vetrova', name: 'Ольга Ветрова', email: 'vetrova@romashka.ru', initials: 'ОВ', badge: 'bg-violet-50 text-violet-700', desc: 'Тот же доступ, что у руководителя SEO: всё, кроме профиля, тарифа, смены ролей и удаления компании.', projects: ['medlife', 'stroytech'] },
  seo_specialist: { id: 'petrov', name: 'Алексей Петров', email: 'petrov@romashka.ru', initials: 'АП', badge: 'bg-emerald-50 text-emerald-700', desc: 'Проекты своей команды, задачи и отчёты. Без шаблонов, интеграций и профиля компании.', projects: ['holod', 'remont'] },
  account_manager: { id: 'morozov', name: 'Никита Морозов', email: 'morozov@romashka.ru', initials: 'НМ', badge: 'bg-amber-50 text-amber-700', desc: 'Ведёт клиентов и проекты своей команды: задачи, отчёты и портал. Без шаблонов, интеграций и профиля компании.', projects: ['holod', 'remont', 'medlife'] },
  contractor: { id: 'kim', name: 'Мария Ким', email: 'kim@romashka.ru', initials: 'МК', badge: 'bg-zinc-100 text-zinc-700', desc: 'Видит и выполняет только назначенные задачи. Может комментировать их и вести свои часы.', projects: ['holod'] },
  client: { id: 'krylova', name: 'Елена Крылова', email: 'e.krylova@medlife.ru', initials: 'ЕК', badge: 'bg-cyan-50 text-cyan-700', desc: 'Свой проект только для просмотра: результаты, дорожная карта и принятые отчёты.', projects: ['medlife'] }
}

export const COMPANY = { name: 'Ромашка Digital', initials: 'Р', workspace: 'romashka.seo-control.app' }

/** Роли прототипа (assets/app.js) → роли @crm/access. pm и employee — профиль «сотрудник». */
const LEGACY_ROLE: Record<string, Role[]> = {
  owner: ['owner'],
  seo_head: ['seo_head'],
  mgr_head: ['mgr_head'],
  pm: ['account_manager', 'seo_specialist'],
  employee: ['seo_specialist', 'account_manager'],
  contractor: ['contractor'],
  client: ['client']
}

export const STAFF: Role[] = ['owner', 'seo_head', 'mgr_head', 'seo_specialist', 'account_manager']
export const LEADS: Role[] = ['owner', 'seo_head', 'mgr_head']
export const INTERNAL: Role[] = [...STAFF, 'contractor']

export const DENY_TIP = 'Недоступно для вашей роли'
export const TIP_SYSTEM = 'Доступно только руководителю SEO или владельцу компании'
export const TIP_TEAM = 'Действие доступно только участникам команды этого проекта'
export const TIP_ACCEPT = 'Принять задачу может только её постановщик или руководитель'

export function homeFor(role: Role): string {
  const home = ROLE_INFO[role].home
  return home === 'portal' ? '/portal' : home === 'tasks' ? '/tasks' : '/'
}

export function useRole() {
  const cookie = useCookie<string>('seo_role', { default: () => 'owner', sameSite: 'lax' })
  const role = computed<Role>(() => (isRole(cookie.value) ? cookie.value : 'owner'))
  const user = computed(() => DEMO_USERS[role.value])
  const info = computed(() => ROLE_INFO[role.value])
  const profile = computed(() => profileOf(role.value))
  const roleLabel = computed(() => info.value.name)
  const isLead = computed(() => LEADS.includes(role.value))

  function setRole(next: Role) {
    cookie.value = next
  }

  /** Право текущей роли. Без context — есть ли действие хоть в каком-то scope. */
  function can(action: Action, context?: AccessContext): boolean {
    return canAccess(role.value, action, context)
  }

  /** Хотя бы одно из действий доступно. */
  function canAny(...actions: Action[]): boolean {
    return actions.some(a => canAccess(role.value, a))
  }

  /** Видит ли роль все объекты компании по действию (а не только свою команду). */
  function seesWorkspace(action: Action = 'project.view'): boolean {
    return scopeOf(role.value, action) === 'workspace'
  }

  /** data-roles прототипа: список ролей, допускаются старые id (pm, employee). */
  function hasRole(list: readonly string[]): boolean {
    return list.some(id => (LEGACY_ROLE[id] ?? (isRole(id) ? [id] : [])).includes(role.value))
  }

  return {
    role,
    user,
    info,
    profile,
    roleLabel,
    isLead,
    roles: ROLES,
    setRole,
    can,
    canAny,
    seesWorkspace,
    hasRole,
    canGrant: (target: Role) => canGrantRole(role.value, target)
  }
}
