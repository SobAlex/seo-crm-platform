import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ACTIONS,
  GRANTS,
  PROFILES,
  ROLES,
  ROLE_INFO,
  SCOPES,
  can,
  canGrantRole,
  scopeOf,
  type Action,
  type Role,
} from '../src';

const spec = JSON.parse(
  readFileSync(fileURLToPath(new URL('../../../struktura_dostupov.json', import.meta.url)), 'utf8'),
) as {
  roles: { key: string; profile: string }[];
  scopes: Record<string, string>;
  permissions: { key: string }[];
  grants: Record<string, Record<string, string>>;
  grantable_roles: Record<string, string[]>;
};

describe('матрица совпадает со struktura_dostupov.json', () => {
  it('7 ролей с теми же профилями', () => {
    expect(ROLES).toHaveLength(7);
    expect(spec.roles.map((r) => [r.key, r.profile])).toEqual(ROLES.map((r) => [r, ROLE_INFO[r].profile]));
  });

  it('scopes и действия', () => {
    expect([...SCOPES].sort()).toEqual(Object.keys(spec.scopes).sort());
    expect([...ACTIONS]).toEqual(spec.permissions.map((p) => p.key));
  });

  it('grants по каждому профилю', () => {
    for (const action of ACTIONS) {
      for (const profile of PROFILES) {
        expect(GRANTS[action][profile], `${action} / ${profile}`).toBe(spec.grants[action]?.[profile]);
      }
    }
  });

  it('выдача ролей', () => {
    for (const actor of ROLES) {
      const allowed = spec.grantable_roles[ROLE_INFO[actor].profile] ?? [];
      for (const target of ROLES) {
        expect(canGrantRole(actor, target), `${actor} -> ${target}`).toBe(allowed.includes(target));
      }
    }
  });
});

describe('owner', () => {
  it('управляет компанией, тарифом, ролями и удалением', () => {
    for (const action of ['company.profile.manage', 'company.billing.manage', 'company.delete', 'users.assign_role', 'project.delete'] as Action[]) {
      expect(can('owner', action)).toBe(true);
    }
  });

  it('видит чужие проекты компании без членства в команде', () => {
    expect(scopeOf('owner', 'project.view')).toBe('workspace');
    expect(can('owner', 'project.view', { isMember: false })).toBe(true);
    expect(can('owner', 'finance.cost.view', {})).toBe(true);
  });

  it('не видит объекты другой компании', () => {
    expect(can('owner', 'project.view', { sameCompany: false })).toBe(false);
  });

  it('не принимает задачу, где сам исполнитель', () => {
    expect(can('owner', 'task.review', { isAssignee: true })).toBe(false);
    expect(can('owner', 'task.review', {})).toBe(true);
  });

  it('не работает в портале клиента, только предпросмотр', () => {
    expect(can('owner', 'portal.view')).toBe(false);
    expect(can('owner', 'portal.preview')).toBe(true);
  });

  it('не может выдать роль владельца', () => {
    expect(canGrantRole('owner', 'owner')).toBe(false);
    expect(canGrantRole('owner', 'seo_head')).toBe(true);
  });
});

describe('руководители', () => {
  it('всё, кроме профиля компании, тарифа, смены ролей и удаления', () => {
    for (const role of ['seo_head', 'mgr_head'] as Role[]) {
      expect(can(role, 'templates.manage')).toBe(true);
      expect(can(role, 'integrations.manage')).toBe(true);
      expect(can(role, 'company.billing.manage')).toBe(false);
      expect(can(role, 'users.assign_role')).toBe(false);
      expect(can(role, 'project.delete')).toBe(false);
    }
  });
});

