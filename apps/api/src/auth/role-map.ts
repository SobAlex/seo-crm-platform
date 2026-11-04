import { Role } from '@prisma/client';

/** Роли интерфейса (@crm/access) и роли базы (pm, employee) сходятся в enum Role. */
const TO_DB: Record<string, Role> = {
  owner: Role.owner,
  seo_head: Role.seo_head,
  mgr_head: Role.mgr_head,
  seo_specialist: Role.employee,
  employee: Role.employee,
  account_manager: Role.pm,
  pm: Role.pm,
  contractor: Role.contractor,
  client: Role.client,
};

export function toDbRole(input: string): Role | null {
  return TO_DB[input] ?? null;
}

export const LEAD_ROLES: readonly Role[] = [Role.owner, Role.seo_head, Role.mgr_head];

const ROLE_LABEL: Record<Role, string> = {
  owner: 'Владелец компании',
  seo_head: 'Руководитель SEO',
  mgr_head: 'Руководитель менеджеров',
  employee: 'SEO-специалист',
  pm: 'Менеджер по клиентам',
  contractor: 'Подрядчик',
  client: 'Клиент',
};

export function roleLabel(role: Role): string {
  return ROLE_LABEL[role];
}
