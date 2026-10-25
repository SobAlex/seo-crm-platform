/* SEO Control — общий скрипт прототипа.
   Подключается в <head> после Tailwind CDN. Содержит:
   1) тему Tailwind (стиль Apple);
   2) единственный источник правды по ролям и правам (матрица разрешений);
   3) отрисовку каркаса (меню, шапка, нижняя навигация) с учётом роли;
   4) табы, модалки, тосты.
   Все стили — только классами Tailwind. */

/* ---------- 1. Тема ---------- */
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'Inter', '"Segoe UI"', 'Roboto', 'sans-serif']
      },
      colors: {
        canvas: '#f5f5f7',
        ink: '#1d1d1f',
        accent: { DEFAULT: '#0071e3', hover: '#0077ed' }
      },
      borderRadius: { xl: '0.875rem', '2xl': '1.25rem', '3xl': '1.75rem' },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.04)',
        pop: '0 24px 64px rgba(0,0,0,.18)'
      }
    }
  },
  safelist: ['opacity-50', 'cursor-not-allowed', 'pointer-events-none']
};

/* Мобильный guard: без горизонтального скролла страницы + скрытый скроллбар у капсул/канбана */
(function () {
  if (document.getElementById('seo-mobile-guards')) return;
  const s = document.createElement('style');
  s.id = 'seo-mobile-guards';
  s.textContent = 'html,body{overflow-x:hidden;}' +
    '.no-scrollbar::-webkit-scrollbar{display:none;}' +
    '.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none;}';
  (document.head || document.documentElement).appendChild(s);
})();

