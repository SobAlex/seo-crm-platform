import { ForbiddenException } from '@nestjs/common';
import { can, isRole, profileOf, type Action, type Role } from '@crm/access';
import { AuthPayload } from './auth/auth.types';

/** Роль из JWT (pm, employee) → роль матрицы @crm/access. */
export function accessRole(dbRole: string): Role {
  if (dbRole === 'pm') return 'account_manager';
  if (dbRole === 'employee') return 'seo_specialist';
  if (isRole(dbRole)) return dbRole;
  return 'client';
}

export function assertCan(actor: AuthPayload, action: Action): Role {
  const role = accessRole(actor.role);
  if (!can(role, action)) throw new ForbiddenException('Недостаточно прав');
  return role;
}

export function assertOwnerOrHead(actor: AuthPayload): void {
  const profile = profileOf(accessRole(actor.role));
  if (profile !== 'owner' && profile !== 'head') {
    throw new ForbiddenException('Только владелец или руководитель могут выполнить это действие');
  }
}
