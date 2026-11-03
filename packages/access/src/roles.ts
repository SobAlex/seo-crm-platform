export const ROLES = [
  'owner',
  'seo_head',
  'mgr_head',
  'seo_specialist',
  'account_manager',
  'contractor',
  'client',
] as const;

export type Role = (typeof ROLES)[number];

/** Набор прав. Несколько должностей делят один профиль. */
export const PROFILES = ['owner', 'head', 'employee', 'contractor', 'client'] as const;

export type Profile = (typeof PROFILES)[number];

export const PROJECT_RELATIONS = ['seo_lead', 'optimizer', 'account_manager', 'member', 'client'] as const;

export type ProjectRelation = (typeof PROJECT_RELATIONS)[number];

export type HomePage = 'home' | 'tasks' | 'portal';

export interface RoleInfo {
  key: Role;
  name: string;
  profile: Profile;
  home: HomePage;
  /** Связь с проектом, которую получает автор при project.create. */
  projectRelation?: ProjectRelation;
}

export const ROLE_INFO: Readonly<Record<Role, RoleInfo>> = {
  owner: { key: 'owner', name: 'Владелец компании', profile: 'owner', home: 'home' },
  seo_head: { key: 'seo_head', name: 'Руководитель SEO', profile: 'head', home: 'home', projectRelation: 'seo_lead' },
  mgr_head: { key: 'mgr_head', name: 'Руководитель менеджеров', profile: 'head', home: 'home' },
  seo_specialist: { key: 'seo_specialist', name: 'SEO-специалист', profile: 'employee', home: 'home', projectRelation: 'optimizer' },
  account_manager: { key: 'account_manager', name: 'Менеджер по клиентам', profile: 'employee', home: 'home', projectRelation: 'account_manager' },
  contractor: { key: 'contractor', name: 'Подрядчик', profile: 'contractor', home: 'tasks' },
  client: { key: 'client', name: 'Клиент', profile: 'client', home: 'portal' },
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export function profileOf(role: Role): Profile {
  return ROLE_INFO[role].profile;
}

const GRANTABLE: Readonly<Record<Profile, readonly Role[]>> = {
  owner: ['seo_head', 'mgr_head', 'seo_specialist', 'account_manager', 'contractor', 'client'],
  head: ['seo_specialist', 'account_manager', 'contractor', 'client'],
  employee: [],
  contractor: [],
  client: [],
};

const DEACTIVATABLE: Readonly<Record<Profile, readonly Role[]>> = GRANTABLE;

/** Какую роль актор может выдать при приглашении. Владелец не выдаётся никому. */
export function canGrantRole(actor: Role, target: Role): boolean {
  if (!isRole(actor) || !isRole(target)) return false;
  return GRANTABLE[profileOf(actor)].includes(target);
}

/** Чей доступ актор может отключить. */
export function canDeactivateRole(actor: Role, target: Role): boolean {
  if (!isRole(actor) || !isRole(target)) return false;
  return DEACTIVATABLE[profileOf(actor)].includes(target);
}
