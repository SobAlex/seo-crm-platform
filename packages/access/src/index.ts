export {
  ROLES,
  PROFILES,
  PROJECT_RELATIONS,
  ROLE_INFO,
  isRole,
  profileOf,
  canGrantRole,
  canDeactivateRole,
  type Role,
  type Profile,
  type ProjectRelation,
  type HomePage,
  type RoleInfo,
} from './roles';
export { SCOPES, SCOPE_DESCRIPTION, type Scope } from './scopes';
export { ACTIONS, GRANTS, isAction, type Action } from './permissions';
export { can, scopeOf, type AccessContext } from './can';