describe('employee', () => {
  const employees: Role[] = ['seo_specialist', 'account_manager'];

  it('проекты только из своей команды', () => {
    for (const role of employees) {
      expect(scopeOf(role, 'project.view')).toBe('member');
      expect(can(role, 'project.view', { isMember: true })).toBe(true);
      expect(can(role, 'project.view', { isMember: false })).toBe(false);
      expect(can(role, 'task.update', {})).toBe(false);
    }
  });

  it('создаёт клиентов и проекты в компании', () => {
    expect(can('seo_specialist', 'client.manage', {})).toBe(true);
    expect(can('account_manager', 'project.create', {})).toBe(true);
  });

  it('без шаблонов, интеграций, ставок и приглашений', () => {
    for (const action of ['templates.manage', 'integrations.manage', 'finance.cost.view', 'users.invite', 'company.profile.manage'] as Action[]) {
      expect(can('seo_specialist', action)).toBe(false);
    }
  });

  it('удаляет только свою задачу', () => {
    expect(can('seo_specialist', 'task.delete', { isAuthor: true })).toBe(true);
    expect(can('seo_specialist', 'task.delete', { isMember: true })).toBe(false);
  });

  it('принимает задачу, только если поставил её и не исполнитель', () => {
    expect(can('seo_specialist', 'task.review', { isSetter: true })).toBe(true);
    expect(can('seo_specialist', 'task.review', { isMember: true })).toBe(false);
    expect(can('seo_specialist', 'task.review', { isSetter: true, isAssignee: true })).toBe(false);
  });

  it('подтверждает часы по своей задаче, но не свои', () => {
    expect(can('account_manager', 'time.approve', { isSetter: true })).toBe(true);
    expect(can('account_manager', 'time.approve', { isSetter: true, isAuthor: true })).toBe(false);
  });

  it('автор не принимает свой отчёт', () => {
    expect(can('seo_specialist', 'report.review', { isMember: true })).toBe(true);
    expect(can('seo_specialist', 'report.review', { isMember: true, isAuthor: true })).toBe(false);
  });

  it('не выдаёт роли', () => {
    for (const target of ROLES) expect(canGrantRole('seo_specialist', target)).toBe(false);
  });
});

describe('contractor', () => {
  it('работает только с назначенными задачами', () => {
    expect(can('contractor', 'task.view', { isAssignee: true })).toBe(true);
    expect(can('contractor', 'task.update', { isAssignee: true })).toBe(true);
    expect(can('contractor', 'time.log', { isAssignee: true })).toBe(true);
    expect(can('contractor', 'comment.internal.write', { isAssignee: true })).toBe(true);
    expect(can('contractor', 'task.view', { isMember: true })).toBe(false);
  });

  it('видит свою выплату, но не чек и не маржу', () => {
    expect(can('contractor', 'finance.payout.view', { isAssignee: true })).toBe(true);
    expect(can('contractor', 'finance.fee.view')).toBe(false);
    expect(can('contractor', 'finance.cost.view')).toBe(false);
  });

  it('не открывает проекты, отчёты, аудит и главную', () => {
    for (const action of ['project.view', 'report.view', 'audit.view', 'dashboard.view', 'task.create', 'task.review', 'comment.client.write'] as Action[]) {
      expect(can('contractor', action)).toBe(false);
    }
  });
});

describe('client', () => {
  it('портал только своих проектов', () => {
    expect(scopeOf('client', 'portal.view')).toBe('portal');
    expect(can('client', 'portal.view', { isPortalClient: true })).toBe(true);
    expect(can('client', 'portal.view', { isPortalClient: false })).toBe(false);
    expect(can('client', 'brief.respond', { isPortalClient: true })).toBe(true);
    expect(can('client', 'portal.request.respond', { isPortalClient: true })).toBe(true);
  });

  it('не видит внутренний контур', () => {
    for (const action of ['task.view', 'comment.internal.write', 'time.view', 'finance.fee.view', 'report.view', 'audit.view', 'project.view', 'portal.preview'] as Action[]) {
      expect(can('client', action)).toBe(false);
    }
  });
});

describe('default deny', () => {
  it('неизвестные роль и действие запрещены', () => {
    expect(can('admin' as Role, 'project.view')).toBe(false);
    expect(can('owner', 'project.nuke' as Action)).toBe(false);
    expect(scopeOf('owner', 'project.nuke' as Action)).toBe('deny');
  });
});