(function () {
  'use strict';

  /* ---------- 2. Роли и права ---------- */
  const COMPANY = { name: 'Ромашка Digital', initials: 'Р', workspace: 'romashka.seo-control.app' };

  const ROLES = [
    { id: 'owner',      label: 'Владелец компании',       user: 'Александр Смирнов', initials: 'АС', badge: 'bg-zinc-900 text-white',      desc: 'Делает всё в компании, включая профиль, тариф, смену ролей и удаление компании.' },
    { id: 'seo_head',   label: 'Руководитель SEO',        user: 'Иван Сидоров',      initials: 'ИС', badge: 'bg-blue-50 text-blue-700',    desc: 'Полный доступ, кроме профиля компании, тарифа, смены ролей и удаления компании. Шаблоны и интеграции ему доступны.' },
    { id: 'mgr_head',   label: 'Руководитель менеджеров', user: 'Ольга Ветрова',     initials: 'ОВ', badge: 'bg-violet-50 text-violet-700', desc: 'Тот же доступ, что у руководителя SEO: всё, кроме профиля, тарифа, смены ролей и удаления компании.' },
    { id: 'pm',         label: 'Менеджер проекта',        user: 'Никита Морозов',    initials: 'НМ', badge: 'bg-amber-50 text-amber-700',  desc: 'Ведёт проекты, задачи, людей, отчёты и деньги. Не настраивает шаблоны и не подключает интеграции. Профиль компании закрыт.' },
    { id: 'employee',   label: 'SEO-специалист',          user: 'Алексей Петров',    initials: 'АП', badge: 'bg-emerald-50 text-emerald-700', desc: 'Проекты, задачи и отчёты. Без создания клиентов и проектов, без шаблонов, интеграций и профиля компании.' },
    { id: 'contractor', label: 'Подрядчик',               user: 'Мария Ким',         initials: 'МК', badge: 'bg-zinc-100 text-zinc-700',   desc: 'Видит и выполняет только назначенные задачи. Может комментировать их и вести свои часы.' },
    { id: 'client',     label: 'Клиент',                  user: 'Елена Крылова',     initials: 'ЕК', badge: 'bg-cyan-50 text-cyan-700',    desc: 'Свой проект только для просмотра: результаты, дорожная карта и принятые отчёты.' }
  ];
  const ROLE_IDS = ROLES.map(r => r.id);
  const INTERNAL = ['owner', 'seo_head', 'mgr_head', 'pm', 'employee', 'contractor'];

  /* Уровень, а не список ролей. Руководитель включает сотрудника, владелец — руководителя.
     also — роли вне лестницы: подрядчик и клиент. */
  const ROLE_RANK = { owner: 3, seo_head: 2, mgr_head: 2, pm: 1, employee: 1 };
  const RANK = { company: 3, lead: 2, staff: 1 };
  const STAFF = ['owner', 'seo_head', 'mgr_head', 'pm', 'employee'];
  const LEADS = ['owner', 'seo_head', 'mgr_head'];
  function granted(item, roleId) {
    if (item.also && item.also.indexOf(roleId) !== -1) return true;
    const need = RANK[item.level];
    return need != null && (ROLE_RANK[roleId] || 0) >= need;
  }
  const GROUPS = [
    { title: 'Компания', items: [
      { key: 'company_profile', label: 'Профиль: название, ИНН, адрес, логотип', level: 'company' },
      { key: 'billing',         label: 'Тариф, счета и смена тарифа',            level: 'company' },
      { key: 'delete_company',  label: 'Удаление компании',                       level: 'company' },
      { key: 'change_roles',    label: 'Менять роль человека',                    level: 'company' }
    ]},
    { title: 'Люди', items: [
      { key: 'hire_seo',           label: 'Пригласить руководителя SEO и SEO-специалиста', level: 'staff' },
      { key: 'hire_managers',      label: 'Пригласить руководителя менеджеров и менеджера проекта', level: 'staff' },
      { key: 'invite_contractors', label: 'Пригласить подрядчика',               level: 'staff' },
      { key: 'invite_clients',     label: 'Пригласить клиента в портал',         level: 'staff' }
    ]},
    { title: 'Шаблоны', items: [
      { key: 'project_types',    label: 'Тип проекта: создать, изменить, удалить', level: 'lead' },
      { key: 'roadmap_template', label: 'Шаблон дорожной карты',                   level: 'lead' },
      { key: 'month_plans',      label: 'Шаблон плана месяца',                     level: 'lead' }
    ]},
    { title: 'Интеграции', items: [
      { key: 'int_seo',      label: 'Подключить Метрику, Вебмастер и GSC', level: 'lead' },
      { key: 'link_counter', label: 'Привязать или отвязать счётчик проекта', level: 'lead' },
      { key: 'int_client',   label: 'Подключить коллтрекинг и CRM',        level: 'lead' },
      { key: 'view_metrics', label: 'Смотреть уже подтянутые метрики',     level: 'staff' }
    ]},
    { title: 'Проекты и клиенты', items: [
      { key: 'view_all_projects', label: 'Все проекты компании',            level: 'staff' },
      { key: 'create_client',     label: 'Создать и редактировать клиента', level: 'lead', also: ['pm'] },
      { key: 'create_project',    label: 'Создать проект',                  level: 'lead', also: ['pm'] },
      { key: 'edit_project',      label: 'Редактировать проект, карту и план месяца', level: 'staff' },
      { key: 'assign_team',      label: 'Назначать и убирать команду проекта', level: 'lead', also: ['pm'] },
      { key: 'transfer_project',  label: 'Передать проект другому специалисту', level: 'staff' },
      { key: 'archive_project',   label: 'Архивировать проект',             level: 'staff' },
      { key: 'delete_project',    label: 'Удалить проект',                  level: 'company' }
    ]},
    { title: 'Задачи', items: [
      { key: 'create_tasks', label: 'Задача из карты, свободная и подзадача', level: 'staff' },
      { key: 'free_tasks',   label: 'Назначить исполнителя и соисполнителя',  level: 'staff' },
      { key: 'own_tasks',    label: 'Вести назначенную задачу',               level: 'staff', also: ['contractor'] },
      { key: 'accept_work',  label: 'Принять задачу или вернуть на доработку', level: 'staff' }
    ]},
    { title: 'Отчёты', items: [
      { key: 'view_reports',    label: 'Смотреть отчёты',                      level: 'staff', also: ['client'] },
      { key: 'compose_reports', label: 'Составлять отчёт',                     level: 'staff' },
      { key: 'send_reports',    label: 'Принять, вернуть или отправить отчёт', level: 'staff' }
    ]},
    { title: 'Деньги и просмотр', items: [
      { key: 'see_finance',         label: 'Видеть чек, ставку и маржу', level: 'staff' },
      { key: 'track_time',          label: 'Вести свои часы',             level: 'staff', also: ['contractor'] },
      { key: 'edit_time',           label: 'Править чужие часы',          level: 'staff' },
      { key: 'internal_tasks',      label: 'Внутренние задачи',           level: 'staff', also: ['contractor'] },
      { key: 'view_roadmap',        label: 'Дорожная карта и графики',    level: 'staff', also: ['client'] },
      { key: 'view_client_project', label: 'Свой проект без редактирования', also: ['client'] }
    ]}
  ];

  const PERMS = {};
  GROUPS.forEach(g => g.items.forEach(i => {
    i.roles = {};
    ROLE_IDS.forEach(id => { if (granted(i, id)) i.roles[id] = 1; });
    PERMS[i.key] = i.roles;
  }));

  /* ---------- Состояние ---------- */
  const STORE_KEY = 'seo_control_role';
  const SEAT_KEY = 'seo_control_owner_leads_seo';
  let role = 'owner';
  let ownerLeadsSeo = false;
  try {
    role = localStorage.getItem(STORE_KEY) || 'owner';
    ownerLeadsSeo = localStorage.getItem(SEAT_KEY) === '1';
  } catch (e) { /* file:// без storage */ }
  if (!ROLE_IDS.includes(role)) role = 'owner';
  /* Место руководителя занято владельцем — отдельного входа «Руководитель SEO» нет. */
  if (ownerLeadsSeo && role === 'seo_head') {
    role = 'owner';
    try { localStorage.setItem(STORE_KEY, role); } catch (e) { /* ignore */ }
  }

  const roleInfo = id => ROLES.find(r => r.id === id);
  /* Право уже разложено по ролям из уровня. Место руководителя состав компании не меняет. */
  const can = key => !!(PERMS[key] && PERMS[key][role]);
  const covers = (asRole, ids) => ids.includes(asRole) || (ownerLeadsSeo && asRole === 'owner' && ids.includes('seo_head'));
  const homeFor = id => id === 'client' ? 'portal.html' : (id === 'contractor' ? 'tasks.html' : 'index.html');
  const roleLabel = () => (ownerLeadsSeo && role === 'owner') ? 'Владелец компании, руководитель SEO' : roleInfo(role).label;

  window.SEOApp = { role, ROLES, GROUPS, PERMS, can, COMPANY };

  /* ---------- 3. Каркас ---------- */
  const ICON = {
    home:     'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10',
    folder:   'M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z',
    check:    'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    report:   'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    users:    'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    team:     'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    layers:   'M12 3l9 5-9 5-9-5 9-5zm-9 9l9 5 9-5m-18 4l9 5 9-5',
    sliders:  'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4',
    eye:      'M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z',
    globe:    'M12 21a9 9 0 100-18 9 9 0 000 18zM3.5 12h17M12 3c2.5 2.8 3.8 6 3.8 9s-1.3 6.2-3.8 9c-2.5-2.8-3.8-6-3.8-9s1.3-6.2 3.8-9z',
    menu:     'M4 6h16M4 12h16M4 18h16',
    close:    'M6 18L18 6M6 6l12 12',
    lock:     'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
  };
  const svg = (name, cls) => '<svg class="' + (cls || 'w-5 h-5') + '" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="' + ICON[name] + '"/></svg>';

  const NAV = [
    { id: 'index',     href: 'index.html',     label: 'Главная',      icon: 'home',     roles: STAFF },
    { id: 'projects',  href: 'projects.html',  label: 'Проекты',      icon: 'folder',   roles: STAFF },
    { id: 'tasks',     href: 'tasks.html',     label: 'Задачи',       icon: 'check',    roles: INTERNAL },
    { id: 'reports',   href: 'reports.html',   label: 'Отчёты',       icon: 'report',   roles: STAFF },
    { id: 'clients',   href: 'clients.html',   label: 'Клиенты',      icon: 'users',    roles: STAFF },
    { id: 'calendar',  href: 'calendar.html',  label: 'Календарь',    icon: 'calendar', roles: STAFF },
    { id: 'portal',    href: 'portal.html',    label: 'Мой проект',   icon: 'home',     roles: ['client'] },
    { id: 'brief',     href: 'brief-form.html', label: 'Бриф',         icon: 'check',    roles: ['client'] },
    { group: 'Команда', roles: STAFF },
    { id: 'executors', href: 'executors.html', label: 'Сотрудники',   icon: 'team',     roles: STAFF },
    { id: 'templates', href: 'templates.html', label: 'Шаблоны',      icon: 'layers',   roles: LEADS },
    { id: 'guide',     href: 'guide.html',     label: 'Как устроено', icon: 'layers',   roles: STAFF.concat(['contractor']) }
  ];
  const NAV_FOOT = [
    { id: 'portal', href: 'portal.html', label: 'Портал клиента', icon: 'eye', roles: STAFF },
    { id: 'landing', href: 'landing.html', label: 'Сайт продукта', icon: 'globe', roles: STAFF },
    { id: 'settings', href: 'settings.html', label: 'Настройки компании', icon: 'sliders', roles: STAFF }
  ];
  const BOTTOM = ['index', 'projects', 'tasks', 'calendar'];

  const navLink = (item, active) => {
    const on = item.id === active;
    return '<a href="' + item.href + '" data-nav-id="' + item.id + '"' + (on ? ' aria-current="page"' : '') +
      ' class="flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition ' +
      (on ? 'bg-black/5 text-zinc-900 font-medium' : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/5') + '">' +
      svg(item.icon, 'w-[18px] h-[18px] shrink-0') + '<span>' + item.label + '</span></a>';
  };

  function buildSidebar(active) {
    let nav = '';
    NAV.forEach(item => {
      if (!covers(role, item.roles)) return;
      nav += item.group
        ? '<div class="px-3 pt-5 pb-1 text-[11px] font-medium text-zinc-500">' + item.group + '</div>'
        : navLink(item, active);
    });
    const foot = NAV_FOOT.filter(i => covers(role, i.roles)).map(i => navLink(i, active)).join('');
    const r = roleInfo(role);
    const options = ROLES.filter(x => !(ownerLeadsSeo && x.id === 'seo_head')).map(x => '<option value="' + x.id + '"' + (x.id === role ? ' selected' : '') + '>' + x.label + '</option>').join('');

    return '' +
      '<div id="sidebar-overlay" class="hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"></div>' +
      '<aside id="sidebar" aria-label="Основное меню" class="fixed inset-y-0 left-0 z-50 w-72 lg:w-64 -translate-x-full lg:translate-x-0 transition-transform duration-300 ease-out bg-white/90 lg:bg-white/70 backdrop-blur-2xl border-r border-black/5 flex flex-col">' +
        '<div class="px-4 pt-4 pb-2 flex items-center justify-between gap-2">' +
          '<a href="' + homeFor(role) + '" class="flex items-center gap-3 min-w-0 p-1.5 -m-1.5 rounded-xl hover:bg-black/5 transition">' +
            '<span class="w-9 h-9 rounded-xl bg-zinc-900 text-white text-sm font-semibold flex items-center justify-center shrink-0">' + COMPANY.initials + '</span>' +
            '<span class="min-w-0"><span class="block text-sm font-semibold tracking-tight truncate">' + COMPANY.name + '</span>' +
            '<span class="block text-[11px] text-zinc-500 truncate">SEO Control</span></span>' +
          '</a>' +
          '<button type="button" data-menu-close aria-label="Закрыть меню" class="lg:hidden w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center shrink-0">' + svg('close', 'w-4 h-4') + '</button>' +
        '</div>' +
        '<nav class="px-3 pt-2 flex flex-col gap-0.5 overflow-y-auto flex-1">' + nav + '</nav>' +
        '<div class="px-3 pt-2 pb-3 border-t border-black/5 flex flex-col gap-0.5">' + foot +
          '<div class="mt-2 rounded-2xl bg-black/[0.03] p-3">' +
            '<div class="flex items-center gap-3">' +
              '<span class="w-9 h-9 rounded-full bg-zinc-900 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">' + r.initials + '</span>' +
              '<div class="min-w-0"><div class="text-sm font-medium truncate">' + r.user + '</div><div class="text-xs text-zinc-500 truncate">' + roleLabel() + '</div></div>' +
            '</div>' +
            '<label class="block text-[11px] font-medium text-zinc-500 mt-3 mb-1" for="role-switch">Демо: смотреть как</label>' +
            '<select id="role-switch" class="w-full px-3 py-1.5 rounded-lg border border-black/10 bg-white text-xs focus:outline-none focus:ring-4 focus:ring-accent/15">' + options + '</select>' +
            (role === 'owner' ? '<a href="superadmin.html" class="mt-2 flex items-center justify-center px-3 py-1.5 rounded-full bg-white border border-black/10 text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition">Кабинет платформы</a>' : '') +
          '</div>' +
        '</div>' +
      '</aside>';
  }

  function buildMobileHeader() {
    const r = roleInfo(role);
    return '' +
      '<header class="lg:hidden sticky top-0 z-30 bg-canvas/80 backdrop-blur-xl border-b border-black/5 px-4 h-14 flex items-center justify-between">' +
        '<button type="button" data-menu-open aria-label="Открыть меню" class="w-10 h-10 -ml-2 rounded-full active:bg-black/5 flex items-center justify-center">' + svg('menu', 'w-5 h-5 text-zinc-800') + '</button>' +
        '<a href="' + homeFor(role) + '" class="text-sm font-semibold tracking-tight">' + COMPANY.name + '</a>' +
        '<button type="button" data-menu-open aria-label="Профиль и роль" class="w-8 h-8 rounded-full bg-zinc-900 text-white text-[10px] font-semibold flex items-center justify-center">' + r.initials + '</button>' +
      '</header>';
  }

  function buildBottomNav(active) {
    const items = NAV.filter(i => i.id && BOTTOM.includes(i.id) && covers(role, i.roles));
    if (!items.length || role === 'client') return '';
    const cells = items.map(i => {
      const on = i.id === active;
      return '<a href="' + i.href + '" class="flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition ' + (on ? 'text-accent' : 'text-zinc-500') + '">' +
        svg(i.icon, 'w-6 h-6') + '<span>' + i.label + '</span></a>';
    }).join('');
    return '<nav aria-label="Быстрая навигация" class="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/80 backdrop-blur-xl border-t border-black/5 pb-[env(safe-area-inset-bottom)] flex">' +
      cells +
      '<button type="button" data-menu-open class="flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-zinc-500">' + svg('menu', 'w-6 h-6') + '<span>Меню</span></button>' +
      '</nav>';
  }

  function accessDenied(main) {
    const r = roleInfo(role);
    main.innerHTML = '' +
      '<div class="min-h-[70vh] flex items-center justify-center px-6">' +
        '<div class="text-center max-w-sm">' +
          '<span class="mx-auto mb-5 w-14 h-14 rounded-full bg-black/5 text-zinc-500 flex items-center justify-center">' + svg('lock', 'w-6 h-6') + '</span>' +
          '<h1 class="text-xl font-semibold tracking-tight mb-2">Нет доступа</h1>' +
          '<p class="text-sm text-zinc-500 mb-6">Раздел недоступен для роли «' + r.label + '». Права задаются матрицей разрешений в «Настройки компании → Роли и доступ».</p>' +
          '<a href="' + homeFor(role) + '" class="inline-block px-5 py-2.5 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-hover transition">На главную</a>' +
        '</div>' +
      '</div>';
  }

  function initChrome() {
    const holder = document.querySelector('[data-app-chrome]');
    const main = document.querySelector('main');
    if (main) {
      main.classList.remove('lg:pb-0');
      main.classList.add('pb-24', 'lg:pb-20', 'lg:pl-64');
    }
    if (!document.getElementById('shell-pad')) {
      const pad = document.createElement('style');
      pad.id = 'shell-pad';
      pad.textContent = '@media (min-width:1024px){main.lg\\:px-8.lg\\:pl-64{padding-left:calc(16rem + 2rem)}}';
      document.head.appendChild(pad);
    }
    if (!holder) return;
    const active = holder.dataset.appChrome;
    const allowed = holder.dataset.roles ? holder.dataset.roles.split(',').map(s => s.trim()) : null;

    holder.outerHTML = buildMobileHeader() + buildSidebar(active) + buildBottomNav(active);

    if (allowed && !covers(role, allowed) && main) accessDenied(main);

    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const open = () => { sidebar.classList.remove('-translate-x-full'); overlay.classList.remove('hidden'); };
    const close = () => { sidebar.classList.add('-translate-x-full'); overlay.classList.add('hidden'); };
    document.addEventListener('click', e => {
      if (e.target.closest('[data-menu-open]')) open();
      else if (e.target.closest('[data-menu-close]')) close();
    });
    overlay.addEventListener('click', close);

    document.getElementById('role-switch').addEventListener('change', e => {
      try { localStorage.setItem(STORE_KEY, e.target.value); } catch (err) { /* ignore */ }
      const next = e.target.value;
      const page = location.pathname.split('/').pop() || 'index.html';
      const stay = allowed ? covers(next, allowed) : true;
      location.href = stay ? page : homeFor(next);
    });
  }

  /* ---------- Права на элементах ----------
     Кнопки и поля остаются в разметке для любой роли.
     Нет права — disabled, opacity-50, cursor-not-allowed и подсказка.
     Текстовые блоки без элементов управления по-прежнему скрываются.
     data-can="ключ"        — активно, только если право есть
     data-roles="a,b"       — активно только для перечисленных ролей
     data-deny="a,b"        — неактивно для перечисленных ролей
     data-deny-tip          — свой текст подсказки, иначе «Недоступно для вашей роли»
     data-role-name / data-user-name / data-user-full — подстановка текущей роли / имени / имени и фамилии */
  const DENY_TIP = 'Недоступно для вашей роли';
  function isActionControl(el) {
    const tag = el.tagName;
    return tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
  }

  /* Подсказка у неактивного элемента. Свой data-deny-tip сохраняется. */
  function denyControl(el) {
    if (!el || el.dataset.rbacOff === '1' || !el.isConnected) return;
    el.dataset.rbacOff = '1';
    const tip = el.dataset.denyTip || DENY_TIP;
    el.dataset.denyTip = tip;
    el.dataset.tip = tip;
    el.setAttribute('title', tip);
    el.setAttribute('aria-disabled', 'true');
    el.classList.add('opacity-50', 'cursor-not-allowed');
    if (el.tagName === 'A') {
      el.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); }, true);
    } else if ('disabled' in el) {
      el.disabled = true;
    }
    /* Обёртка ловит наведение: у disabled-кнопки браузер не показывает title. */
    if ((el.tagName === 'BUTTON' || el.tagName === 'A') && el.parentElement && !el.parentElement.hasAttribute('data-deny-wrap')) {
      const wrap = document.createElement('span');
      wrap.className = 'inline-flex max-w-full cursor-not-allowed';
      wrap.setAttribute('data-deny-wrap', '');
      wrap.dataset.tip = tip;
      wrap.title = tip;
      el.classList.add('pointer-events-none');
      el.parentNode.insertBefore(wrap, el);
      wrap.appendChild(el);
    }
  }

  const TIP_SYSTEM = 'Доступно только руководителю SEO или владельцу компании';
  const TIP_TEAM = 'Действие доступно только участникам команды этого проекта';
  const TIP_ACCEPT = 'Принять задачу может только её постановщик или руководитель';
  function permItem(key) {
    for (const g of GROUPS) for (const i of g.items) if (i.key === key) return i;
    return null;
  }

  function gate(el, allowed, tip) {
    if (!el || !el.isConnected || allowed) return;
    if (tip && !el.dataset.denyTip) el.dataset.denyTip = tip;
    if (isActionControl(el)) {
      denyControl(el);
      return;
    }
    const controls = el.querySelectorAll('button, a, input, select, textarea');
    if (controls.length) {
      controls.forEach(c => {
        if (tip && !c.dataset.denyTip) c.dataset.denyTip = tip;
        denyControl(c);
      });
      return;
    }
    el.remove();
  }

  const permLabel = key => {
    for (const g of GROUPS) for (const i of g.items) if (i.key === key) return i.label;
    return key;
  };
  const roleList = ids => ids.map(id => (roleInfo(id) || {}).label).filter(Boolean).join(', ');
  const ids = v => v.split(',').map(s => s.trim());

  function applyPermissions() {
    document.querySelectorAll('[data-can]').forEach(el => {
      const keys = ids(el.dataset.can);
      const system = keys.map(permItem).some(i => i && (i.level === 'company' || i.level === 'lead'));
      gate(el, keys.some(can), system ? TIP_SYSTEM : TIP_TEAM);
    });
    document.querySelectorAll('[data-roles]').forEach(el => {
      if (el.hasAttribute('data-app-chrome')) return;
      const list = ids(el.dataset.roles);
      const system = list.length && list.every(id => id === 'owner' || id === 'seo_head' || id === 'mgr_head');
      gate(el, covers(role, list), system ? TIP_SYSTEM : TIP_TEAM);
    });
    document.querySelectorAll('[data-deny]').forEach(el => {
      gate(el, !covers(role, ids(el.dataset.deny)));
    });
    /* data-accept-item data-acceptor="id" — только тем, кто вправе принять эту задачу;
       data-accept-deny — наоборот, тем, кто принять не может (показываем, кто принимает) */
    document.querySelectorAll('[data-accept-item]').forEach(el => { gate(el, canAcceptItem(el), TIP_ACCEPT); });
    document.querySelectorAll('[data-accept-deny]').forEach(el => { if (canAcceptItem(el)) el.remove(); });
    const r = roleInfo(role);
    document.querySelectorAll('[data-role-name]').forEach(el => { el.textContent = roleLabel(); });
    document.querySelectorAll('[data-user-name]').forEach(el => { el.textContent = r.user.split(' ')[0]; });
    document.querySelectorAll('[data-user-full]').forEach(el => { el.textContent = r.user; });
    document.querySelectorAll('[data-user-initials]').forEach(el => { el.textContent = r.initials; });
  }

  /* ---------- 4. Табы ---------- */
  const TAB_ON = ['bg-white', 'text-ink', 'shadow-sm'];
  const TAB_OFF = ['text-zinc-500'];

  function initTabs() {
    const btns = Array.from(document.querySelectorAll('.tab-btn[data-tab]'));
    if (!btns.length) return;
    const panels = document.querySelectorAll('[data-tab-panel]');
    const actions = document.querySelectorAll('[data-tab-actions]');
    const ids = Array.from(new Set(btns.map(b => b.dataset.tab)));

    function activate(tab) {
      btns.forEach(b => {
        const on = b.dataset.tab === tab;
        TAB_ON.forEach(c => b.classList.toggle(c, on));
        TAB_OFF.forEach(c => b.classList.toggle(c, !on));
        b.classList.add('font-medium'); /* одинаковое начертание — кнопки не «прыгают» по ширине */
        b.setAttribute('aria-selected', on ? 'true' : 'false');
      });
      panels.forEach(p => p.classList.toggle('hidden', p.dataset.tabPanel !== tab));
      actions.forEach(a => {
        const on = a.dataset.tabActions === tab;
        a.classList.toggle('hidden', !on);
        a.classList.toggle('flex', on);
      });
    }
    btns.forEach(b => b.addEventListener('click', () => {
      if (b.disabled || b.getAttribute('aria-disabled') === 'true') return;
      activate(b.dataset.tab);
      if (history.replaceState) history.replaceState(null, '', '#' + b.dataset.tab);
    }));
    const fromHash = location.hash.slice(1);
    const usable = ids.filter(id => btns.some(b => b.dataset.tab === id && !b.disabled && b.getAttribute('aria-disabled') !== 'true'));
    const initial = usable.includes(fromHash) ? fromHash : (usable[0] || ids[0]);
    activate(initial);
    document.querySelectorAll('select[data-tab-select]').forEach(sel => {
      sel.value = initial;
      sel.addEventListener('change', () => {
        activate(sel.value);
        if (history.replaceState) history.replaceState(null, '', '#' + sel.value);
      });
    });
  }

  /* ---------- Сегменты: тот же вид, что у табов, но без привязки к адресу ----------
     [data-segmented] > button[data-seg="x"]   — переключатель (контейнер bg-zinc-100 rounded-full p-1)
     [data-seg-panel="x"]                      — панель; ищется внутри ближайшего [data-seg-scope], иначе по странице
     Событие seg:change (detail.value) — на контейнере, для страничных скриптов. */
  function paintSegment(box, value) {
    const btns = Array.from(box.querySelectorAll(':scope > [data-seg]'));
    btns.forEach(b => {
      const on = b.dataset.seg === value;
      TAB_ON.forEach(c => b.classList.toggle(c, on));
      TAB_OFF.forEach(c => b.classList.toggle(c, !on));
      b.classList.add('font-medium');
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const values = btns.map(b => b.dataset.seg);
    const scopeEl = box.closest('[data-seg-scope]') || document;
    scopeEl.querySelectorAll('[data-seg-panel]').forEach(p => {
      if (values.indexOf(p.dataset.segPanel) === -1) return;
      if ((p.closest('[data-seg-scope]') || document) !== scopeEl) return;
      p.classList.toggle('hidden', p.dataset.segPanel !== value);
    });
  }

  function prepareSegments(root) {
    root.querySelectorAll('[data-segmented]').forEach(box => {
      box.classList.add('inline-flex', 'bg-zinc-100', 'rounded-full', 'p-1', 'max-w-full');
      const first = box.querySelector(':scope > [data-seg][aria-pressed="true"]') ||
        Array.from(box.querySelectorAll(':scope > [data-seg]')).find(b => !b.disabled);
      if (first) paintSegment(box, first.dataset.seg);
    });
  }

  function initSegments() {
    prepareSegments(document);
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-segmented] > [data-seg]');
      if (!b || b.disabled) return;
      const box = b.parentElement;
      paintSegment(box, b.dataset.seg);
      box.dispatchEvent(new CustomEvent('seg:change', { detail: { value: b.dataset.seg }, bubbles: true }));
    });
  }

  /* ---------- Подсказки у неактивных элементов: [data-tip] ---------- */
  function initTooltips() {
    const tip = document.createElement('div');
    tip.setAttribute('role', 'tooltip');
    tip.className = 'hidden fixed z-[70] max-w-[260px] px-2.5 py-1.5 rounded-lg bg-zinc-900/95 text-white text-xs leading-snug shadow-pop pointer-events-none';
    document.body.appendChild(tip);
    let current = null;
    const show = el => {
      current = el;
      tip.textContent = el.dataset.tip;
      el.removeAttribute('title');
      tip.classList.remove('hidden');
      const r = el.getBoundingClientRect();
      const t = tip.getBoundingClientRect();
      const left = Math.min(Math.max(8, r.left + r.width / 2 - t.width / 2), window.innerWidth - t.width - 8);
      const top = r.top - t.height - 8 < 8 ? r.bottom + 8 : r.top - t.height - 8;
      tip.style.left = left + 'px';
      tip.style.top = top + 'px';
    };
    const hide = () => {
      if (current) current.setAttribute('title', current.dataset.tip);
      current = null;
      tip.classList.add('hidden');
    };
    document.addEventListener('mouseover', e => {
      const el = e.target.closest && e.target.closest('[data-tip]');
      if (el && el !== current) show(el);
      else if (!el && current) hide();
    });
    document.addEventListener('scroll', hide, true);
  }

  /* ---------- Модалки: id = <name>-modal ----------
     data-open-modal="name"            — открыть окно; data-prefill-<field>="v" — подставить значение в [name=field]
     data-close-modal                  — закрыть (оверлей, крестик, «Отмена»), Escape — тоже
     [data-modal-submit]               — проверяет [required] в окне, закрывает и показывает data-submit-toast
     События на окне: modal:open (detail.opener), modal:submit (detail.toast можно переписать,
     preventDefault — окно остаётся открытым). Общие окна регистрирует assets/modals.js. */
  const MODALS = {};
  const MODAL_WIDTH = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' };
  const FIELD = 'w-full px-3.5 py-2 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-4 focus:ring-accent/15 focus:border-accent/40';
  const INVALID = ['!border-red-400', 'ring-4', 'ring-red-100'];
  const ICON_CLOSE = '<svg class="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';

  function registerModal(name, def) { MODALS[name] = def; }

  function buildModal(name, o) {
    const el = document.createElement('div');
    el.id = name + '-modal';
    el.className = 'fixed inset-0 z-50 hidden';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-labelledby', name + '-title');
    el.dataset.modalReset = o.reset === false ? '0' : '1';
    const body = typeof o.body === 'function' ? o.body() : (o.body || '');
    const submit = o.submit === false ? '' :
      '<button type="button" data-modal-submit' +
      (o.submitCan ? ' data-can="' + o.submitCan + '"' : '') +
      (o.submitToast ? ' data-submit-toast="' + o.submitToast + '"' : '') +
      ' class="px-4 py-2 rounded-full ' + (o.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-accent hover:bg-accent-hover') +
      ' text-white text-sm font-medium transition">' + (o.submit || 'Сохранить') + '</button>';
    el.innerHTML =
      '<div class="absolute inset-0 bg-black/30 backdrop-blur-sm" data-close-modal></div>' +
      '<div class="absolute inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">' +
        '<div class="bg-white rounded-t-3xl sm:rounded-3xl shadow-pop w-full ' + (MODAL_WIDTH[o.size] || MODAL_WIDTH.md) + ' pointer-events-auto max-h-[90vh] overflow-y-auto">' +
          '<div class="px-5 sm:px-6 py-4 border-b border-zinc-100 flex items-center justify-between gap-3 sticky top-0 bg-white/95 backdrop-blur z-10 rounded-t-3xl">' +
            '<div class="min-w-0"><h3 id="' + name + '-title" class="text-sm font-semibold tracking-tight truncate" data-modal-title>' + o.title + '</h3>' +
            (o.subtitle ? '<p class="text-xs text-zinc-500 mt-0.5 truncate" data-modal-subtitle>' + o.subtitle + '</p>' : '') + '</div>' +
            '<button type="button" data-close-modal aria-label="Закрыть" class="w-8 h-8 shrink-0 rounded-full hover:bg-zinc-100 flex items-center justify-center">' + ICON_CLOSE + '</button>' +
          '</div>' +
          '<div class="p-5 sm:p-6 space-y-4" data-modal-body>' + body + '</div>' +
          '<div class="px-5 sm:px-6 py-4 border-t border-zinc-100 flex flex-col-reverse sm:flex-row gap-2 sm:items-center sm:justify-end sticky bottom-0 bg-white/95 backdrop-blur rounded-b-3xl">' +
            (o.footerNote ? '<div class="text-xs text-zinc-500 sm:mr-auto" data-modal-note>' + o.footerNote + '</div>' : '') +
            '<button type="button" data-close-modal class="px-4 py-2 rounded-full bg-white border border-zinc-200 text-sm font-medium hover:bg-zinc-50 transition">' + (o.cancel || 'Отмена') + '</button>' +
            submit +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    if (o.onOpen) el.addEventListener('modal:open', e => o.onOpen(el, e.detail.opener));
    if (o.onSubmit) el.addEventListener('modal:submit', e => o.onSubmit(el, e.detail, e));
    if (o.init) o.init(el);
    return el;
  }

  /* Общие окна строятся заранее, если на странице есть кнопка, которая их открывает. */
  function buildSharedModals() {
    const wanted = new Set();
    document.querySelectorAll('[data-open-modal]').forEach(b => wanted.add(b.dataset.openModal));
    (document.body.dataset.modals || '').split(',').forEach(n => n.trim() && wanted.add(n.trim()));
    if (document.querySelector('[data-confirm]')) wanted.add('confirm');
    wanted.forEach(name => ensureModal(name, true));
  }
  function ensureModal(name, early) {
    let el = document.getElementById(name + '-modal');
    if (el || !MODALS[name]) return el;
    el = buildModal(name, MODALS[name]);
    if (!early) { applyPermissions(); prepareSegments(el); }
    return el;
  }

  function resetFields(modal) {
    modal.querySelectorAll('input, select, textarea').forEach(f => {
      clearInvalid(f);
      if (f.type === 'checkbox' || f.type === 'radio') f.checked = f.defaultChecked;
      else if (f.tagName === 'SELECT') {
        const def = Array.from(f.options).find(o => o.defaultSelected);
        f.value = def ? def.value : (f.options[0] ? f.options[0].value : '');
      } else if (f.type !== 'file') f.value = f.defaultValue;
    });
  }
  function prefill(modal, opener) {
    Object.keys(opener.dataset).forEach(k => {
      if (k.indexOf('prefill') !== 0 || k === 'prefill') return;
      const name = k.slice(7).replace(/^[A-Z]/, c => c.toLowerCase()).replace(/[A-Z]/g, c => '-' + c.toLowerCase());
      const v = opener.dataset[k];
      modal.querySelectorAll('[name="' + name + '"]').forEach(f => {
        if (f.type === 'checkbox') f.checked = v === '1' || v === 'true';
        else if (f.type === 'radio') f.checked = f.value === v;
        else f.value = v;
      });
    });
  }
  function clearInvalid(f) {
    if (!f.hasAttribute('aria-invalid')) return;
    f.removeAttribute('aria-invalid');
    INVALID.forEach(c => f.classList.remove(c));
  }
  const fieldVisible = f => !f.disabled && !f.closest('.hidden');
  function invalidFields(modal) {
    return Array.from(modal.querySelectorAll('[required]')).filter(f => {
      if (!fieldVisible(f)) return false;
      if (f.type === 'checkbox') return !f.checked;
      if (f.type === 'radio') return !modal.querySelector('[name="' + f.name + '"]:checked');
      const v = String(f.value || '').trim();
      if (!v) return true;
      if (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return true;
      if (f.dataset.digits && !new RegExp('^(\\d{' + f.dataset.digits.split(',').join('}|\\d{') + '})$').test(v)) return true;
      if (f.type === 'number' && ((f.min !== '' && +v < +f.min) || (f.max !== '' && +v > +f.max))) return true;
      if (f.dataset.after) {
        const other = modal.querySelector('[name="' + f.dataset.after + '"]');
        if (other && other.value && v < other.value) return true;
      }
      return false;
    });
  }

  /* Зависимые поля:
     select[data-dep="key"] > option[data-when="a b"] — опции, доступные при значении источника
     [data-show-when="key:a|b"]                        — блок виден при значении источника
     Источник — [data-dep-source="key"] в том же окне (или на странице). */
  function sourceValue(root, key) {
    const src = root.querySelector('[data-dep-source="' + key + '"]');
    if (!src) return null;
    if (src.type === 'radio' || src.type === 'checkbox') {
      const on = root.querySelector('[data-dep-source="' + key + '"]:checked');
      return on ? on.value : '';
    }
    return src.value;
  }
  function syncDeps(root) {
    root = root || document;
    root.querySelectorAll('select[data-dep]').forEach(sel => {
      const v = sourceValue(root, sel.dataset.dep);
      if (v == null) return;
      let firstOk = null;
      Array.from(sel.options).forEach(o => {
        if (!o.dataset.when) { if (!firstOk && o.value) firstOk = o; return; }
        const ok = o.dataset.when.split(' ').indexOf(v) !== -1;
        o.hidden = !ok;
        o.disabled = !ok;
        if (ok && !firstOk) firstOk = o;
      });
      const cur = sel.options[sel.selectedIndex];
      if (!cur || cur.disabled || (!cur.value && firstOk && firstOk.dataset.when)) sel.value = firstOk ? firstOk.value : '';
    });
    root.querySelectorAll('[data-show-when]').forEach(el => {
      const [key, vals] = el.dataset.showWhen.split(':');
      const v = sourceValue(root, key);
      if (v == null) return;
      el.classList.toggle('hidden', vals.split('|').indexOf(v) === -1);
    });
  }

  const allModals = () => document.querySelectorAll('[id$="-modal"]');
  function closeModals() {
    allModals().forEach(m => m.classList.add('hidden'));
    document.body.classList.remove('overflow-hidden');
  }
  function openModal(name, opener) {
    const modal = ensureModal(name);
    if (!modal) return null;
    allModals().forEach(m => m.classList.add('hidden'));
    if (modal.dataset.modalReset === '1') resetFields(modal);
    if (opener) prefill(modal, opener);
    syncDeps(modal);
    modal.dispatchEvent(new CustomEvent('modal:open', { detail: { opener: opener || null } }));
    syncDeps(modal);
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
    const scroller = modal.querySelector('.overflow-y-auto');
    if (scroller) scroller.scrollTop = 0;
    return modal;
  }

  function submitModal(btn) {
    const modal = btn.closest('[id$="-modal"]');
    if (!modal) return;
    modal.querySelectorAll('[aria-invalid]').forEach(clearInvalid);
    const bad = invalidFields(modal);
    if (bad.length) {
      bad.forEach(f => { f.setAttribute('aria-invalid', 'true'); INVALID.forEach(c => f.classList.add(c)); });
      bad[0].focus();
      toast(bad.some(f => String(f.value || '').trim()) ? 'Проверьте выделенные поля' : 'Заполните обязательные поля');
      return;
    }
    const detail = { button: btn, toast: btn.dataset.submitToast || 'Сохранено' };
    const ev = new CustomEvent('modal:submit', { detail, cancelable: true });
    if (!modal.dispatchEvent(ev)) return;
    closeModals();
    if (detail.toast) toast(detail.toast);
    if (detail.href) setTimeout(() => { location.href = detail.href; }, 700);
  }

  function initModals() {
    document.addEventListener('click', e => {
      const opener = e.target.closest('[data-open-modal]');
      if (opener) {
        if (opener.disabled || opener.getAttribute('aria-disabled') === 'true') return;
        e.preventDefault();
        openModal(opener.dataset.openModal, opener);
        return;
      }
      const sub = e.target.closest('[data-modal-submit]');
      if (sub) {
        if (!sub.disabled) submitModal(sub);
        return;
      }
      if (e.target.closest('[data-close-modal]')) closeModals();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModals(); });
    document.addEventListener('input', e => { if (e.target.hasAttribute && e.target.hasAttribute('aria-invalid')) clearInvalid(e.target); });
    document.addEventListener('change', e => {
      const t = e.target;
      if (t.hasAttribute && t.hasAttribute('aria-invalid')) clearInvalid(t);
      if (t.matches && t.matches('[data-dep-source]')) syncDeps(t.closest('[id$="-modal"]') || document);
    });
    syncDeps(document);
  }

  /* Подтверждение: data-confirm="Удалить работу?" data-confirm-text="пояснение"
     data-confirm-remove="li" — после подтверждения удалить ближайший предок; data-confirm-toast — текст тоста.
     На кнопке — событие confirm:ok для страничных скриптов. */
  let pendingConfirm = null;
  registerModal('confirm', {
    title: 'Подтвердите действие', size: 'sm', submit: 'Удалить', danger: true, reset: false,
    body: '<p class="text-sm text-zinc-600" data-confirm-message></p>',
    onSubmit(modal, detail) {
      const btn = pendingConfirm;
      pendingConfirm = null;
      if (!btn) return;
      detail.toast = btn.dataset.confirmToast || 'Удалено';
      btn.dispatchEvent(new CustomEvent('confirm:ok', { bubbles: true }));
      const target = btn.dataset.confirmRemove && btn.closest(btn.dataset.confirmRemove);
      if (target) {
        target.style.transition = 'opacity .2s';
        target.style.opacity = '0';
        setTimeout(() => target.remove(), 200);
      }
    }
  });
  function initConfirm() {
    document.addEventListener('click', e => {
      const btn = e.target.closest('[data-confirm]');
      if (!btn || btn.disabled || btn.getAttribute('aria-disabled') === 'true') return;
      e.preventDefault();
      const modal = openModal('confirm');
      if (!modal) return;
      pendingConfirm = btn;
      modal.querySelector('[data-modal-title]').textContent = btn.dataset.confirm;
      modal.querySelector('[data-confirm-message]').textContent = btn.dataset.confirmText || 'Действие нельзя отменить.';
      modal.querySelector('[data-modal-submit]').textContent = btn.dataset.confirmOk || 'Удалить';
    });
  }

  /* Мелкие демо-действия:
     [data-attach]              — выбрать файл, тост с именем
     [data-copy="текст"]        — скопировать; data-copy-from="селектор" — значение поля
     form[data-demo-form]       — не отправлять, проверить [required], тост data-toast-ok и переход data-redirect
     [data-thread]              — лента комментариев: [data-thread-list], [data-thread-input], [data-thread-send] */
  function initDemoActions() {
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.className = 'hidden';
    document.body.appendChild(picker);
    let attachBtn = null;
    picker.addEventListener('change', () => {
      const f = picker.files && picker.files[0];
      if (!f) return;
      toast('Файл «' + f.name + '» прикреплён');
      if (attachBtn) attachBtn.dispatchEvent(new CustomEvent('attach:file', { detail: { file: f }, bubbles: true }));
      picker.value = '';
    });
    document.addEventListener('click', e => {
      const a = e.target.closest('[data-attach]');
      if (a && !a.disabled) {
        attachBtn = a;
        picker.accept = a.dataset.attach || '';
        picker.click();
        return;
      }
      const c = e.target.closest('[data-copy]');
      if (c && !c.disabled) {
        const src = c.dataset.copyFrom && (c.closest('[id$="-modal"]') || document).querySelector(c.dataset.copyFrom);
        const text = src ? src.value : c.dataset.copy;
        const done = () => toast(c.dataset.copyToast || 'Скопировано в буфер обмена');
        if (src && src.select) src.select();
        if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, done);
        else { try { document.execCommand('copy'); } catch (err) { /* ignore */ } done(); }
      }
    });
    document.querySelectorAll('form[data-demo-form]').forEach(form => {
      form.setAttribute('novalidate', '');
      form.addEventListener('submit', e => {
        e.preventDefault();
        form.querySelectorAll('[aria-invalid]').forEach(clearInvalid);
        const bad = invalidFields(form);
        if (bad.length) {
          bad.forEach(f => { f.setAttribute('aria-invalid', 'true'); INVALID.forEach(c => f.classList.add(c)); });
          bad[0].focus();
          toast('Заполните обязательные поля');
          return;
        }
        toast(form.dataset.toastOk || 'Сохранено');
        if (form.dataset.redirect) setTimeout(() => { location.href = form.dataset.redirect; }, 700);
      });
    });
    document.querySelectorAll('[data-thread]').forEach(box => {
      const list = box.querySelector('[data-thread-list]');
      const input = box.querySelector('[data-thread-input]');
      const send = box.querySelector('[data-thread-send]');
      const count = box.querySelector('[data-thread-count]');
      if (!list || !input || !send) return;
      send.addEventListener('click', () => {
        const text = input.value.trim();
        if (!text) { input.focus(); toast('Напишите комментарий'); return; }
        const me = roleInfo(role);
        const now = new Date();
        const li = document.createElement('li');
        li.className = 'p-4 lg:p-5';
        li.innerHTML = '<div class="flex gap-3"><span class="w-8 h-8 shrink-0 rounded-full bg-zinc-900 text-white text-[10px] font-semibold flex items-center justify-center"></span>' +
          '<div class="flex-1 min-w-0"><div class="flex flex-wrap items-baseline gap-x-2 mb-1"><span class="text-sm font-medium"></span><span class="text-xs text-zinc-500">сейчас</span></div><p class="text-sm text-zinc-600 whitespace-pre-line"></p></div></div>';
        li.querySelector('span').textContent = me.initials;
        li.querySelector('.text-sm.font-medium').textContent = me.user.split(' ')[1] ? me.user.split(' ')[0][0] + '. ' + me.user.split(' ')[1] : me.user;
        li.querySelector('p').textContent = text;
        li.querySelector('.text-xs').textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
        list.prepend(li);
        input.value = '';
        if (count) count.textContent = list.children.length + ' ' + plural(list.children.length, ['сообщение', 'сообщения', 'сообщений']);
        toast('Комментарий добавлен');
      });
    });
  }
  function plural(n, f) {
    const m10 = n % 10, m100 = n % 100;
    return f[m10 === 1 && m100 !== 11 ? 0 : (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? 1 : 2)];
  }

  /* Диапазон дат: [data-date-from], [data-date-to].
     Значение строки: ГГГГ-ММ-ДД, ГГГГ-ММ (весь месяц) или «начало/конец». */
  function dateRange() {
    const fromEl = document.querySelector('[data-date-from]');
    const toEl = document.querySelector('[data-date-to]');
    return { from: (fromEl && fromEl.value) || '', to: (toEl && toEl.value) || '' };
  }
  function dateInRange(value, from, to) {
    if (from === undefined || to === undefined) {
      const r = dateRange();
      if (from === undefined) from = r.from;
      if (to === undefined) to = r.to;
    }
    if (!from && !to) return true;
    if (!value) return false;
    let start = value;
    let end = value;
    const slash = value.indexOf('/');
    if (slash !== -1) {
      start = value.slice(0, slash);
      end = value.slice(slash + 1);
    } else if (value.length === 7) {
      start = value + '-01';
      end = value + '-31';
    }
    if (from && end < from) return false;
    if (to && start > to) return false;
    return true;
  }
  function paintRangeRows() {
    const rows = document.querySelectorAll('[data-project-row]');
    if (!rows.length) return;
    rows.forEach(el => {
      const rangeOut = el.dataset.rangeDate ? !dateInRange(el.dataset.rangeDate) : false;
      const extra = el.dataset.mineOut === '1' || el.dataset.qOut === '1';
      el.classList.toggle('!hidden', el.dataset.roleOut === '1' || rangeOut || extra);
    });
    const visible = Array.from(rows).filter(el => !el.classList.contains('!hidden'));
    const total = Array.from(rows).filter(el => el.dataset.roleOut !== '1').length;
    document.querySelectorAll('[data-project-summary]').forEach(el => {
      const num = '<span class="tabular-nums text-zinc-900 font-medium">';
      el.innerHTML = visible.length
        ? 'Показано ' + num + '1–' + visible.length + '</span> из ' + num + total + '</span>'
        : 'Показано ' + num + '0</span> из ' + num + total + '</span>';
    });
  }
  function initDateRange() {
    const fromEl = document.querySelector('[data-date-from]');
    const toEl = document.querySelector('[data-date-to]');
    if (!fromEl && !toEl) return;
    const apply = () => {
      if (fromEl && toEl) {
        toEl.min = fromEl.value;
        fromEl.max = toEl.value;
      }
      paintRangeRows();
      if (pageFilter) applyFilters();
      document.dispatchEvent(new CustomEvent('daterange:change', { bubbles: true }));
    };
    if (fromEl) fromEl.addEventListener('change', apply);
    if (toEl) toEl.addEventListener('change', apply);
  }

  /* Переключатель месяца: [data-month-nav] > [data-month-step="-1|1"], [data-month-label]
     data-month-min / data-month-max = "2025-01"; событие month:change (detail.year, detail.month 0–11). */
  const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  function initMonthNav() {
    document.querySelectorAll('[data-month-nav]').forEach(nav => {
      const label = nav.querySelector('[data-month-label]');
      if (!label) return;
      const parts = label.textContent.trim().split(/\s+/);
      let m = MONTHS.indexOf(parts[0]);
      let y = +parts[1];
      if (m < 0 || !y) return;
      const key = (yy, mm) => yy * 12 + mm;
      const bound = s => { if (!s) return null; const [yy, mm] = s.split('-').map(Number); return key(yy, mm - 1); };
      const min = bound(nav.dataset.monthMin);
      const max = bound(nav.dataset.monthMax);
      const paint = () => {
        nav.querySelectorAll('[data-month-step]').forEach(b => {
          const k = key(y, m) + +b.dataset.monthStep;
          const off = (min != null && k < min) || (max != null && k > max);
          b.disabled = off;
          b.classList.toggle('opacity-40', off);
          b.classList.toggle('cursor-not-allowed', off);
        });
      };
      nav.addEventListener('click', e => {
        const b = e.target.closest('[data-month-step]');
        if (!b || b.disabled) return;
        const k = key(y, m) + +b.dataset.monthStep;
        y = Math.floor(k / 12);
        m = k % 12;
        label.textContent = MONTHS[m] + ' ' + y;
        paint();
        nav.dispatchEvent(new CustomEvent('month:change', { detail: { year: y, month: m }, bubbles: true }));
      });
      paint();
    });
  }

  /* График метрик: SEOApp.metricChart(root, { months, series: { key: { label, color, fact, plan, suffix } } })
     В root: [data-segmented] с data-seg=key, [data-chart-svg], необязательно [data-chart-stats].
     Показатель переключается только сегментами самого графика. */
  function fmtNum(v, suffix) {
    return (Math.round(v * 10) / 10).toLocaleString('ru-RU') + (suffix || '');
  }
  function metricChart(root, data) {
    const svgBox = root.querySelector('[data-chart-svg]');
    const stats = root.querySelector('[data-chart-stats]');
    const monthsBox = root.querySelector('[data-chart-months]');
    const seg = root.querySelector('[data-segmented]');
    let current = (seg && seg.querySelector('[aria-pressed="true"]') || {}).dataset;
    current = current ? current.seg : Object.keys(data.series)[0];
    const uid = 'mc' + Math.random().toString(36).slice(2, 7);
    if (monthsBox) monthsBox.remove();

    function render() {
      const s = data.series[current];
      const n = data.months.length;
      const W = Math.max(500, Math.round(svgBox.clientWidth || 660));
      const vals = s.fact.filter(v => v != null).concat(s.plan || []);
      const hi0 = Math.max.apply(null, vals);
      const lo0 = Math.min.apply(null, vals);
      const pad = (hi0 - lo0) * 0.15 || hi0 * 0.1 || 1;
      const hi = hi0 + pad, lo = Math.max(0, lo0 - pad);
      const x = i => 30 + ((W - 60) / (n - 1)) * i;
      const y = v => 170 - ((v - lo) / (hi - lo)) * 140;
      const pts = s.fact.map((v, i) => v == null ? null : [x(i), y(v), v, i]).filter(Boolean);
      const line = pts.map((p, i) => (i ? 'L ' : 'M ') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
      const last = pts[pts.length - 1];
      const plan = s.plan ? s.plan.map((v, i) => (i ? 'L ' : 'M ') + x(i).toFixed(1) + ',' + y(v).toFixed(1)).join(' ') : '';
      const grid = [30, 65, 100, 135].map(gy => '<line x1="30" y1="' + gy + '" x2="' + (W - 30) + '" y2="' + gy + '" stroke="#f4f4f5"/>').join('') +
        '<line x1="30" y1="170" x2="' + (W - 30) + '" y2="170" stroke="#e4e4e7"/>' +
        '<text x="30" y="22" font-size="10" fill="#a1a1aa">' + fmtNum(hi0, s.suffix) + '</text>' +
        data.months.map((m, i) => '<text x="' + x(i).toFixed(1) + '" y="192" text-anchor="middle" font-size="11" fill="#71717a">' + m + '</text>').join('');
      svgBox.innerHTML =
        '<svg viewBox="0 0 ' + W + ' 200" width="' + W + '" height="200" class="block" role="img" aria-label="' + s.label + '">' +
        '<defs><linearGradient id="' + uid + current + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + s.color + '" stop-opacity="0.16"/><stop offset="100%" stop-color="' + s.color + '" stop-opacity="0"/></linearGradient></defs>' +
        grid +
        (plan ? '<path d="' + plan + '" fill="none" stroke="#a1a1aa" stroke-width="1.5" stroke-dasharray="4 4"/>' : '') +
        '<path d="' + line + ' L ' + last[0].toFixed(1) + ',170 L ' + pts[0][0].toFixed(1) + ',170 Z" fill="url(#' + uid + current + ')"/>' +
        '<path d="' + line + '" fill="none" stroke="' + s.color + '" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/>' +
        pts.map((p, i) => '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (i === pts.length - 1 ? 4.5 : 3.5) + '" fill="' + (i === pts.length - 1 ? s.color : '#fff') + '" stroke="' + s.color + '" stroke-width="2"><title>' +
          data.months[p[3]] + ': ' + fmtNum(p[2], s.suffix) + (s.plan ? ' · план ' + fmtNum(s.plan[p[3]], s.suffix) : '') + '</title></circle>').join('') +
        '<text x="' + Math.min(last[0], W - 40).toFixed(1) + '" y="' + Math.max(last[1] - 12, 12).toFixed(1) + '" text-anchor="middle" font-size="11" font-weight="600" fill="' + s.color + '">' + fmtNum(last[2], s.suffix) + '</text>' +
        '</svg>';
      if (stats) {
        const idx = last[3];
        const prev = s.fact[idx - 1];
        const planV = s.plan ? s.plan[idx] : null;
        const pct = planV ? Math.round(last[2] / planV * 100) : null;
        const diff = prev != null ? last[2] - prev : null;
        const tile = (label, value, tone) => '<div class="rounded-2xl bg-zinc-50 px-4 py-3 min-w-0"><div class="text-xs text-zinc-500 truncate">' + label + '</div><div class="text-lg font-semibold tracking-tight tabular-nums mt-0.5 ' + (tone || '') + '">' + value + '</div></div>';
        stats.innerHTML =
          tile(s.label + ' · ' + data.months[idx], fmtNum(last[2], s.suffix)) +
          tile('План на ' + data.months[idx], planV != null ? fmtNum(planV, s.suffix) : '—') +
          tile('Выполнение плана', pct != null ? pct + '%' : '—', pct == null ? '' : (pct >= 100 ? 'text-emerald-700' : (pct >= 90 ? 'text-amber-700' : 'text-red-700'))) +
          tile('К прошлому месяцу', diff == null ? '—' : (diff >= 0 ? '+' : '−') + fmtNum(Math.abs(diff), s.suffix), diff == null ? '' : (diff >= 0 ? 'text-emerald-700' : 'text-red-700'));
      }
    }
    if (seg) seg.addEventListener('seg:change', e => { current = e.detail.value; render(); });
    let resizeTimer;
    window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(render, 120); });
    render();
    return {
      set(key, index, value) { if (data.series[key]) data.series[key].fact[index] = value; render(); },
      show(key) { current = key; if (seg) paintSegment(seg, key); render(); },
      data
    };
  }

  /* Сортировка по клику на заголовок: table[data-sort-table] > thead button — по номеру колонки.
     Числа вида «24 380 /26 000» сравниваются по первому числу. */
  function sortValue(td) {
    const t = (td ? td.innerText : '').trim();
    const m = t.replace(/\u00a0/g, ' ').match(/^[−-]?\d[\d ]*(?:[.,]\d+)?/);
    return m ? parseFloat(m[0].replace(/ /g, '').replace(',', '.').replace('−', '-')) : t.toLowerCase();
  }
  function initSortTables() {
    document.querySelectorAll('table[data-sort-table]').forEach(table => {
      const ths = Array.from(table.querySelectorAll('thead th'));
      ths.forEach(th => {
        const btn = th.querySelector('button');
        if (!btn) return;
        btn.type = 'button';
        btn.addEventListener('click', () => {
          const tbody = table.querySelector('tbody');
          const dir = btn.dataset.dir === 'desc' ? 'asc' : 'desc';
          ths.forEach(t => { const b = t.querySelector('button'); if (b && b !== btn) { delete b.dataset.dir; b.classList.remove('text-zinc-900'); } });
          btn.dataset.dir = dir;
          btn.classList.add('text-zinc-900');
          const idx = Array.from(th.parentElement.children).indexOf(th);
          const rows = Array.from(tbody.querySelectorAll(':scope > tr'));
          rows.sort((a, b) => {
            const av = sortValue(a.children[idx]), bv = sortValue(b.children[idx]);
            const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv), 'ru', { numeric: true });
            return dir === 'asc' ? cmp : -cmp;
          });
          rows.forEach(r => tbody.appendChild(r));
        });
      });
    });
  }

  /* ---------- Тосты: SEOApp.toast(текст, тон) и data-toast="Текст" (+ data-toast-tone) ----------
     Тон: success — зелёный, warning — янтарный, error — красный, info — нейтральный.
     Без явного тона определяется по тексту. Стек в правом верхнем углу, новые сверху, не больше трёх. */
  const TOAST_TONES = {
    success: ['bg-emerald-500', '<path d="M5 13l4 4L19 7"/>'],
    warning: ['bg-amber-500', '<path d="M12 7v6M12 17h.01"/>'],
    error:   ['bg-red-500', '<path d="M7 7l10 10M17 7L7 17"/>'],
    info:    ['bg-zinc-800', '<path d="M12 11v6M12 7h.01"/>']
  };
  const TOAST_ERROR = /^(Заполните|Проверьте|Напишите|Добавьте|Укажите|Выберите|Сначала|Нельзя|Недоступно|Недостаточно|Нет доступа|Ошибка|Не удалось|Принятые задачи не|Порученную задачу|Вернуть из проверки|Вставьте|Файл слишком)/;
  const TOAST_WARNING = /доработк|ждёт клиента|пауз|отключ|в архив|снят[ао]? с|отменен/i;
  const TOAST_SUCCESS = /принят|сохран|создан|отправлен|добавлен|подключ|оформлен|скопир|приглаш|передан|загружен|обновл|прикреплён|удален|удалён|готов|запущен|собран|включ|назначен|перенесен|перенесён|→/i;
  function toastTone(msg) {
    if (TOAST_ERROR.test(msg)) return 'error';
    if (TOAST_WARNING.test(msg)) return 'warning';
    if (TOAST_SUCCESS.test(msg)) return 'success';
    return 'info';
  }
  let toastBox;
  function dismissToast(el) {
    clearTimeout(el._timer);
    el.classList.add('opacity-0', 'translate-x-4');
    setTimeout(() => el.remove(), 250);
  }
  function toast(msg, tone) {
    if (!toastBox || !msg) return;
    tone = TOAST_TONES[tone] ? tone : toastTone(String(msg));
    const top = toastBox.firstElementChild;
    if (top && top.dataset.msg === msg) {
      clearTimeout(top._timer);
      top._timer = setTimeout(() => dismissToast(top), 3400);
      return;
    }
    const [dot, icon] = TOAST_TONES[tone];
    const el = document.createElement('div');
    el.setAttribute('role', 'status');
    el.dataset.tone = tone;
    el.dataset.msg = msg;
    el.className = 'pointer-events-auto flex items-start gap-3 w-full sm:w-auto sm:min-w-[260px] sm:max-w-sm pl-3 pr-2 py-2.5 rounded-2xl bg-white/90 backdrop-blur-xl shadow-pop ring-1 ring-black/5 text-sm text-zinc-900 transition duration-200 ease-out opacity-0 -translate-y-2';
    el.innerHTML = '<span class="mt-0.5 w-5 h-5 shrink-0 rounded-full ' + dot + ' text-white flex items-center justify-center">' +
      '<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24" aria-hidden="true">' + icon + '</svg></span>' +
      '<span data-toast-text class="flex-1 min-w-0 py-0.5 leading-snug font-medium"></span>' +
      '<button type="button" aria-label="Закрыть" class="w-6 h-6 shrink-0 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-black/5 flex items-center justify-center transition">' +
      '<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 18L18 6M6 6l12 12"/></svg></button>';
    el.querySelector('[data-toast-text]').textContent = msg;
    el.querySelector('button').addEventListener('click', () => dismissToast(el));
    el.addEventListener('mouseenter', () => clearTimeout(el._timer));
    el.addEventListener('mouseleave', () => { el._timer = setTimeout(() => dismissToast(el), 1800); });
    toastBox.prepend(el);
    Array.from(toastBox.children).slice(3).forEach(dismissToast);
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('opacity-0', '-translate-y-2')));
    el._timer = setTimeout(() => dismissToast(el), tone === 'error' ? 4200 : 3400);
  }
  function initToasts() {
    toastBox = document.createElement('div');
    toastBox.setAttribute('aria-live', 'polite');
    toastBox.className = 'fixed top-4 right-4 left-4 sm:left-auto sm:top-6 sm:right-6 z-[70] flex flex-col items-stretch sm:items-end gap-2 pointer-events-none';
    document.body.appendChild(toastBox);
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-toast]');
      if (t && !t.disabled && t.getAttribute('aria-disabled') !== 'true') toast(t.dataset.toast, t.dataset.toastTone);
    });
  }
  /* Комментарии задачи: task.html пишет, report.html берёт отмеченные «В отчёте».
     RICH — оформление отформатированного текста (жирный, курсив, списки, ссылки) в ленте и в отчёте. */
  const RICH = 'text-sm text-zinc-700 leading-relaxed break-words [&_b]:font-semibold [&_b]:text-zinc-900 [&_strong]:font-semibold [&_i]:italic [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 [&_li]:my-0.5 [&_a]:text-accent [&_a]:underline [&_p+p]:mt-1.5';
  const COMMENTS_KEY = 'seo_task_comments_1';
  const comments = {
    load() {
      try { return Object.assign({ items: [], flags: {} }, JSON.parse(localStorage.getItem(COMMENTS_KEY))); } catch (e) { return { items: [], flags: {} }; }
    },
    save(data) {
      try { localStorage.setItem(COMMENTS_KEY, JSON.stringify(data)); return true; } catch (e) { return false; }
    }
  };

  /* Микро-попап «На доработку» у кнопки: resolve(причина) или resolve(null) при отмене */
  let reasonPop = null;
  function askReason(anchor, opts) {
    opts = opts || {};
    if (reasonPop) reasonPop.cancel();
    return new Promise(resolve => {
      const el = document.createElement('div');
      el.setAttribute('role', 'dialog');
      el.setAttribute('aria-label', opts.title || 'Вернуть на доработку');
      el.className = 'fixed z-[65] w-[min(320px,calc(100vw-24px))] p-3 rounded-2xl bg-white/95 backdrop-blur-xl shadow-pop ring-1 ring-black/5';
      el.innerHTML =
        '<div class="text-sm font-semibold tracking-tight">' + (opts.title || 'Вернуть на доработку') + '</div>' +
        (opts.sub ? '<div class="text-xs text-zinc-500 mt-0.5 truncate">' + opts.sub + '</div>' : '') +
        '<textarea rows="3" data-reason aria-label="Что исправить" placeholder="' + (opts.placeholder || 'Что исправить — исполнитель увидит это в задаче') + '" class="mt-2 w-full px-3 py-2 rounded-xl border border-zinc-200 bg-white text-sm resize-none focus:outline-none focus:ring-4 focus:ring-accent/15 focus:border-accent/40"></textarea>' +
        '<div class="mt-2 flex items-center justify-end gap-2"><span class="mr-auto text-[11px] text-zinc-400">⌘↵ — ' + (opts.ok || 'Вернуть').toLowerCase() + '</span>' +
        '<button type="button" data-cancel class="px-3 py-1.5 rounded-full text-sm text-zinc-500 hover:text-zinc-900 hover:bg-black/5 transition">Отмена</button>' +
        '<button type="button" data-ok class="px-3.5 py-1.5 rounded-full bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition">' + (opts.ok || 'Вернуть') + '</button></div>';
      document.body.appendChild(el);
      const r = anchor.getBoundingClientRect();
      const w = el.offsetWidth, h = el.offsetHeight;
      let top = r.bottom + 8;
      if (top + h > innerHeight - 12) top = Math.max(12, r.top - h - 8);
      el.style.left = Math.min(Math.max(12, r.right - w), innerWidth - w - 12) + 'px';
      el.style.top = top + 'px';
      const ta = el.querySelector('[data-reason]');
      ta.focus();
      const outside = e => { if (!el.contains(e.target)) done(null); };
      const key = e => {
        if (e.key === 'Escape') { e.stopPropagation(); done(null); }
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); ok(); }
      };
      function done(v) {
        el.remove();
        reasonPop = null;
        document.removeEventListener('mousedown', outside, true);
        document.removeEventListener('keydown', key, true);
        resolve(v);
      }
      function ok() {
        const v = ta.value.trim();
        if (!v) { ta.classList.add('!border-red-300'); ta.focus(); return toast('Напишите, что нужно исправить', 'error'); }
        done(v);
      }
      reasonPop = { cancel: () => done(null) };
      el.querySelector('[data-cancel]').addEventListener('click', () => done(null));
      el.querySelector('[data-ok]').addEventListener('click', ok);
      setTimeout(() => document.addEventListener('mousedown', outside, true));
      document.addEventListener('keydown', key, true);
    });
  }

  Object.assign(window.SEOApp, {
    toast, segment: paintSegment, registerModal, openModal, closeModals, syncDeps,
    metricChart, plural, fmtNum, MONTHS, FIELD, roleInfo, RICH, comments, askReason, applyPermissions
  });

  /* ---------- Матрица разрешений (страница «Настройки → Роли») ---------- */
  const mark = v => {
    if (v === 'own') return '<span class="text-xs font-medium text-amber-700">свои</span>';
    if (v === 'limited') return '<span class="text-xs font-medium text-amber-700">огран.</span>';
    if (v) return '<svg class="w-[18px] h-[18px] mx-auto text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-label="Да"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg>';
    return '<span class="text-zinc-300" aria-label="Нет">—</span>';
  };
  const newBadge = '<span class="ml-2 px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-medium align-middle">новое</span>';
  const changedBadge = '<span class="ml-2 px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-medium align-middle">изменено</span>';
  const badges = i => (i.isNew ? newBadge : '') + (i.isChanged ? changedBadge : '');

  function renderMatrix() {
    const root = document.querySelector('[data-perm-matrix]');
    if (!root) return;

    const head = ROLES.map(r => '<th scope="col" class="px-2 py-3 text-center text-[11px] font-medium text-zinc-500 leading-tight w-24">' + r.label + '</th>').join('');
    let rows = '';
    GROUPS.forEach(g => {
      rows += '<tr><th scope="rowgroup" colspan="8" class="px-4 lg:px-6 pt-5 pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500 bg-zinc-50/70">' + g.title + '</th></tr>';
      g.items.forEach(i => {
        rows += '<tr class="hover:bg-zinc-50/60 transition"><th scope="row" class="px-4 lg:px-6 py-3 text-left text-sm font-normal">' + i.label + badges(i) +
          (i.note ? '<div class="text-xs text-zinc-500 mt-0.5">' + i.note + '</div>' : '') + '</th>' +
          ROLE_IDS.map(id => '<td class="px-2 py-3 text-center">' + mark(i.roles[id]) + '</td>').join('') + '</tr>';
      });
    });
    const table = '<div class="hidden md:block rounded-2xl bg-white shadow-card overflow-hidden"><div class="overflow-x-auto"><table class="w-full min-w-[820px]">' +
      '<thead><tr class="border-b border-black/5"><th scope="col" class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-zinc-500">Действие</th>' + head + '</tr></thead>' +
      '<tbody class="divide-y divide-zinc-100">' + rows + '</tbody></table></div></div>';

    const opts = ROLES.map(r => '<option value="' + r.id + '"' + (r.id === role ? ' selected' : '') + '>' + r.label + '</option>').join('');
    const mobile = '<div class="md:hidden">' +
      '<label for="matrix-role" class="block text-xs font-medium text-zinc-500 mb-2">Роль</label>' +
      '<select id="matrix-role" class="w-full px-3.5 py-2.5 rounded-xl border border-black/10 bg-white text-sm mb-4 focus:outline-none focus:ring-4 focus:ring-accent/15">' + opts + '</select>' +
      '<div data-matrix-list class="flex flex-col gap-4"></div></div>';

    root.innerHTML = mobile + table;

    const list = root.querySelector('[data-matrix-list]');
    const select = root.querySelector('#matrix-role');
    function drawList() {
      const id = select.value;
      list.innerHTML = GROUPS.map(g => '<section class="rounded-2xl bg-white shadow-card overflow-hidden">' +
        '<h3 class="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 bg-zinc-50/70">' + g.title + '</h3>' +
        '<ul class="divide-y divide-zinc-100">' + g.items.map(i => '<li class="px-4 py-3 flex items-center justify-between gap-3 text-sm"><span class="min-w-0">' + i.label + badges(i) + '</span><span class="shrink-0 w-12 text-center">' + mark(i.roles[id]) + '</span></li>').join('') + '</ul></section>').join('');
    }
    select.addEventListener('change', drawList);
    drawList();

    const cards = document.querySelector('[data-role-cards]');
    if (cards) {
      cards.innerHTML = ROLES.map(r => '<li class="rounded-2xl bg-white shadow-card p-4">' +
        '<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ' + r.badge + '">' + r.label + '</span>' +
        '<p class="text-sm text-zinc-600 mt-2">' + r.desc + '</p></li>').join('');
    }
  }

  /* ---------- 5. Область просмотра и быстрые представления ----------
     Один механизм на «Главной», в «Задачах» и в «Отчётах».

     Область = роль человека в задаче:
       exec — «Я исполнитель»: исполнитель или соисполнитель;
       set  — «Я постановщик»: задачи, которые я поставил другим;
       team — «Мои проекты»: всё по проектам, где я в команде (плюс то, что выше);
       all  — «Вся компания» (только у кого есть право view_all_projects).

     Элемент списка (строка таблицы, карточка доски):
       data-task  data-project="holod"  data-assignee="petrov"  data-co="kim sidorov"
       data-creator="petrov"  data-acceptor="petrov" (кто принимает; пусто — приёмка не нужна)
       data-flags="attention overdue"  data-status="review"
     Переключатель области:  [data-scope-switch] > button[data-scope="exec|set|team|all"]
                             (подпись под ним — [data-scope-hint], свой текст — data-hint-<область> на переключателе)
     Быстрые представления:  [data-view-switch]  > button[data-view="all|attention|review|overdue|waiting"]
     Группа строк:           [data-task-group] (+ data-limit="5")
     Блок вокруг группы:     [data-task-region] (+ data-hide-empty) c [data-region-count] и [data-task-empty]
                             (текст заглушки по областям — data-empty-exec / -set / -team / -all)
     Очередь приёмки:        [data-accept-queue] на группе — не зависит от области: видны только задачи,
                             которые текущий пользователь вправе принять (см. canAcceptItem)
     data-hide-if-acceptable — строку не показывать тем, кто принимает её в очереди (чтобы не дублировать)
     Источник счётчиков:     [data-count-source] (чтобы строки списка и карточки доски не считались дважды) */
  const PEOPLE = {
    owner:      { id: 'smirnov', projects: [] },
    seo_head:   { id: 'sidorov', projects: ['holod', 'remont'] },
    mgr_head:   { id: 'vetrova', projects: ['medlife', 'stroytech'] },
    pm:         { id: 'morozov', projects: ['holod', 'remont', 'medlife'] },
    employee:   { id: 'petrov',  projects: ['holod', 'remont'] },
    contractor: { id: 'kim',     projects: ['holod'] }
  };
  const ME = PEOPLE[role] || { id: '', projects: [] };
  const SCOPE_HINT = {
    exec: 'Задачи, где вы исполнитель или соисполнитель',
    set:  'Задачи, которые вы поставили другим исполнителям',
    team: 'Все задачи проектов, в команде которых вы состоите',
    all:  'Все задачи компании'
  };
  const SCOPE_DEFAULT = { owner: 'all', seo_head: 'all', mgr_head: 'all', pm: 'all', employee: 'all', contractor: 'exec' };
  const SEG_ON = ['bg-white', 'text-ink', 'shadow-sm'];
  const SEG_OFF = ['text-zinc-500'];
  const CHIP_ON = SEG_ON;
  const CHIP_OFF = SEG_OFF;
  const isLead = LEADS.indexOf(role) !== -1;
  const SETTER_NAME = {
    petrov: 'А. Петров', morozov: 'Н. Морозов', sidorov: 'И. Сидоров', kim: 'М. Ким',
    lebedev: 'П. Лебедев', smirnov: 'А. Смирнов', vetrova: 'О. Ветрова', dronov: 'И. Дронов'
  };
  const PAGE = location.pathname.split('/').pop() || 'index.html';
  const SCOPE_KEY = 'seo_control_scope_' + role + '_' + PAGE;

  let scope = 'all';
  let view = 'all';

  const words = v => (v || '').split(' ').filter(Boolean);

  /* Приёмка: постановщик, PM и руководство. Исполнитель — только если он же постановщик. */
  function canAcceptItem(el) {
    if (!can('accept_work')) return false;
    if (!el || !el.dataset) return isLead || role === 'pm';
    if (isLead || role === 'pm') return true;
    return el.dataset.creator === ME.id;
  }

  function matchesScope(el) {
    const d = el.dataset;
    const project = d.project || '';
    if (!can('view_all_projects') && project && !ME.projects.includes(project)) return false;
    if (el.closest('[data-home-feed]') && !isLead && d.creator !== ME.id) return false;
    if (el.closest('[data-accept-queue]')) return canAcceptItem(el);
    if (el.hasAttribute('data-hide-if-acceptable') && canAcceptItem(el)) return false;
    const exec = !!ME.id && (d.assignee === ME.id || words(d.co).includes(ME.id));
    const setter = !!ME.id && d.creator === ME.id && d.assignee !== ME.id;
    if (scope === 'all') return true;
    if (scope === 'exec') return exec;
    if (scope === 'set') return setter;
    return exec || setter || (!!project && ME.projects.includes(project));
  }
  const hasFlag = (el, v) => v === 'all' || words(el.dataset.flags).includes(v);
  /* Дополнительный фильтр страницы (например, отчётный месяц): SEOApp.setTaskFilter(el => bool) */
  let pageFilter = null;
  const inScope = el => matchesScope(el) && (!pageFilter || pageFilter(el));

  function applyFilters() {
    document.querySelectorAll('[data-task]').forEach(el => {
      el.dataset.match = (inScope(el) && hasFlag(el, view)) ? '1' : '0';
      const isCo = words(el.dataset.co).includes(ME.id);
      el.querySelectorAll('[data-co-tag]').forEach(t => t.classList.toggle('hidden', !isCo));
      el.querySelectorAll('[data-tags]').forEach(h => {
        h.classList.toggle('hidden', !Array.from(h.children).some(c => !c.classList.contains('hidden')));
      });
    });

    document.querySelectorAll('[data-task-group]').forEach(g => {
      const limit = parseInt(g.dataset.limit || '0', 10);
      let shown = 0, matched = 0;
      g.querySelectorAll(':scope > [data-task]').forEach(el => {
        const m = el.dataset.match === '1';
        if (m) matched++;
        const visible = m && (!limit || shown < limit);
        if (visible) shown++;
        el.classList.toggle('!hidden', !visible);
      });
      g.dataset.matched = String(matched);
    });

    const emptyKey = 'empty' + scope.charAt(0).toUpperCase() + scope.slice(1);
    document.querySelectorAll('[data-task-region]').forEach(r => {
      const g = r.querySelector('[data-task-group]');
      const n = g ? parseInt(g.dataset.matched || '0', 10) : 0;
      r.querySelectorAll('[data-region-count]').forEach(c => { c.textContent = n; });
      r.querySelectorAll('[data-task-empty]').forEach(m => {
        m.classList.toggle('hidden', n > 0);
        const text = m.querySelector('[data-empty-text]') || m;
        if (text.children.length > 0) return;
        const inScopeCount = g ? Array.from(g.querySelectorAll(':scope > [data-task]')).filter(inScope).length : n;
        if (pageFilter && inScopeCount === 0 && m.dataset.emptyFilter) text.textContent = m.dataset.emptyFilter;
        else if (m.dataset[emptyKey] && inScopeCount === 0) text.textContent = m.dataset[emptyKey];
        else if (m.dataset.emptyView && view !== 'all') text.textContent = m.dataset.emptyView;
        else if (m.dataset[emptyKey]) text.textContent = m.dataset[emptyKey];
      });
      if (r.hasAttribute('data-hide-empty')) r.classList.toggle('!hidden', n === 0);
    });

    const source = document.querySelector('[data-count-source]') || document;
    const pool = Array.from(source.querySelectorAll('[data-task]'));
    document.querySelectorAll('[data-view-count]').forEach(c => {
      const v = c.dataset.viewCount;
      c.textContent = pool.filter(el => inScope(el) && hasFlag(el, v)).length;
    });
    document.querySelectorAll('[data-visible-count]').forEach(c => {
      c.textContent = pool.filter(el => el.dataset.match === '1').length;
    });
  }

  function paintSwitches() {
    document.querySelectorAll('[data-scope-switch] [data-scope]').forEach(b => {
      const on = b.dataset.scope === scope;
      SEG_ON.forEach(c => b.classList.toggle(c, on));
      SEG_OFF.forEach(c => b.classList.toggle(c, !on));
      b.classList.add('font-medium'); /* одинаковое начертание — кнопки не меняют ширину и не «прыгают» */
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    document.querySelectorAll('[data-view-switch]').forEach(el => {
      if (el.hasAttribute('data-scope-switch')) return;
      el.classList.add('inline-flex', 'bg-zinc-100', 'rounded-full', 'p-1', 'max-w-full');
    });
    document.querySelectorAll('[data-view-switch] [data-view]').forEach(b => {
      const on = b.dataset.view === view;
      ['bg-zinc-900', 'text-white', 'bg-white', 'shadow-card', 'shadow-sm', 'text-zinc-900', 'text-ink', 'text-zinc-700'].forEach(c => b.classList.remove(c));
      (on ? CHIP_ON : CHIP_OFF).forEach(c => b.classList.add(c));
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
    const sw = document.querySelector('[data-scope-switch]');
    const custom = sw ? sw.dataset['hint' + scope.charAt(0).toUpperCase() + scope.slice(1)] : '';
    document.querySelectorAll('[data-scope-hint]').forEach(h => { h.textContent = custom || SCOPE_HINT[scope] || ''; });
  }

  function initScope() {
    if (!document.querySelector('[data-task], [data-scope-switch]')) return;
    const avail = Array.from(new Set(Array.from(document.querySelectorAll('[data-scope-switch] [data-scope]')).filter(b => b.getAttribute('aria-disabled') !== 'true').map(b => b.dataset.scope)));
    let saved = null;
    try { saved = localStorage.getItem(SCOPE_KEY); } catch (e) { /* ignore */ }
    if (saved && avail.includes(saved)) scope = saved;
    else if (avail.includes(SCOPE_DEFAULT[role])) scope = SCOPE_DEFAULT[role];
    else scope = avail[0] || 'all';
    const fromUrl = new URLSearchParams(location.search).get('view');
    if (fromUrl && document.querySelector('[data-view-switch] [data-view="' + fromUrl + '"]')) view = fromUrl;

    document.addEventListener('click', e => {
      const s = e.target.closest('[data-scope-switch] [data-scope]');
      if (s && s.getAttribute('aria-disabled') === 'true') return;
      if (s) {
        scope = s.dataset.scope;
        try { localStorage.setItem(SCOPE_KEY, scope); } catch (err) { /* ignore */ }
      }
      const v = e.target.closest('[data-view-switch] [data-view]');
      if (v) view = v.dataset.view;
      if (s || v) { paintSwitches(); applyFilters(); }

      const done = e.target.closest('[data-resolve]');
      if (done) {
        const row = done.closest('[data-task]');
        toast(done.dataset.resolve);
        if (row) row.remove();
        applyFilters();
      }
    });
    paintSwitches();
    applyFilters();
  }

  /* Для страниц со своей логикой задач (доска и список в tasks.html) */
  Object.assign(window.SEOApp, {
    me: ME.id, myProjects: ME.projects, isLead,
    canAccept: creator => can('accept_work') && (isLead || role === 'pm' || creator === ME.id),
    setTaskFilter(fn) { pageFilter = fn || null; applyFilters(); },
    dateInRange, dateRange, paintDateRange: paintRangeRows
  });

  /* ---------- Место руководителя SEO ----------
     Две роли остаются раздельными. Кто ведёт отдел, решает приглашение:
     руководитель приглашён — отдел ведёт он; нет — место занимает владелец.
     data-seat-hired — видно, пока руководитель приглашён
     data-seat-self  — видно, пока отдел ведёт владелец
     data-seat-action="self|hire" — переключить сценарий */
  function paintSeat() {
    document.querySelectorAll('[data-seat-hired]').forEach(el => el.classList.toggle('!hidden', ownerLeadsSeo));
    document.querySelectorAll('[data-seat-self]').forEach(el => el.classList.toggle('!hidden', !ownerLeadsSeo));
  }

  function initSeat() {
    if (!document.querySelector('[data-seat-action], [data-seat-hired], [data-seat-self]')) return;
    paintSeat();
    document.addEventListener('click', e => {
      const b = e.target.closest('[data-seat-action]');
      if (!b) return;
      const self = b.dataset.seatAction === 'self';
      try {
        localStorage.setItem(SEAT_KEY, self ? '1' : '0');
        if (!self) localStorage.setItem('seo_control_open_invite', '1');
      } catch (err) { /* ignore */ }
      if (location.hash !== '#users') location.hash = 'users';
      location.reload();
    });

    let openInvite = false;
    try {
      openInvite = localStorage.getItem('seo_control_open_invite') === '1';
      if (openInvite) localStorage.removeItem('seo_control_open_invite');
    } catch (e) { /* ignore */ }
    if (!openInvite) return;
    const modal = openModal('invite');
    if (!modal) return;
    const sel = modal.querySelector('[name="role"]');
    if (sel) {
      sel.value = 'seo_head';
      syncDeps(modal);
      sel.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  /* Список проектов: уровень «сотрудник» видит все проекты компании. */
  function applyProjectList() {
    const rows = document.querySelectorAll('[data-project-row]');
    if (!rows.length) return;
    const limited = !can('view_all_projects');
    rows.forEach(el => {
      el.dataset.roleOut = (limited && !ME.projects.includes(el.dataset.projectRow || '')) ? '1' : '0';
    });
    paintRangeRows();
  }

  function initHomeTables() {
    const labelToKey = { 'Задача': 'task', 'Проект': 'project', 'Исполнитель': 'assignee', 'Статус': 'status', 'Срок': 'due', 'Постановщик': 'setter' };
    document.querySelectorAll('table[data-setter-col] tbody tr[data-task]').forEach(tr => {
      if (tr.querySelector('[data-sort-col="setter"]')) return;
      const td = document.createElement('td');
      td.dataset.sortCol = 'setter';
      td.dataset.label = 'Постановщик';
      td.className = 'md:px-3 md:py-3 lg:py-4 text-sm whitespace-nowrap min-w-0 before:block before:text-[11px] before:text-zinc-500 before:mb-0.5 before:content-[attr(data-label)] md:before:hidden';
      td.textContent = SETTER_NAME[tr.dataset.creator] || '—';
      const project = tr.querySelector('[data-label="Проект"]');
      if (project) project.after(td);
    });
    document.querySelectorAll('table[data-sortable]').forEach(table => {
      table.querySelectorAll('tbody tr').forEach(tr => {
        tr.querySelectorAll('td[data-label]').forEach(td => {
          const key = labelToKey[td.dataset.label];
          if (key && !td.dataset.sortCol) td.dataset.sortCol = key;
        });
        const first = tr.querySelector('td');
        if (first && !first.dataset.sortCol) first.dataset.sortCol = 'task';
      });
      table.querySelectorAll('thead button[data-sort]').forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.dataset.sort;
          const tbody = table.querySelector('tbody');
          if (!tbody) return;
          const dir = btn.dataset.dir === 'asc' ? 'desc' : 'asc';
          table.querySelectorAll('thead button[data-sort]').forEach(b => { if (b !== btn) delete b.dataset.dir; });
          btn.dataset.dir = dir;
          const rows = Array.from(tbody.querySelectorAll(':scope > tr'));
          rows.sort((a, b) => {
            const av = (a.querySelector('[data-sort-col="' + key + '"]') || a).innerText.trim();
            const bv = (b.querySelector('[data-sort-col="' + key + '"]') || b).innerText.trim();
            const cmp = av.localeCompare(bv, 'ru', { numeric: true });
            return dir === 'asc' ? cmp : -cmp;
          });
          rows.forEach(r => tbody.appendChild(r));
        });
      });
    });
    document.querySelectorAll('[data-task] a.font-medium').forEach(a => {
      if (a.classList.contains('text-sm')) {
        a.classList.remove('text-sm');
        a.classList.add('text-base');
      }
    });
  }

  function initHscroll() {
    document.querySelectorAll('[data-hscroll]').forEach(scroller => {
      if (scroller.dataset.hscrollReady) return;
      scroller.dataset.hscrollReady = '1';
      const bar = document.createElement('div');
      bar.className = 'flex items-center justify-end gap-2 mb-2';
      [-1, 1].forEach(dir => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'w-8 h-8 rounded-full bg-white border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50';
        b.setAttribute('aria-label', dir < 0 ? 'Прокрутить влево' : 'Прокрутить вправо');
        b.textContent = dir < 0 ? '←' : '→';
        b.addEventListener('click', () => scroller.scrollBy({ left: dir * 280, behavior: 'smooth' }));
        bar.appendChild(b);
      });
      scroller.parentNode.insertBefore(bar, scroller);
    });
  }

  /* ---------- Старт ---------- */
  function start() {
    initChrome();
    buildSharedModals();
    applyPermissions();
    applyProjectList();
    initTabs();
    initSegments();
    initModals();
    initConfirm();
    initToasts();
    initTooltips();
    initDemoActions();
    initMonthNav();
    initDateRange();
    renderMatrix();
    initScope();
    initSeat();
    initHomeTables();
    initSortTables();
    initHscroll();
    document.dispatchEvent(new CustomEvent('seo:ready'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
