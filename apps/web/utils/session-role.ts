import { isRole, type Role } from '@crm/access'

/** Роль из базы (pm, employee) → роль матрицы прав. */
export function accessRoleOf(dbRole: string): Role {
  if (dbRole === 'pm') return 'account_manager'
  if (dbRole === 'employee') return 'seo_specialist'
  if (isRole(dbRole)) return dbRole
  return 'owner'
}

const DB_ROLE_LABEL: Record<string, string> = {
  owner: 'Владелец компании',
  seo_head: 'Руководитель SEO',
  mgr_head: 'Руководитель менеджеров',
  pm: 'Менеджер по клиентам',
  employee: 'SEO-специалист',
  contractor: 'Подрядчик',
  client: 'Клиент'
}

export function dbRoleLabel(dbRole: string): string {
  return DB_ROLE_LABEL[dbRole] ?? dbRole
}

export function personName(user: { firstName: string; lastName: string }): string {
  return `${user.firstName} ${user.lastName}`.trim()
}

export function personInitials(user: { firstName: string; lastName: string }): string {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase()
}

export function apiErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'data' in error) {
    const message = (error as { data?: { message?: unknown } }).data?.message
    if (Array.isArray(message)) return message.map(String).join('. ')
    if (typeof message === 'string' && message) return message
  }
  return 'Не удалось связаться с сервером'
}
