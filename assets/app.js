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
  }
};

(function () {
  'use strict';

  /* ---------- 2. Роли и права ---------- */
  const COMPANY = { name: 'Ромашка Digital', initials: 'Р', workspace: 'romashka.seo-control.app' };

  const ROLES = [
    { id: 'owner',      label: 'Владелец компании',       user: 'Александр Смирнов', initials: 'АС', badge: 'bg-zinc-900 text-white',      desc: 'Делает всё в компании, включая профиль, тариф, смену ролей и удаление компании.' },
    { id: 'seo_head',   label: 'Руководитель SEO',        user: 'Иван Сидоров',      initials: 'ИС', badge: 'bg-blue-50 text-blue-700',    desc: 'Полный доступ, кроме профиля компании, тарифа, смены ролей и удаления компании. Шаблоны и интеграции ему доступны.' },
    { id: 'mgr_head',   label: 'Руководитель менеджеров', user: 'Ольга Ветрова',     initials: 'ОВ', badge: 'bg-violet-50 text-violet-700', desc: 'Тот же доступ, что у руководителя SEO: всё, кроме профиля, тарифа, смены ролей и удаления компании.' },
    { id: 'pm',         label: 'Менеджер проекта',        user: 'Никита Морозов',    initials: 'НМ', badge: 'bg-amber-50 text-amber-700',  desc: 'Ведёт проекты, задачи, людей, отчёты и деньги. Не настраивает шаблоны и не подключает интеграции. Профиль компании закрыт.' },
    { id: 'employee',   label: 'SEO-специалист',          user: 'Алексей Петров',    initials: 'АП', badge: 'bg-emerald-50 text-emerald-700', desc: 'Тот же доступ, что у менеджера проекта: все проекты и отчёты, без шаблонов, интеграций и профиля компании.' },
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
      { key: 'create_client',     label: 'Создать и редактировать клиента', level: 'staff' },
      { key: 'create_project',    label: 'Создать проект',                  level: 'staff' },
      { key: 'edit_project',      label: 'Редактировать проект, карту и план месяца', level: 'staff' },
      { key: 'transfer_project',  label: 'Передать проект другому специалисту', level: 'staff' },
      { key: 'archive_project',   label: 'Архивировать проект',             level: 'staff' },
      { key: 'delete_project',    label: 'Удалить проект',                  level: 'staff' }
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
    { id: 'brief',     href: 'brief.html',     label: 'Бриф',         icon: 'check',    roles: ['client'] },
    { group: 'Команда', roles: STAFF },
    { id: 'executors', href: 'executors.html', label: 'Сотрудники',   icon: 'team',     roles: STAFF },
    { id: 'templates', href: 'templates.html', label: 'Шаблоны',      icon: 'layers',   roles: LEADS },
    { id: 'guide',     href: 'guide.html',     label: 'Как устроено', icon: 'layers',   roles: STAFF.concat(['contractor']) }
  ];
  const NAV_FOOT = [
    { id: 'portal', href: 'portal.html', label: 'Портал клиента', icon: 'eye', roles: STAFF },
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
    if (main) main.classList.add('pb-24', 'lg:pb-0', 'lg:pl-64');
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
     Кнопки и ссылки чужой роли остаются на месте и становятся неактивными.
     Текстовые блоки по-прежнему скрываются.
     data-can="ключ"        — активно, только если право есть
     data-roles="a,b"       — активно только для перечисленных ролей
     data-deny="a,b"        — неактивно для перечисленных ролей
     data-role-name / data-user-name / data-user-full — подстановка текущей роли / имени / имени и фамилии */
  function isActionControl(el) {
    const tag = el.tagName;
    return tag === 'BUTTON' || tag === 'A' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
  }

  function denyControl(el) {
    if (el.getAttribute('aria-disabled') === 'true') return;
    el.setAttribute('aria-disabled', 'true');
    el.classList.add('opacity-40', 'cursor-not-allowed');
    if (el.tagName === 'A') {
      el.addEventListener('click', e => e.preventDefault());
      el.removeAttribute('href');
    } else {
      el.disabled = true;
    }
  }

  function gate(el, allowed) {
    if (allowed) return;
    if (isActionControl(el)) denyControl(el);
    else el.remove();
  }

  function applyPermissions() {
    document.querySelectorAll('[data-can]').forEach(el => {
      const keys = el.dataset.can.split(',').map(s => s.trim());
      gate(el, keys.some(can));
    });
    document.querySelectorAll('[data-roles]').forEach(el => {
      if (el.hasAttribute('data-app-chrome')) return;
      gate(el, covers(role, el.dataset.roles.split(',').map(s => s.trim())));
    });
    document.querySelectorAll('[data-deny]').forEach(el => {
      gate(el, !covers(role, el.dataset.deny.split(',').map(s => s.trim())));
    });
    /* data-accept-item data-acceptor="id" — только тем, кто вправе принять эту задачу;
       data-accept-deny — наоборот, тем, кто принять не может (показываем, кто принимает) */
    document.querySelectorAll('[data-accept-item]').forEach(el => { gate(el, canAcceptItem(el)); });
    document.querySelectorAll('[data-accept-deny]').forEach(el => { if (canAcceptItem(el)) el.remove(); });
    const r = roleInfo(role);
    document.querySelectorAll('[data-role-name]').forEach(el => { el.textContent = roleLabel(); });
    document.querySelectorAll('[data-user-name]').forEach(el => { el.textContent = r.user.split(' ')[0]; });
    document.querySelectorAll('[data-user-full]').forEach(el => { el.textContent = r.user; });
  }

  /* ---------- 4. Табы ---------- */
  const TAB_ON = ['bg-white', 'text-zinc-900', 'shadow-sm'];
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

  /* ---------- Модалки: id = <name>-modal ---------- */
  function initModals() {
    const all = () => document.querySelectorAll('[id$="-modal"]');
    const close = () => { all().forEach(m => m.classList.add('hidden')); document.body.classList.remove('overflow-hidden'); };
    document.addEventListener('click', e => {
      const opener = e.target.closest('[data-open-modal]');
      if (opener) {
        const modal = document.getElementById(opener.dataset.openModal + '-modal');
        if (modal) { all().forEach(m => m.classList.add('hidden')); modal.classList.remove('hidden'); document.body.classList.add('overflow-hidden'); }
        return;
      }
      if (e.target.closest('[data-close-modal]')) close();
    });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  /* ---------- Тосты для демо-действий: data-toast="Текст" ---------- */
  let toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 2600);
  }
  function initToasts() {
    toastEl = document.createElement('div');
    toastEl.setAttribute('role', 'status');
    toastEl.className = 'hidden fixed left-1/2 -translate-x-1/2 bottom-24 lg:bottom-8 z-[60] px-4 py-2.5 rounded-full bg-zinc-900/90 backdrop-blur text-white text-sm font-medium shadow-pop max-w-[90vw] text-center';
    document.body.appendChild(toastEl);
    document.addEventListener('click', e => {
      const t = e.target.closest('[data-toast]');
      if (t) toast(t.dataset.toast);
    });
  }
  window.SEOApp.toast = toast;

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
  const SEG_ON = ['bg-white', 'text-zinc-900', 'shadow-sm'];
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

  /* Приёмка есть у всего уровня «сотрудник» и выше. Подрядчик и клиент чужие задачи не принимают. */
  function canAcceptItem(el) {
    if (!can('accept_work')) return false;
    if (!el || !el.dataset) return isLead;
    if (isLead) return true;
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

  function applyFilters() {
    document.querySelectorAll('[data-task]').forEach(el => {
      el.dataset.match = (matchesScope(el) && hasFlag(el, view)) ? '1' : '0';
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
        const inScope = g ? Array.from(g.querySelectorAll(':scope > [data-task]')).filter(el => matchesScope(el)).length : n;
        if (m.dataset[emptyKey] && inScope === 0) text.textContent = m.dataset[emptyKey];
        else if (m.dataset.emptyView && view !== 'all') text.textContent = m.dataset.emptyView;
        else if (m.dataset[emptyKey]) text.textContent = m.dataset[emptyKey];
      });
      if (r.hasAttribute('data-hide-empty')) r.classList.toggle('!hidden', n === 0);
    });

    const source = document.querySelector('[data-count-source]') || document;
    const pool = Array.from(source.querySelectorAll('[data-task]'));
    document.querySelectorAll('[data-view-count]').forEach(c => {
      const v = c.dataset.viewCount;
      c.textContent = pool.filter(el => matchesScope(el) && hasFlag(el, v)).length;
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
      ['bg-zinc-900', 'text-white', 'bg-white', 'shadow-card', 'shadow-sm', 'text-zinc-900', 'text-zinc-700'].forEach(c => b.classList.remove(c));
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

  /* ---------- 6. Канбан-доска: перетаскивание карточек ----------
     Колонки = статусы: planned → progress → review → waiting / done.
     Правила: порученную задачу принимает постановщик, в том числе если он же исполнитель.
     Владелец и руководители принимают любую. Чужую постановку исполнитель не принимает. */
  const STATUS_NAME = { planned: 'Запланирована', progress: 'В работе', review: 'На проверке', waiting: 'Ждёт клиента', done: 'Принята' };
  const CHIP_CLS = {
    planned:  ['bg-zinc-100', 'text-zinc-700', 'bg-zinc-500'],
    progress: ['bg-blue-50', 'text-blue-700', 'bg-blue-600'],
    review:   ['bg-amber-50', 'text-amber-700', 'bg-amber-600'],
    waiting:  ['bg-violet-50', 'text-violet-700', 'bg-violet-600'],
    done:     ['bg-emerald-50', 'text-emerald-700', 'bg-emerald-600']
  };
  const TAG_BASE = 'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap ';

  function setCardTag(card, kind) {
    card.querySelectorAll('[data-state-tag]').forEach(t => t.remove());
    const holder = card.querySelector('[data-tags]');
    if (!holder || !kind) return;
    const el = document.createElement('span');
    el.setAttribute('data-state-tag', kind);
    el.className = TAG_BASE + (kind === 'returned' ? 'bg-orange-50 text-orange-700' : 'bg-violet-50 text-violet-700');
    el.textContent = kind === 'returned' ? 'На доработке' : 'ждём клиента';
    holder.prepend(el);
    holder.classList.remove('hidden');
  }

  function moveCard(card, to) {
    const from = card.dataset.status;
    if (from === to) return;
    const title = (card.querySelector('a') || card).textContent.trim();
    if (from === 'done') return toast('Принятые задачи не перемещаются');
    const who = card.dataset.acceptorName || 'руководитель SEO';
    const acceptable = canAcceptItem(card);
    if (to === 'done') {
      if (!acceptable) return toast('Порученную задачу принимает постановщик');
      if (from !== 'review') return toast('Сначала задачу нужно передать на проверку');
    }
    if (from === 'review' && to !== 'done' && !acceptable) {
      return toast('Вернуть из проверки может постановщик');
    }

    const col = document.querySelector('[data-board-col="' + to + '"]');
    if (!col) return;
    col.appendChild(card);
    card.dataset.status = to;

    const dropped = to === 'done' ? ['review', 'waiting', 'returned', 'attention', 'overdue'] : ['review', 'waiting', 'returned', 'attention'];
    const flags = (card.dataset.flags || '').split(' ').filter(f => f && !dropped.includes(f));
    if (flags.includes('overdue')) flags.push('attention');
    if (to === 'review') flags.push('review');
    if (to === 'waiting') flags.push('waiting', 'attention');
    const returned = from === 'review' && to === 'progress';
    if (returned) flags.push('returned', 'attention');
    card.dataset.flags = flags.join(' ');

    setCardTag(card, to === 'waiting' ? 'waiting' : (returned ? 'returned' : null));
    card.querySelectorAll('[data-acceptor-line]').forEach(l => l.classList.toggle('hidden', to !== 'review'));

    /* то же задача в табличном виде: статус и признаки не расходятся с доской */
    const c = CHIP_CLS[to];
    document.querySelectorAll('tr[data-task][data-id="' + card.dataset.id + '"]').forEach(row => {
      row.dataset.status = to;
      row.dataset.flags = card.dataset.flags;
      const cell = row.querySelector('td[data-label="Статус"]');
      if (cell) {
        cell.innerHTML = '<span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ' + c[0] + ' ' + c[1] + '">' +
          '<span class="w-1.5 h-1.5 rounded-full ' + c[2] + '"></span>' + STATUS_NAME[to] + '</span>';
      }
    });
    applyFilters();

    let msg = '«' + title + '» → ' + STATUS_NAME[to];
    if (to === 'review') msg += ' · принимает ' + (card.dataset.acceptorName || 'руководитель SEO');
    if (returned) msg += ' · исполнитель уведомлён';
    toast(msg);
  }

  function initBoard() {
    const cols = document.querySelectorAll('[data-board-col]');
    if (!cols.length) return;
    const hint = ['bg-accent/10', 'ring-2', 'ring-accent/30'];
    let dragged = null;
    document.addEventListener('dragstart', e => {
      const card = e.target.closest ? e.target.closest('[data-task][draggable]') : null;
      if (!card) return;
      dragged = card;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', card.dataset.id || '');
      setTimeout(() => card.classList.add('opacity-40'), 0);
    });
    document.addEventListener('dragend', () => {
      if (dragged) dragged.classList.remove('opacity-40');
      dragged = null;
      cols.forEach(c => hint.forEach(k => c.classList.remove(k)));
    });
    cols.forEach(col => {
      col.addEventListener('dragover', e => { if (dragged) { e.preventDefault(); hint.forEach(k => col.classList.add(k)); } });
      col.addEventListener('dragleave', e => { if (!col.contains(e.relatedTarget)) hint.forEach(k => col.classList.remove(k)); });
      col.addEventListener('drop', e => {
        e.preventDefault();
        hint.forEach(k => col.classList.remove(k));
        if (dragged) moveCard(dragged, col.dataset.boardCol);
      });
    });
  }

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
    const modal = document.getElementById('invite-modal');
    if (!modal) return;
    const sel = modal.querySelector('select');
    if (sel) {
      const opt = Array.from(sel.options).find(o => o.textContent.trim() === 'Руководитель SEO');
      if (opt) sel.value = opt.value;
    }
    modal.classList.remove('hidden');
    document.body.classList.add('overflow-hidden');
  }

  /* Список проектов: уровень «сотрудник» видит все проекты компании. */
  function applyProjectList() {
    const rows = document.querySelectorAll('[data-project-row]');
    if (!rows.length) return;
    if (!can('view_all_projects')) {
      rows.forEach(el => {
        if (!ME.projects.includes(el.dataset.projectRow || '')) el.classList.add('!hidden');
      });
    }
    const n = Array.from(rows).filter(el => !el.classList.contains('!hidden')).length;
    document.querySelectorAll('[data-project-summary]').forEach(el => {
      const num = '<span class="tabular-nums text-zinc-900 font-medium">';
      el.innerHTML = n
        ? 'Показано ' + num + '1–' + n + '</span> из ' + num + n + '</span>'
        : 'Показано ' + num + '0</span>';
    });
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
    applyPermissions();
    applyProjectList();
    initTabs();
    initModals();
    initToasts();
    renderMatrix();
    initScope();
    initBoard();
    initSeat();
    initHomeTables();
    initHscroll();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
