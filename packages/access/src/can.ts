import { GRANTS, isAction, type Action } from './permissions';
import { isRole, profileOf, type Profile, type Role } from './roles';
import type { Scope } from './scopes';

/** Отношение пользователя к конкретному объекту. Не переданный флаг считается false. */
export interface AccessContext {
  /** Объект принадлежит компании пользователя. По умолчанию true: tenancy фильтрует запрос. */
  sameCompany?: boolean;
  /** Пользователь в команде проекта (seo_lead, optimizer, account_manager, member). */
  isMember?: boolean;
  /** Пользователь поставил эту задачу. */
  isSetter?: boolean;
  /** Пользователь исполнитель или соисполнитель задачи. */
  isAssignee?: boolean;
  /** Пользователь автор записи: задачи, часов, отчёта. */
  isAuthor?: boolean;
  /** У пользователя связь client с проектом. */
  isPortalClient?: boolean;
}

export function scopeOf(role: Role, action: Action): Scope {
  if (!isRole(role) || !isAction(action)) return 'deny';
  return GRANTS[action][profileOf(role)];
}

function matchesScope(scope: Scope, ctx: AccessContext): boolean {
  switch (scope) {
    case 'workspace':
      return true;
    case 'member':
      return ctx.isMember === true;
    case 'setter':
      return ctx.isSetter === true;
    case 'assigned':
      return ctx.isAssignee === true;
    case 'self':
      return ctx.isAuthor === true;
    case 'portal':
      return ctx.isPortalClient === true;
    case 'deny':
      return false;
  }
}

type Restriction = (profile: Profile, ctx: AccessContext) => boolean;

/** Ограничения из constraints, которые режут даже открытый scope. */
const RESTRICTIONS: Partial<Record<Action, Restriction>> = {
  'task.review': (_, ctx) => ctx.isAssignee === true,
  'report.review': (_, ctx) => ctx.isAuthor === true,
  'time.approve': (profile, ctx) => profile === 'employee' && ctx.isAuthor === true,
};

/**
 * Проверка права.
 * Без context отвечает, есть ли у роли действие хоть в каком-то scope (для меню и кнопок).
 * С context проверяет доступ к конкретному объекту.
 */
export function can(role: Role, action: Action, context?: AccessContext): boolean {
  const scope = scopeOf(role, action);
  if (scope === 'deny') return false;
  if (context === undefined) return true;
  if (context.sameCompany === false) return false;
  if (!matchesScope(scope, context)) return false;
  const restricted = RESTRICTIONS[action];
  return !(restricted && restricted(profileOf(role), context));
}
