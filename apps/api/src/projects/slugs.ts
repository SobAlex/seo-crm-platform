const PROJECT_SLUG_BY_ID: Record<string, string> = {
  prj_holod: 'holod',
  prj_remont: 'remont',
  prj_medlife: 'medlife',
  prj_stroy: 'stroytech',
  prj_promo: 'holodb2b',
};

export function projectSlug(id: string): string {
  return PROJECT_SLUG_BY_ID[id] ?? id;
}

const ID_BY_SLUG: Record<string, string> = Object.fromEntries(
  Object.entries(PROJECT_SLUG_BY_ID).map(([id, slug]) => [slug, id]),
);

export function resolveProjectId(key: string): string {
  return ID_BY_SLUG[key] ?? key;
}
