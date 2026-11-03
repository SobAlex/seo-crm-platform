export const SCOPES = ['workspace', 'member', 'setter', 'assigned', 'self', 'portal', 'deny'] as const;

export type Scope = (typeof SCOPES)[number];

export const SCOPE_DESCRIPTION: Readonly<Record<Scope, string>> = {
  workspace: 'Все объекты своей компании.',
  member:
    'Проекты, где пользователь в команде: seo_lead, optimizer, account_manager или member. Задачи, отчёты, часы, метрики, канбан и аудит идут за проектом.',
  setter: 'Пользователь постановщик этой задачи.',
  assigned: 'Пользователь исполнитель или соисполнитель задачи.',
  self: 'Пользователь автор записи.',
  portal: 'Проекты со связью client. Отдаётся клиентская проекция.',
  deny: 'Действия нет.',
};
