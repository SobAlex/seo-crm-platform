/* SEO Control — общие окна прототипа.
   Подключается в <head> после assets/app.js. Регистрирует окна в SEOApp.registerModal:
   app.js строит окно, если на странице есть кнопка data-open-modal="<имя>".
   Здесь же — демо-справочники, на которые ссылаются поля: клиенты, типы проектов,
   шаблоны дорожных карт, команда, проекты. */
(function () {
  'use strict';
  const App = window.SEOApp;
  if (!App || !App.registerModal) return;

  /* ---------- Справочники ---------- */
  const CLIENTS = [
    { id: 'holod',     name: 'ООО «Холод Групп»', inn: '7701234567',   city: 'Москва',          rate: 2500, contact: 'Сергей Волков',   post: 'Директор по маркетингу', email: 's.volkov@holod.ru',     phone: '+7 495 123-45-67', brief: 'ecommerce' },
    { id: 'smirnov',   name: 'ИП Смирнов А.',     inn: '771234567890', city: 'Москва',          rate: 2000, contact: 'Андрей Смирнов',  post: 'Владелец',               email: 'a@remont-plus.ru',      phone: '+7 916 555-12-34', brief: 'services' },
    { id: 'stroytech', name: 'АО «Стройтех»',     inn: '7812345678',   city: 'Санкт-Петербург', rate: 2800, contact: 'Михаил Орлов',    post: 'Коммерческий директор',  email: 'm.orlov@stroytech.ru',  phone: '+7 812 300-40-50', brief: 'b2b' },
    { id: 'medlife',   name: 'ООО «МедЛайф»',     inn: '5401234567',   city: 'Новосибирск',     rate: 2200, contact: 'Елена Крылова',   post: 'Маркетолог',             email: 'e.krylova@medlife.ru',  phone: '+7 383 200-10-20', brief: 'base' },
    { id: 'alfa',      name: 'ООО «Альфа»',       inn: '6658123456',   city: 'Екатеринбург',    rate: 2400, contact: 'Дмитрий Лебедев', post: 'Руководитель e-com',     email: 'd.lebedev@alfa-group.ru', phone: '+7 343 222-33-44', brief: 'ecommerce' }
  ];
  const TYPES = [
    { id: 'ecommerce', name: 'Интернет-магазин' },
    { id: 'services',  name: 'Сайт услуг' },
    { id: 'b2b',       name: 'B2B портал' },
    { id: 'info',      name: 'Информационный сайт' },
    { id: 'landing',   name: 'Лендинг' }
  ];
  const ROADMAPS = [
    { id: 'rm-ecom',      type: 'ecommerce', name: 'Интернет-магазин · 6 месяцев',          info: '4 направления · 18 работ · 268 ч' },
    { id: 'rm-ecom-fast', type: 'ecommerce', name: 'Интернет-магазин · быстрый старт, 3 мес', info: '3 направления · 9 работ · 120 ч' },
    { id: 'rm-services',  type: 'services',  name: 'Сайт услуг · 6 месяцев',                info: '4 направления · 14 работ · 180 ч' },
    { id: 'rm-local',     type: 'services',  name: 'Локальные услуги · гео-продвижение',    info: '3 направления · 10 работ · 110 ч' },
    { id: 'rm-b2b',       type: 'b2b',       name: 'B2B портал · 12 месяцев',               info: '5 направлений · 26 работ · 420 ч' },
    { id: 'rm-info',      type: 'info',      name: 'Информационный сайт · контент-план',    info: '3 направления · 12 работ · 150 ч' },
    { id: 'rm-landing',   type: 'landing',   name: 'Лендинг · 3 месяца',                    info: '2 направления · 6 работ · 48 ч' }
  ];
  const BRIEFS = [
    { id: 'base',      name: 'Базовый SEO-бриф' },
    { id: 'ecommerce', name: 'Бриф интернет-магазина' },
    { id: 'services',  name: 'Бриф сайта услуг' },
    { id: 'b2b',       name: 'Бриф B2B-компании' }
  ];
  const TEAM = [
    { id: 'smirnov',  name: 'Александр Смирнов', role: 'owner',      dept: 'Руководство', load: '12/40', projects: [] },
    { id: 'sidorov',  name: 'Иван Сидоров',      role: 'seo_head',   dept: 'SEO',         load: '30/40', projects: ['holod', 'stroytech'] },
    { id: 'vetrova',  name: 'Ольга Ветрова',     role: 'mgr_head',   dept: 'Менеджеры',   load: '26/40', projects: ['stroytech', 'medlife'] },
    { id: 'morozov',  name: 'Никита Морозов',    role: 'pm',         dept: 'Менеджеры',   load: '32/40', projects: ['holod', 'remont', 'medlife'] },
    { id: 'petrov',   name: 'Алексей Петров',    role: 'employee',   dept: 'SEO',         load: '44/40', projects: ['holod', 'remont'] },
    { id: 'dronov',   name: 'Иван Дронов',       role: 'employee',   dept: 'SEO',         load: '28/40', projects: ['stroytech', 'medlife'] },
    { id: 'kim',      name: 'Мария Ким',         role: 'contractor', dept: '—',           load: '16/20', projects: ['holod', 'remont', 'stroytech'] }
  ];
  const PROJECTS = [
    { id: 'holod',     name: 'Интернет-магазин «Холод»', client: 'holod',     site: 'holod-shop.ru' },
    { id: 'holodb2b',  name: 'Оптовый портал «Холод B2B»', client: 'holod',   site: 'b2b.holod-shop.ru' },
    { id: 'remont',    name: 'Сайт услуг «Ремонт+»',     client: 'smirnov',   site: 'remont-plus.ru' },
    { id: 'stroytech', name: 'B2B портал «Стройтех»',    client: 'stroytech', site: 'stroytech.ru' },
    { id: 'medlife',   name: 'Клиника «МедЛайф»',        client: 'medlife',   site: 'medlife.ru' }
  ];
  const ME = { owner: 'smirnov', seo_head: 'sidorov', mgr_head: 'vetrova', pm: 'morozov', employee: 'petrov', contractor: 'kim' };
  const INVITE_PERM = { seo_head: 'hire_seo', employee: 'hire_seo', mgr_head: 'hire_managers', pm: 'hire_managers', contractor: 'invite_contractors', client: 'invite_clients' };

  App.data = { CLIENTS, TYPES, ROADMAPS, BRIEFS, TEAM, PROJECTS };

  /* ---------- Разметка полей ---------- */
  const F = App.FIELD;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const roleLabel = id => (App.roleInfo(id) || {}).label || '';
  const person = id => TEAM.find(p => p.id === id);
  const client = id => CLIENTS.find(c => c.id === id);
  const short = name => { const p = name.split(' '); return p[1] ? p[0][0] + '. ' + p[1] : name; };

  function field(label, control, o) {
    o = o || {};
    return '<div' + (o.attrs ? ' ' + o.attrs : '') + '>' +
      '<label class="block text-xs font-medium text-zinc-500 mb-2">' + label +
      (o.req ? ' <span class="text-red-500">*</span>' : '') +
      (o.opt ? ' <span class="font-normal">— ' + o.opt + '</span>' : '') + '</label>' +
      control +
      (o.hint != null ? '<div class="text-xs text-zinc-500 mt-1.5 empty:hidden"' + (o.hintAttr ? ' ' + o.hintAttr : '') + '>' + o.hint + '</div>' : '') +
      '</div>';
  }
  const input = (name, attrs) => '<input name="' + name + '" ' + (attrs || 'type="text"') + ' class="' + F + '">';
  const textarea = (name, attrs, value) => '<textarea name="' + name + '" rows="2" ' + (attrs || '') + ' class="' + F + ' resize-y">' + esc(value || '') + '</textarea>';
  const select = (name, opts, attrs) => '<select name="' + name + '" ' + (attrs || '') + ' class="' + F + '">' + opts + '</select>';
  const option = (value, label, o) => {
    o = o || {};
    return '<option value="' + esc(value) + '"' + (o.selected ? ' selected' : '') + (o.when ? ' data-when="' + o.when + '"' : '') + (o.disabled ? ' disabled' : '') + '>' + esc(label) + '</option>';
  };
  const grid = (cols, html) => '<div class="grid grid-cols-1 sm:grid-cols-' + cols + ' gap-4">' + html + '</div>';
  const check = (name, label, o) => {
    o = o || {};
    return '<label class="flex items-start gap-2.5 text-sm cursor-pointer"' + (o.attrs ? ' ' + o.attrs : '') + '><input type="checkbox" name="' + name + '"' + (o.checked ? ' checked' : '') + (o.value ? ' value="' + esc(o.value) + '"' : '') + ' class="mt-0.5 w-4 h-4 rounded border-zinc-300 accent-accent"><span>' + label + (o.hint ? '<span class="block text-xs text-zinc-500 mt-0.5">' + o.hint + '</span>' : '') + '</span></label>';
  };
  const note = html => '<div class="rounded-2xl bg-zinc-50 px-4 py-3 text-xs text-zinc-600 leading-relaxed">' + html + '</div>';
  const box = html => '<div class="rounded-2xl border border-zinc-200 p-4 space-y-3">' + html + '</div>';
  const clientOptions = sel => CLIENTS.map(c => option(c.id, c.name, { selected: c.id === sel })).join('');
  const teamOptions = (filter, sel, withLoad) => TEAM.filter(filter).map(p => option(p.id, p.name + ' · ' + roleLabel(p.role) + (withLoad ? ' · ' + p.load + ' ч' : ''), { selected: p.id === sel })).join('');
  const projectOptions = sel => PROJECTS.map(p => option(p.id, p.name, { selected: p.id === sel })).join('');
  const briefOptions = sel => BRIEFS.map(b => option(b.id, b.name, { selected: b.id === sel })).join('');
  const val = (m, n) => { const f = m.querySelector('[name="' + n + '"]'); return f ? f.value.trim() : ''; };
  const label = (m, n) => { const f = m.querySelector('[name="' + n + '"]'); return f && f.selectedIndex >= 0 ? f.options[f.selectedIndex].text : ''; };
  const emit = (name, detail) => document.dispatchEvent(new CustomEvent(name, { detail }));
  const MONTH_OPTIONS = (from, to, sel) => {
    let out = '';
    for (let i = from; i <= to; i++) {
      const y = 2025 + Math.floor(i / 12), m = i % 12;
      const v = y + '-' + String(m + 1).padStart(2, '0');
      out += option(v, App.MONTHS[m] + ' ' + y, { selected: v === sel });
    }
    return out;
  };

  /* ---------- KPI проекта (множественный выбор для портала и отчётов) ---------- */
  const KPI_STORE = 'seo_project_kpis_holod';
  const KPI_DEFAULT = ['traffic', 'leads'];
  const KPI_OPTS = [
    { id: 'traffic', label: 'Поисковый трафик' },
    { id: 'leads', label: 'Целевые обращения (Лиды)' },
    { id: 'top10', label: 'Видимость в поиске (% в ТОП-10)' }
  ];
  function normalizeKpis(list) {
    const allowed = KPI_OPTS.map(k => k.id);
    const seen = {};
    (Array.isArray(list) ? list : []).forEach(id => {
      if (allowed.indexOf(id) === -1 || seen[id]) return;
      seen[id] = true;
    });
    const out = allowed.filter(id => seen[id]);
    return out.length ? out : KPI_DEFAULT.slice();
  }
  function getProjectKpis() {
    let raw = null;
    try { raw = localStorage.getItem(KPI_STORE); } catch (e) { /* ignore */ }
    if (!raw) {
      try {
        const legacy = localStorage.getItem('seo_primary_kpi_holod');
        if (legacy) return normalizeKpis([legacy]);
      } catch (e) { /* ignore */ }
      return KPI_DEFAULT.slice();
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return normalizeKpis(parsed);
      if (typeof parsed === 'string') return normalizeKpis([parsed]);
    } catch (e) {
      if (typeof raw === 'string' && raw) return normalizeKpis([raw]);
    }
    return KPI_DEFAULT.slice();
  }
  function setProjectKpis(list) {
    const kpis = normalizeKpis(list);
    try { localStorage.setItem(KPI_STORE, JSON.stringify(kpis)); } catch (e) { /* ignore */ }
    return kpis;
  }
  function getPrimaryKpi() {
    return getProjectKpis()[0] || 'leads';
  }
  App.getProjectKpis = getProjectKpis;
  App.setProjectKpis = setProjectKpis;
  App.getPrimaryKpi = getPrimaryKpi;
  function syncProjectKpiChecks(m, list) {
    const active = normalizeKpis(list);
    m.querySelectorAll('[name="project_kpi"]').forEach(cb => { cb.checked = active.indexOf(cb.value) !== -1; });
  }
  function readProjectKpis(m, e, d) {
    const picked = Array.from(m.querySelectorAll('[name="project_kpi"]:checked')).map(cb => cb.value);
    if (!picked.length) {
      if (e) e.preventDefault();
      if (d) d.toast = '';
      App.toast('Отметьте хотя бы одну метрику проекта', 'error');
      return null;
    }
    return setProjectKpis(picked);
  }
  function kpiField(selected) {
    const cur = normalizeKpis(selected || getProjectKpis());
    return '<div class="mb-4">' +
      '<label class="block text-xs font-medium text-zinc-500 mb-2">Метрики проекта для клиента и отчётов</label>' +
      '<div class="space-y-2 bg-zinc-50 p-3 rounded-xl border border-zinc-200/80">' +
      KPI_OPTS.map(k =>
        '<label class="flex items-center gap-2.5 text-xs text-zinc-700 cursor-pointer">' +
          '<input type="checkbox" name="project_kpi" value="' + k.id + '"' + (cur.indexOf(k.id) !== -1 ? ' checked' : '') +
            ' class="w-4 h-4 rounded border-zinc-300 text-accent focus:ring-accent accent-accent">' +
          '<span class="font-medium">' + esc(k.label) + '</span>' +
        '</label>'
      ).join('') +
      '</div>' +
      '<p class="text-[11px] text-zinc-400 mt-1">Отмеченные показатели выводятся в портале клиента и попадают в ежемесячные отчёты.</p>' +
      '</div>';
  }

  /* ---------- Новый проект ---------- */
  App.registerModal('project-create', {
    title: 'Новый проект', subtitle: 'Клиент, тип и дорожная карта связаны: карта подбирается по типу проекта',
    size: 'lg', submit: 'Создать проект', submitCan: 'create_project',
    body: () =>
      grid(2,
        field('Название проекта', input('title', 'type="text" required placeholder="Интернет-магазин «Альфа»"'), { req: true }) +
        field('Сайт', input('site', 'type="text" required placeholder="alfa-shop.ru" inputmode="url"'), { req: true })) +
      field('Клиент', select('client', option('', 'Выберите клиента') + clientOptions() + option('__new', '+ Новый клиент...'), 'required data-dep-source="pclient"'), { req: true, hint: 'Ставка и контакты подтянутся из карточки клиента', hintAttr: 'data-client-info' }) +
      '<div data-show-when="pclient:__new" class="hidden">' + box(
        '<div class="text-xs font-medium text-zinc-900">Новый клиент</div>' +
        grid(2,
          field('Компания', input('new_client', 'type="text" required placeholder="ООО «Бета»"'), { req: true }) +
          field('ИНН', input('new_inn', 'type="text" required inputmode="numeric" data-digits="10,12" placeholder="10 или 12 цифр"'), { req: true })) +
        field('Контактное лицо', input('new_contact', 'type="text" placeholder="Имя и фамилия"'), { opt: 'можно позже' })) + '</div>' +
      grid(2,
        field('Тип проекта', select('type', option('', 'Выберите тип') + TYPES.map(t => option(t.id, t.name)).join(''), 'required data-dep-source="ptype"'), { req: true }) +
        field('Дорожная карта', select('roadmap', option('', 'Сначала выберите тип') + ROADMAPS.map(r => option(r.id, r.name, { when: r.type })).join(''), 'required data-dep="ptype"'), { req: true, hint: 'В проект будут скопированы дорожная карта и все месячные планы шаблона', hintAttr: 'data-roadmap-info' })) +
      grid(3,
        field('Старт работ', select('start', MONTH_OPTIONS(6, 11, '2025-07'))) +
        field('Чек в месяц, ₽', input('budget', 'type="number" min="0" step="1000" placeholder="120 000"'), { attrs: 'data-can="see_finance"' }) +
        field('Лимит часов', input('hours', 'type="number" min="1" value="60"'))) +
      grid(2,
        field('Менеджер проекта', select('pm', option('', 'Выберите') + teamOptions(p => p.role === 'pm' || p.role === 'mgr_head'), 'required'), { req: true }) +
        field('SEO-специалист', select('seo', option('', 'Выберите') + teamOptions(p => p.role === 'employee' || p.role === 'seo_head', null, true), 'required'), { req: true })) +
      kpiField(KPI_DEFAULT),
    init(m) {
      const info = m.querySelector('[data-roadmap-info]');
      const cInfo = m.querySelector('[data-client-info]');
      const paint = () => {
        const c = client(val(m, 'client'));
        cInfo.textContent = c ? c.contact + ' · ' + c.email + ' · ставка ' + c.rate.toLocaleString('ru-RU') + ' ₽/ч' : 'Ставка и контакты подтянутся из карточки клиента';
        const t = m.querySelector('[name="type"]');
        if (c && !t.value && TYPES.some(x => x.id === c.brief)) t.value = c.brief;
        App.syncDeps(m);
        const r = ROADMAPS.find(x => x.id === val(m, 'roadmap'));
        info.textContent = r
          ? 'В проект будут скопированы дорожная карта и все месячные планы шаблона'
          : 'Показаны шаблоны выбранного типа';
      };
      m.addEventListener('change', paint);
      m.addEventListener('modal:open', e => setTimeout(() => {
        const op = e.detail && e.detail.opener;
        const pref = op && (op.dataset.prefillClient || op.getAttribute('data-prefill-client'));
        if (pref) {
          const sel = m.querySelector('[name="client"]');
          if (sel) sel.value = pref;
        }
        paint();
        syncProjectKpiChecks(m, KPI_DEFAULT);
      }));
    },
    onSubmit(m, d, e) {
      const kpis = readProjectKpis(m, e, d);
      if (!kpis) return;
      const c = val(m, 'client') === '__new' ? val(m, 'new_client') : label(m, 'client');
      const rm = ROADMAPS.find(x => x.id === val(m, 'roadmap'));
      d.toast = 'Проект «' + val(m, 'title') + '» создан · ' + c + ' · дорожная карта и все месячные планы скопированы';
      emit('project:created', {
        title: val(m, 'title'),
        site: val(m, 'site'),
        client: c,
        type: label(m, 'type'),
        roadmap: label(m, 'roadmap'),
        roadmapId: val(m, 'roadmap'),
        copyRoadmap: true,
        copyMonthPlans: true,
        templateInfo: rm ? rm.info : '',
        project_kpis: kpis,
        primary_kpi: kpis[0]
      });
    }
  });

  /* ---------- Проект: редактировать ---------- */
  App.registerModal('project-edit', {
    title: 'Настройки проекта', subtitle: 'Интернет-магазин «Холод» · holod-shop.ru',
    size: 'lg', submit: 'Сохранить', submitCan: 'edit_project', reset: false,
    body: () =>
      grid(2,
        field('Название проекта', input('title', 'type="text" required value="Интернет-магазин «Холод»"'), { req: true }) +
        field('Сайт', input('site', 'type="text" required value="holod-shop.ru" inputmode="url"'), { req: true })) +
      field('Клиент', select('client', clientOptions('holod') + option('__new', '+ Новый клиент...'), 'required data-dep-source="pclient"'), { req: true, hint: 'Ставка и контакты подтянутся из карточки клиента', hintAttr: 'data-client-info' }) +
      '<div data-show-when="pclient:__new" class="hidden">' + box(
        '<div class="text-xs font-medium text-zinc-900">Новый клиент</div>' +
        grid(2,
          field('Компания', input('new_client', 'type="text" required placeholder="ООО «Бета»"'), { req: true }) +
          field('ИНН', input('new_inn', 'type="text" required inputmode="numeric" data-digits="10,12" placeholder="10 или 12 цифр"'), { req: true })) +
        field('Контактное лицо', input('new_contact', 'type="text" placeholder="Имя и фамилия"'), { opt: 'можно позже' })) + '</div>' +
      grid(2,
        field('Тип проекта', select('type', TYPES.map(t => option(t.id, t.name, { selected: t.id === 'ecommerce' })).join(''), 'required data-dep-source="ptype"'), { req: true }) +
        field('Дорожная карта', select('roadmap', ROADMAPS.map(r => option(r.id, r.name, { when: r.type, selected: r.id === 'rm-ecom' })).join(''), 'required data-dep="ptype"'), { req: true, hint: 'Смена карты не удаляет уже созданные задачи', hintAttr: 'data-roadmap-info' })) +
      grid(3,
        field('Старт работ', select('start', MONTH_OPTIONS(4, 11, '2025-05'))) +
        field('Чек в месяц, ₽', input('budget', 'type="number" min="0" step="1000" value="240000"'), { attrs: 'data-can="see_finance"' }) +
        field('Лимит часов', input('hours', 'type="number" min="1" value="96"'))) +
      grid(2,
        field('Менеджер проекта', select('pm', option('', 'Выберите') + teamOptions(p => p.role === 'pm' || p.role === 'mgr_head', 'morozov'), 'required'), { req: true }) +
        field('SEO-специалист', select('seo', option('', 'Выберите') + teamOptions(p => p.role === 'employee' || p.role === 'seo_head', 'petrov', true), 'required'), { req: true })) +
      kpiField(),
    init(m) {
      const info = m.querySelector('[data-roadmap-info]');
      const cInfo = m.querySelector('[data-client-info]');
      const paint = () => {
        const c = client(val(m, 'client'));
        cInfo.textContent = c ? c.contact + ' · ' + c.email + ' · ставка ' + c.rate.toLocaleString('ru-RU') + ' ₽/ч' : 'Ставка и контакты подтянутся из карточки клиента';
        App.syncDeps(m);
        const r = ROADMAPS.find(x => x.id === val(m, 'roadmap'));
        info.textContent = r ? r.info + ' · смена карты не удаляет уже созданные задачи' : 'Смена карты не удаляет уже созданные задачи';
      };
      m.addEventListener('change', paint);
      m.addEventListener('modal:open', () => setTimeout(() => {
        paint();
        syncProjectKpiChecks(m, getProjectKpis());
      }));
    },
    onSubmit(m, d, e) {
      const kpis = readProjectKpis(m, e, d);
      if (!kpis) return;
      d.toast = 'Настройки проекта сохранены';
      emit('project:updated', { title: val(m, 'title'), site: val(m, 'site'), client: label(m, 'client'), type: label(m, 'type'), roadmap: label(m, 'roadmap'), project_kpis: kpis, primary_kpi: kpis[0] });
    }
  });

  /* ---------- Клиент: создать / редактировать ---------- */
  const CITIES = ['Москва', 'Санкт-Петербург', 'Екатеринбург', 'Новосибирск', 'Казань', 'Краснодар', 'Нижний Новгород'];
  const LOGO_KEY = id => 'seo_client_logo_' + (id || 'new');
  function monoFromName(name) {
    const skip = /^(ооо|оао|ао|зао|пао|ип|llc|ltd|inc)$/i;
    const parts = String(name || '').replace(/[«»"']/g, '').split(/\s+/).filter(p => p && !skip.test(p));
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return (parts[0] || 'КЛ').slice(0, 2).toUpperCase();
  }
  function logoPreviewHtml(c) {
    c = c || {};
    let src = '';
    try { src = localStorage.getItem(LOGO_KEY(c.id || 'holod')) || ''; } catch (e) { /* ignore */ }
    if (src) return '<img src="' + esc(src) + '" alt="" class="w-full h-full object-contain p-1.5">';
    return '<span>' + esc(monoFromName(c.name || 'Холод Групп')) + '</span>';
  }
  function clientLogoField(c) {
    return '<div class="mb-4">' +
      '<label class="block text-xs font-medium text-zinc-500 mb-2">Логотип клиента <span class="text-zinc-400 font-normal">— опционально</span></label>' +
      '<div class="flex items-center gap-4">' +
        '<div data-client-logo-preview class="w-14 h-14 rounded-2xl bg-zinc-900 text-white font-semibold flex items-center justify-center shrink-0 text-base shadow-sm overflow-hidden">' +
          logoPreviewHtml(c) +
        '</div>' +
        '<div class="flex-1 min-w-0">' +
          '<input name="logo" type="file" accept="image/png,image/jpeg,image/svg+xml" class="block w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 cursor-pointer">' +
          '<p class="text-[11px] text-zinc-400 mt-1">PNG, SVG или JPG до 2 МБ. Отображается в шапке отчётов.</p>' +
        '</div>' +
      '</div></div>';
  }
  function bindClientLogo(m, clientId) {
    const input = m.querySelector('input[name="logo"]');
    const preview = m.querySelector('[data-client-logo-preview]');
    if (!input || !preview || input.dataset.bound) return;
    input.dataset.bound = '1';
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (!file) return;
      if (file.size > 2 * 1024 * 1024) {
        App.toast('Файл больше 2 МБ — выберите изображение поменьше', 'error');
        input.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const data = String(reader.result || '');
        preview.innerHTML = '<img src="' + data + '" alt="" class="w-full h-full object-contain p-1.5">';
        m.dataset.logoData = data;
        try { localStorage.setItem(LOGO_KEY(clientId || 'holod'), data); } catch (e) { /* ignore */ }
      };
      reader.readAsDataURL(file);
    });
  }
  function clientBody(c) {
    c = c || {};
    const v = x => x ? ' value="' + esc(x) + '"' : '';
    return clientLogoField(c) +
      grid(2,
        field('Название компании', input('name', 'type="text" required placeholder="ООО «Альфа»"' + v(c.name)), { req: true }) +
        field('ИНН', input('inn', 'type="text" required inputmode="numeric" data-digits="10,12" placeholder="10 или 12 цифр"' + v(c.inn)), { req: true, hint: '10 цифр — юрлицо, 12 — ИП' })) +
      grid(2,
        field('Город', input('city', 'type="text" required list="city-list" placeholder="Москва"' + v(c.city)) + '<datalist id="city-list">' + CITIES.map(x => '<option value="' + x + '">').join('') + '</datalist>', { req: true }) +
        field('Часовая ставка, ₽/ч', input('rate', 'type="number" required min="500" step="100" placeholder="2 500"' + v(c.rate)), { req: true, attrs: 'data-can="see_finance"', hint: 'Используется для расчёта чека и маржи' })) +
      '<div class="pt-1 text-xs font-medium text-zinc-900">Контактное лицо</div>' +
      grid(2,
        field('Имя и фамилия', input('contact', 'type="text" required placeholder="Сергей Волков"' + v(c.contact)), { req: true }) +
        field('Должность', input('post', 'type="text" placeholder="Директор по маркетингу"' + v(c.post)), { opt: 'опционально' })) +
      grid(2,
        field('Email', input('email', 'type="email" required placeholder="name@company.ru"' + v(c.email)), { req: true }) +
        field('Телефон', input('phone', 'type="tel" placeholder="+7 900 000-00-00"' + v(c.phone)), { opt: 'опционально' })) +
      field('Шаблон брифа', select('brief', briefOptions(c.brief || 'base')), { hint: 'Этот бриф клиент получит по ссылке или в портале' });
  }
  App.registerModal('client-create', {
    title: 'Новый клиент', subtitle: 'Реквизиты, контакт и бриф для старта', size: 'lg', submit: 'Создать клиента', submitCan: 'create_client',
    body: () => clientBody() + check('send_brief', 'Отправить бриф контакту сразу после создания', { checked: true }),
    init(m) {
      m.addEventListener('modal:open', () => setTimeout(() => bindClientLogo(m, 'new')));
    },
    onSubmit(m, d) {
      const c = { id: 'c' + Date.now(), name: val(m, 'name'), inn: val(m, 'inn'), city: val(m, 'city'), rate: +val(m, 'rate') || 0, contact: val(m, 'contact'), phone: val(m, 'phone'), email: val(m, 'email'), brief: val(m, 'brief') };
      if (m.dataset.logoData) {
        try { localStorage.setItem(LOGO_KEY(c.id), m.dataset.logoData); } catch (e) { /* ignore */ }
      }
      CLIENTS.push(c);
      document.querySelectorAll('select[name="client"]').forEach(s => {
        const o = document.createElement('option');
        o.value = c.id; o.textContent = c.name;
        const last = s.querySelector('option[value="__new"]');
        s.insertBefore(o, last || null);
      });
      d.toast = 'Клиент ' + c.name + ' создан';
      emit('client:created', c);
      if (m.querySelector('[name="send_brief"]').checked) {
        d.toast = '';
        setTimeout(() => {
          const b = App.openModal('brief-send');
          if (!b) return;
          b.querySelector('[name="client"]').value = c.id;
          b.querySelector('[name="brief"]').value = c.brief;
          b.dispatchEvent(new Event('change'));
          App.toast('Клиент создан — отправьте ему бриф');
        }, 50);
      }
    }
  });
  App.registerModal('client-edit', {
    title: 'Редактировать клиента', subtitle: 'ООО «Холод Групп»', size: 'lg', submit: 'Сохранить', submitCan: 'create_client', reset: false,
    body: () => clientBody(CLIENTS[0]),
    init(m) {
      m.addEventListener('modal:open', () => setTimeout(() => bindClientLogo(m, 'holod')));
    },
    onSubmit(m, d) {
      d.toast = 'Карточка клиента сохранена';
      emit('client:updated', { name: val(m, 'name'), inn: val(m, 'inn'), city: val(m, 'city'), rate: val(m, 'rate'), contact: val(m, 'contact'), email: val(m, 'email'), phone: val(m, 'phone'), post: val(m, 'post'), logo: m.dataset.logoData || '' });
    }
  });

  /* ---------- Отправить бриф (публичная ссылка на опросник) ---------- */
  App.registerModal('brief-send', {
    title: 'Отправить бриф', subtitle: 'Защищённая публичная ссылка на форму — без учётной записи', submit: 'Готово', submitCan: 'create_client',
    body: () =>
      grid(2,
        field('Клиент', select('client', clientOptions('holod'), 'required'), { req: true }) +
        field('Шаблон брифа', select('brief', briefOptions('ecommerce')))) +
      field('Ссылка на бриф', '<div class="flex gap-2"><input name="link" type="text" readonly class="' + F + ' bg-zinc-50 text-zinc-600 font-mono text-xs"><button type="button" data-copy data-copy-from="[name=link]" data-copy-toast="Ссылка на бриф скопирована" class="shrink-0 px-4 py-2 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition">Скопировать ссылку</button></div>', { hint: 'Клиент заполнит бриф без регистрации. Ответы появятся в карточке клиента.' }) +
      grid(2,
        field('Ссылка действует', select('ttl', option('7', '7 дней') + option('14', '14 дней', { selected: true }) + option('30', '30 дней') + option('0', 'Без срока'))) +
        '<div class="flex items-end"><a data-brief-preview href="brief-form.html" target="_blank" rel="noopener" class="w-full text-center px-4 py-2 rounded-full bg-white border border-zinc-200 text-sm font-medium hover:bg-zinc-50 transition">Открыть форму брифа ↗</a></div>'),
    init(m) {
      const paint = () => {
        const c = client(val(m, 'client')) || CLIENTS[0];
        const url = new URL('brief-form.html', location.href);
        url.searchParams.set('client', c.id);
        url.searchParams.set('brief', val(m, 'brief'));
        url.searchParams.set('t', (c.inn || '').slice(-4) + 'k9');
        const ttl = val(m, 'ttl');
        if (ttl && ttl !== '0') url.searchParams.set('ttl', ttl);
        m.querySelector('[name="link"]').value = url.href;
        m.querySelector('[data-brief-preview]').href = url.href;
      };
      m.querySelector('[name="client"]').addEventListener('change', () => {
        const c = client(val(m, 'client'));
        if (c && c.brief) m.querySelector('[name="brief"]').value = c.brief;
      });
      m.addEventListener('change', paint);
      m.addEventListener('modal:open', () => {
        const c = client(val(m, 'client'));
        if (c && c.brief) m.querySelector('[name="brief"]').value = c.brief;
        paint();
      });
    },
    onSubmit(m, d) {
      d.toast = 'Ссылка на бриф сохранена в карточке клиента';
      emit('brief:sent', { client: label(m, 'client'), mode: 'link' });
    }
  });

  /* ---------- Пригласить клиента в портал ---------- */
  App.registerModal('client-invite', {
    title: 'Пригласить клиента в портал',
    subtitle: 'Клиент получит ссылку для входа и доступ к просмотру результатов, дорожной карты и согласования задач',
    submit: 'Отправить приглашение',
    submitCan: 'invite_clients',
    body: () =>
      field('Клиент', select('client', clientOptions('holod'), 'required'), { req: true }) +
      grid(2,
        field('Email контакта', input('email', 'type="email" required placeholder="name@company.ru"'), { req: true }) +
        field('Имя контакта', input('contact', 'type="text" placeholder="Сергей Волков"'))) +
      field('Проекты', box(
        check('all_projects', 'Все проекты клиента', { checked: false, attrs: 'data-all-client-projects' }) +
        '<div class="border-t border-zinc-100 pt-3 space-y-2" data-client-project-checks>' +
          PROJECTS.filter(p => p.client === 'holod').map((p, i) => check('projects', p.name, { value: p.id, checked: i === 0 })).join('') +
        '</div>'
      ), { hint: 'Клиент увидит только выбранные проекты — в режиме просмотра' }) +
      note('Роль «Клиент»: результаты, дорожная карта, принятые отчёты и задачи на согласовании. Внутренние часы и ставки скрыты.'),
    init(m) {
      const all = m.querySelector('[data-all-client-projects] input');
      const items = () => m.querySelectorAll('[data-client-project-checks] input');
      const paintProjects = () => {
        const c = client(val(m, 'client'));
        const boxEl = m.querySelector('[data-client-project-checks]');
        if (!c || !boxEl) return;
        const ids = PROJECTS.filter(p => p.client === c.id).map(p => p.id);
        const keep = ids.length ? ids : PROJECTS.map(p => p.id);
        boxEl.innerHTML = PROJECTS.filter(p => keep.indexOf(p.id) !== -1)
          .map((p, i) => check('projects', p.name, { value: p.id, checked: i === 0 || keep.length === 1 })).join('');
        syncAll();
      };
      const syncAll = () => {
        items().forEach(i => {
          i.disabled = all.checked;
          i.closest('label').classList.toggle('opacity-50', all.checked);
          if (all.checked) i.checked = true;
        });
      };
      const paintContact = () => {
        const c = client(val(m, 'client')) || CLIENTS[0];
        const email = m.querySelector('[name="email"]');
        const name = m.querySelector('[name="contact"]');
        if (email && (!email.value || email.dataset.auto === '1')) { email.value = c.email || ''; email.dataset.auto = '1'; }
        if (name && (!name.value || name.dataset.auto === '1')) { name.value = c.contact || ''; name.dataset.auto = '1'; }
      };
      m.querySelector('[name="client"]').addEventListener('change', () => {
        m.querySelectorAll('[data-auto]').forEach(f => { f.value = ''; });
        paintProjects();
        paintContact();
      });
      all.addEventListener('change', syncAll);
      m.querySelectorAll('[name="email"], [name="contact"]').forEach(f => f.addEventListener('input', () => { f.dataset.auto = '0'; }));
      m.addEventListener('modal:open', () => {
        m.querySelectorAll('[data-auto]').forEach(f => { f.value = ''; });
        all.checked = false;
        paintProjects();
        paintContact();
      });
    },
    onSubmit(m, d) {
      const email = val(m, 'email');
      const picked = Array.from(m.querySelectorAll('[name="projects"]:checked')).map(i => i.value);
      d.toast = 'Приглашение отправлено на ' + email + (picked.length ? ' · ' + picked.length + ' проект' + (picked.length === 1 ? '' : (picked.length < 5 ? 'а' : 'ов')) : '');
      emit('client:invited', { client: label(m, 'client'), email, contact: val(m, 'contact'), projects: picked });
    }
  });

  /* ---------- Пригласить сотрудника ---------- */
  App.registerModal('invite', {
    title: 'Пригласить пользователя', subtitle: 'Роль определяет, что человек увидит в SEO Control', submit: 'Отправить приглашение',
    body: () =>
      field('Роль', select('role', App.ROLES.map(r => {
        if (r.id === 'owner') return option(r.id, r.label + ' — один на компанию', { disabled: true });
        const perm = INVITE_PERM[r.id];
        const ok = !perm || App.can(perm);
        return option(r.id, r.label + (ok ? '' : ' — нет права'), { disabled: !ok, selected: r.id === 'employee' });
      }).join(''), 'required data-dep-source="irole"'), { req: true, hint: '', hintAttr: 'data-role-desc' }) +
      grid(2,
        field('Email', input('email', 'type="email" required placeholder="name@romashka.ru"'), { req: true }) +
        field('Имя и фамилия', input('name', 'type="text" placeholder="Анна Белова"'), { opt: 'опционально' })) +
      '<div data-show-when="irole:seo_head|mgr_head|pm|employee">' + grid(2,
        field('Отдел', select('dept', option('SEO', 'SEO') + option('Менеджеры', 'Менеджеры') + option('Контент', 'Контент'))) +
        field('Норма часов в неделю', input('week', 'type="number" min="1" max="60" value="40"'))) + '</div>' +
      '<div data-show-when="irole:contractor" class="hidden">' + grid(2,
        field('Доступ до', input('until', 'type="date"'), { opt: 'опционально', hint: 'После даты доступ закроется сам' }) +
        field('Ставка подрядчика, ₽/ч', input('rate', 'type="number" min="0" step="100" placeholder="1 200"'), { attrs: 'data-can="see_finance"' })) + '</div>' +
      '<div data-show-when="irole:client" class="hidden">' +
        field('Проект клиента', select('client_project', projectOptions('holod'), 'required'), { req: true, hint: 'Клиент увидит только этот проект — в режиме просмотра' }) + '</div>' +
      '<div data-show-when="irole:seo_head|mgr_head|pm|employee|contractor">' +
        field('Проекты', box(
          check('all_projects', 'Все проекты компании', { checked: true, attrs: 'data-all-projects' }) +
          '<div class="border-t border-zinc-100 pt-3 space-y-2" data-project-checks>' + PROJECTS.map(p => check('projects', p.name, { value: p.id })).join('') + '</div>')) + '</div>' +
      field('Сообщение', textarea('message', 'placeholder="Добавьте пару слов к приглашению"'), { opt: 'опционально' }),
    init(m) {
      const desc = m.querySelector('[data-role-desc]');
      const all = m.querySelector('[data-all-projects] input');
      const items = m.querySelectorAll('[data-project-checks] input');
      const paint = () => {
        const r = App.roleInfo(val(m, 'role'));
        desc.textContent = r ? r.desc : '';
        if (val(m, 'role') === 'contractor' && all.checked && !all.dataset.touched) all.checked = false;
        items.forEach(i => { i.disabled = all.checked; i.closest('label').classList.toggle('opacity-50', all.checked); });
      };
      all.addEventListener('change', () => { all.dataset.touched = '1'; });
      m.addEventListener('change', paint);
      m.addEventListener('modal:open', () => { delete all.dataset.touched; setTimeout(paint); });
      paint();
    },
    onSubmit(m, d) {
      d.toast = 'Приглашение отправлено: ' + val(m, 'email') + ' · ' + roleLabel(val(m, 'role'));
      emit('user:invited', { email: val(m, 'email'), name: val(m, 'name'), role: val(m, 'role') });
    }
  });

  /* ---------- Сотрудник: роль, отдел, норма ---------- */
  const ROLE_BADGE = {
    owner:      ['Владелец компании', 'bg-zinc-900 text-white'],
    seo_head:   ['Руководитель SEO', 'bg-blue-50 text-blue-700'],
    mgr_head:   ['Руководитель менеджеров', 'bg-violet-50 text-violet-700'],
    pm:         ['Менеджер проекта', 'bg-amber-50 text-amber-700'],
    employee:   ['SEO-специалист', 'bg-emerald-50 text-emerald-700'],
    contractor: ['Подрядчик', 'bg-zinc-100 text-zinc-700'],
    client:     ['Клиент', 'bg-cyan-50 text-cyan-700']
  };
  const ROLE_SHORT = {
    owner: 'Owner', seo_head: 'SEO Head', mgr_head: 'Account Head', pm: 'PM',
    employee: 'Специалист', contractor: 'Подрядчик', client: 'Клиент'
  };
  const EXTRA_USERS = {
    krylova: { id: 'krylova', name: 'Елена Крылова', role: 'client', dept: '—', load: '0/40', projects: ['medlife'] }
  };
  const findMember = id => person(id) || EXTRA_USERS[id] || null;
  const roleOptions = () =>
    option('owner', 'Владелец компании (один на компанию)', { disabled: true }) +
    option('seo_head', 'Руководитель SEO') +
    option('mgr_head', 'Руководитель менеджеров') +
    option('pm', 'Менеджер проекта (PM)') +
    option('employee', 'SEO-специалист') +
    option('contractor', 'Подрядчик') +
    option('client', 'Клиент');

  App.registerModal('employee', {
    title: 'Карточка участника компании', subtitle: 'Роль, отдел и норма часов', submit: 'Сохранить',
    body: () =>
      '<div class="flex items-center gap-3"><span data-emp-avatar class="w-11 h-11 rounded-full bg-zinc-900 text-white text-xs font-semibold flex items-center justify-center shrink-0"></span><div class="min-w-0"><div data-emp-name class="text-sm font-semibold"></div><div data-emp-mail class="text-xs text-zinc-500"></div><div data-emp-phone class="text-xs text-zinc-500"></div></div></div>' +
      '<div class="rounded-2xl bg-canvas p-4">' +
        '<div class="flex items-center justify-between gap-3 text-xs"><span class="text-zinc-500">Загрузка · июнь</span><span data-emp-hours class="font-medium tabular-nums"></span></div>' +
        '<div class="mt-2 h-1.5 rounded-full bg-white overflow-hidden" role="progressbar" aria-label="Загрузка за месяц"><div data-emp-bar class="h-full rounded-full"></div></div>' +
        '<div data-can="see_finance" class="mt-2 text-xs text-zinc-500">Ставка <span data-emp-rate class="font-medium text-zinc-900 tabular-nums"></span></div>' +
        '<div class="mt-3 text-xs font-medium text-zinc-500">Задачи месяца</div>' +
        '<ul data-emp-tasks class="mt-1.5 space-y-1.5"></ul>' +
      '</div>' +
      '<div class="mb-0">' +
        '<label class="block text-xs font-medium text-zinc-500 mb-2">Роль в компании</label>' +
        '<select name="user_role" data-can="change_roles" data-deny-tip="Только владелец компании может менять роли сотрудников" class="' + F + '"></select>' +
        '<p data-role-hint class="text-[11px] text-zinc-400 mt-1">Роль определяет доступ к разделам, финансам и клиентским отчётам.</p>' +
      '</div>' +
      grid(3,
        field('Отдел', select('dept', option('SEO', 'SEO') + option('Менеджеры', 'Менеджеры') + option('Аккаунтинг', 'Аккаунтинг') + option('Контент', 'Контент') + option('—', 'Без отдела'))) +
        field('Часов в неделю', input('week', 'type="number" min="1" max="60" required'), { req: true }) +
        field('Ставка, ₽/ч', input('rate', 'type="number" min="0" step="100"'), { attrs: 'data-can="see_finance"' })) +
      field('Проекты', '<div data-emp-projects class="flex flex-wrap gap-1.5"></div>'),
    onOpen(m, opener) {
      const MONTH = {
        sidorov: { spent: 116, cap: 160, phone: '+7 495 120-11-01', mail: 'ivan@seo.ru', tasks: [['Аудит семантики «Холод»', 40], ['План на июль «Ремонт+»', 36], ['Технический контроль «Стройтех»', 40]] },
        vetrova: { spent: 104, cap: 160, phone: '+7 495 120-11-02', mail: 'olga@seo.ru', tasks: [['Контент-план «МедЛайф»', 48], ['Правки мета «Холод»', 32], ['Бриф нового клиента', 24]] },
        morozov: { spent: 62, cap: 80, phone: '+7 495 120-11-03', mail: 'n.morozov@seo.ru', tasks: [['Согласование отчёта «Холод»', 28], ['Встреча с «Ремонт+»', 22], ['Передача на отпуск', 12]] },
        petrov: { spent: 176, cap: 160, phone: '+7 495 120-11-04', mail: 'alex@dev.ru', tasks: [['Индексация GSC «Холод»', 64], ['Ссылки «Ремонт+»', 58], ['Скорость «Стройтех»', 54]] },
        dronov: { spent: 108, cap: 160, phone: '+7 495 120-11-05', mail: 'ivan.d@seo.ru', tasks: [['Кластеризация «МедЛайф»', 42], ['Сниппеты «Холод»', 36], ['Мониторинг позиций', 30]] },
        kim: { spent: 56, cap: 80, phone: '+7 495 120-11-06', mail: 'maria@copy.ru', tasks: [['Тексты категорий «Холод»', 24], ['Описания услуг «Ремонт+»', 18], ['Правки по замечаниям', 14]] },
        krylova: { spent: 0, cap: 40, phone: '+7 383 200-10-20', mail: 'e.krylova@medlife.ru', tasks: [] },
        smirnov: { spent: 48, cap: 160, phone: '+7 495 120-11-00', mail: 'a.smirnov@romashka.ru', tasks: [['Стратегия агентства', 24], ['Тариф и биллинг', 12], ['Найм и роли', 12]] }
      };
      const id = opener && (opener.dataset.employee || opener.dataset.userId);
      const p = findMember(id) || TEAM[1];
      const load = MONTH[p.id] || { spent: 0, cap: 160, phone: '', mail: p.id + '@romashka.ru', tasks: [] };
      const rate = p.role === 'contractor' ? 1200 : (p.role === 'client' ? 0 : 1800);
      m.querySelector('[data-emp-name]').textContent = p.name;
      m.querySelector('[data-emp-mail]').textContent = load.mail;
      m.querySelector('[data-emp-phone]').textContent = load.phone;
      m.querySelector('[data-emp-hours]').textContent = load.spent + ' / ' + load.cap + ' ч';
      const bar = m.querySelector('[data-emp-bar]');
      bar.style.width = Math.min(100, Math.round((load.spent / (load.cap || 1)) * 100)) + '%';
      bar.className = 'h-full rounded-full ' + (load.spent > load.cap ? 'bg-red-500' : 'bg-emerald-500');
      const rateEl = m.querySelector('[data-emp-rate]');
      if (rateEl) rateEl.textContent = rate ? rate.toLocaleString('ru-RU') + ' ₽/ч' : '—';
      m.querySelector('[data-emp-tasks]').innerHTML = load.tasks.length
        ? load.tasks.map(t => '<li class="flex items-center justify-between gap-3 text-sm"><span class="min-w-0 truncate">' + esc(t[0]) + '</span><span class="text-xs text-zinc-500 tabular-nums shrink-0">' + t[1] + ' ч</span></li>').join('')
        : '<li class="text-xs text-zinc-500">Нет активных задач</li>';
      m.querySelector('[data-emp-avatar]').textContent = p.name.split(' ').map(s => s[0]).join('');
      m.querySelector('[data-modal-title]').textContent = p.name;
      m.querySelector('[data-modal-subtitle]').textContent = 'Карточка участника компании';

      const roleSel = m.querySelector('[name="user_role"]');
      roleSel.innerHTML = roleOptions();
      roleSel.value = p.role;
      const hint = m.querySelector('[data-role-hint]');
      const isOwnerSeat = p.role === 'owner';
      const canChange = !!(App.can && App.can('change_roles'));
      if (isOwnerSeat) {
        roleSel.removeAttribute('data-can');
        roleSel.setAttribute('data-tip', 'Владелец компании один');
        roleSel.setAttribute('title', 'Владелец компании один');
        roleSel.disabled = true;
        if (hint) hint.textContent = 'Владелец компании один — роль изменить нельзя.';
      } else {
        roleSel.setAttribute('data-can', 'change_roles');
        roleSel.setAttribute('data-deny-tip', 'Только владелец компании может менять роли сотрудников');
        roleSel.removeAttribute('data-tip');
        if (hint) hint.textContent = 'Роль определяет доступ к разделам, финансам и клиентским отчётам.';
      }
      if (App.applyPermissions) App.applyPermissions();
      if (isOwnerSeat) {
        roleSel.disabled = true;
      } else {
        roleSel.disabled = !canChange;
        if (!canChange) {
          roleSel.setAttribute('title', 'Только владелец компании может менять роли сотрудников');
          roleSel.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
          roleSel.removeAttribute('title');
          roleSel.classList.remove('opacity-50', 'cursor-not-allowed');
          delete roleSel.dataset.rbacOff;
        }
      }

      m.querySelector('[name="dept"]').value = p.dept === 'Менеджеры' ? 'Аккаунтинг' : p.dept;
      const week = (p.load || '40/40').split('/')[1] || '40';
      m.querySelector('[name="week"]').value = week;
      m.querySelector('[name="rate"]').value = rate || '';
      m.querySelector('[data-emp-projects]').innerHTML = (p.projects || []).length
        ? p.projects.map(pid => '<span class="px-2.5 py-1 rounded-full bg-zinc-100 text-xs text-zinc-700">' + esc((PROJECTS.find(x => x.id === pid) || {}).name || pid) + '</span>').join('')
        : '<span class="text-xs text-zinc-500">Нет назначенных проектов</span>';
      m.dataset.employee = p.id;
      m.dataset.wasRole = p.role;
    },
    onSubmit(m, d) {
      const p = findMember(m.dataset.employee);
      if (!p) { d.toast = 'Участник не найден'; return; }
      const nextRole = val(m, 'user_role') || p.role;
      const nextDept = val(m, 'dept') || p.dept;
      const nextWeek = val(m, 'week') || '40';
      if (p.role !== 'owner' && nextRole && nextRole !== 'owner') {
        p.role = nextRole;
      }
      p.dept = nextDept;
      if (p.load) p.load = (p.load.split('/')[0] || '0') + '/' + nextWeek;
      const badge = ROLE_BADGE[p.role] || ROLE_BADGE.employee;
      const short = ROLE_SHORT[p.role] || badge[0];
      emit('employee:saved', {
        id: p.id,
        name: p.name,
        role: p.role,
        roleLabel: badge[0],
        roleShort: short,
        roleTone: badge[1],
        dept: p.dept
      });
      d.toast = p.role !== m.dataset.wasRole
        ? 'Роль пользователя ' + p.name + ' изменена на «' + badge[0] + '»'
        : 'Сохранено: ' + p.name;
    }
  });

  /* ---------- Отпуск ---------- */
  App.registerModal('vacation', {
    title: 'Оформить отпуск', subtitle: 'Проекты и приёмка на время отпуска переходят заместителю', submit: 'Оформить отпуск',
    body: () =>
      field('Сотрудник', select('employee', teamOptions(p => p.role !== 'owner', 'petrov'), 'required'), { req: true }) +
      grid(2,
        field('С', input('from', 'type="date" required value="2025-07-14"'), { req: true }) +
        field('По', input('to', 'type="date" required value="2025-07-28" data-after="from"'), { req: true, hint: '', hintAttr: 'data-vac-days' })) +
      field('Кому передать проекты', select('substitute', option('', 'Выберите заместителя') + teamOptions(p => p.role !== 'client' && p.role !== 'contractor', 'morozov', true), 'required'), { req: true, hint: 'Заместитель получит задачи в работе и приёмку' }) +
      field('Проекты на время отпуска', '<div data-vac-projects class="rounded-2xl border border-zinc-200 p-3 space-y-2"></div>') +
      check('return', 'Вернуть проекты после отпуска автоматически', { checked: true }),
    init(m) {
      const paint = () => {
        const emp = val(m, 'employee');
        const sub = m.querySelector('[name="substitute"]');
        Array.from(sub.options).forEach(o => { o.disabled = o.value === emp; o.hidden = o.value === emp; });
        if (sub.value === emp) sub.value = '';
        const p = person(emp);
        const list = m.querySelector('[data-vac-projects]');
        if (list.dataset.for !== emp) {
          list.dataset.for = emp;
          list.innerHTML = p && p.projects.length
            ? p.projects.map(id => check('vac_projects', esc((PROJECTS.find(x => x.id === id) || {}).name), { checked: true, value: id })).join('')
            : '<div class="text-xs text-zinc-500">У сотрудника нет проектов — передавать нечего</div>';
        }
        const a = val(m, 'from'), b = val(m, 'to');
        const days = a && b ? Math.round((new Date(b) - new Date(a)) / 864e5) + 1 : 0;
        m.querySelector('[data-vac-days]').textContent = days > 0 ? days + ' ' + App.plural(days, ['день', 'дня', 'дней']) : (a && b ? 'Дата окончания раньше начала' : '');
      };
      m.addEventListener('change', paint);
      m.addEventListener('modal:open', () => {
        const emp = m.querySelector('[name="employee"]');
        const mine = ME[App.role];
        const self = App.role === 'employee' || App.role === 'contractor';
        if (self && mine) emp.value = mine;
        emp.disabled = self;
        emp.classList.toggle('bg-zinc-50', self);
        delete m.querySelector('[data-vac-projects]').dataset.for;
        setTimeout(paint);
      });
    },
    onSubmit(m, d) {
      const emp = person(val(m, 'employee')), sub = person(val(m, 'substitute'));
      const f = s => s.split('-').reverse().slice(0, 2).join('.');
      d.toast = 'Отпуск оформлен: ' + short(emp.name) + ', ' + f(val(m, 'from')) + '–' + f(val(m, 'to')) + ' · замещает ' + short(sub.name);
      emit('vacation:saved', { employee: emp, substitute: sub, from: f(val(m, 'from')), to: f(val(m, 'to')), projects: Array.from(m.querySelectorAll('[name="vac_projects"]:checked')).map(i => i.value) });
    }
  });

  /* ---------- Передать проект ---------- */
  App.registerModal('transfer', {
    title: 'Передать проект', subtitle: 'Интернет-магазин «Холод» · сейчас ведёт Алексей Петров', submit: 'Передать проект', submitCan: 'transfer_project',
    body: () =>
      field('Новый ответственный', select('assignee', option('', 'Выберите сотрудника') + teamOptions(p => ['seo_head', 'employee', 'pm', 'mgr_head'].indexOf(p.role) !== -1 && p.id !== 'petrov', null, true), 'required'), { req: true, hint: 'Рядом — загрузка на текущей неделе', hintAttr: 'data-assignee-info' }) +
      grid(2,
        field('Передать с', input('from', 'type="date" required value="2025-06-16"'), { req: true }) +
        field('Роль в проекте', select('as', option('lead', 'Ответственный SEO') + option('pm', 'Менеджер проекта')))) +
      field('Что передать', box(
        check('what', 'Открытые задачи', { checked: true, value: 'tasks', hint: '6 задач в работе и 2 на приёмке' }) +
        check('what', 'Подготовку отчёта за июнь', { checked: true, value: 'report' }) +
        check('what', 'Доступы к счётчикам и Вебмастеру', { checked: true, value: 'access' }))) +
      field('Комментарий для нового ответственного', textarea('comment', 'placeholder="Что важно знать по проекту"'), { opt: 'опционально' }) +
      check('notify', 'Уведомить клиента о смене специалиста', { hint: 'Письмо уйдёт контакту ООО «Холод Групп»' }),
    init(m) {
      m.addEventListener('change', () => {
        const p = person(val(m, 'assignee'));
        const n = p ? +p.load.split('/')[0] : 0, cap = p ? +p.load.split('/')[1] : 0;
        m.querySelector('[data-assignee-info]').textContent = p ? 'Загрузка ' + p.load + ' ч' + (n >= cap ? ' — сотрудник уже перегружен' : ' · после передачи ≈ ' + Math.min(n + 9, 99) + '/' + cap + ' ч') : 'Рядом — загрузка на текущей неделе';
      });
    },
    onSubmit(m, d) {
      const p = person(val(m, 'assignee'));
      d.toast = 'Проект передан: ' + p.name;
      emit('project:transferred', { person: p, role: roleLabel(p.role) });
    }
  });

  /* ---------- Факт за месяц ----------
     План и уже внесённые значения страница кладёт в SEOApp.metrics: { months, series: { traffic, leads, top10 } }. */
  App.registerModal('fact', {
    title: 'Внести факт за месяц', subtitle: 'Ручные значения перекрывают данные счётчиков в отчёте', submit: 'Сохранить факт', submitCan: 'edit_project',
    body: () =>
      grid(2,
        field('Проект', select('project', projectOptions('holod'))) +
        field('Месяц', select('month', MONTH_OPTIONS(0, 5, '2025-06'), 'required'), { req: true })) +
      grid(3,
        field('Трафик, визиты', input('traffic', 'type="number" min="0" step="1" required'), { req: true, hint: '', hintAttr: 'data-plan-hint="traffic"' }) +
        field('Лиды', input('leads', 'type="number" min="0" step="1" required'), { req: true, hint: '', hintAttr: 'data-plan-hint="leads"' }) +
        field('% в ТОП-10', input('top10', 'type="number" min="0" max="100" step="0.1" required'), { req: true, hint: '', hintAttr: 'data-plan-hint="top10"' })) +
      field('Источник цифр', select('source',
        option('manual', 'Ручной ввод данных', { selected: true }) +
        option('metrika', 'Сверка с Яндекс.Метрикой') +
        option('crm', 'Данные клиента из CRM'))) +
      field('Комментарий', textarea('comment', 'placeholder="Например: часть лидов пришла по телефону, учтено вручную"'), { opt: 'опционально' }) +
      check('to_report', 'Показать в отчёте клиенту за этот месяц', { checked: true }),
    init(m) {
      const fill = () => {
        const data = App.metricsFor ? App.metricsFor(val(m, 'project')) : App.metrics;
        const idx = m.querySelector('[name="month"]').selectedIndex;
        ['traffic', 'leads', 'top10'].forEach(k => {
          const s = data && data.series[k];
          const f = m.querySelector('[name="' + k + '"]');
          const hint = m.querySelector('[data-plan-hint="' + k + '"]');
          if (!s) { hint.textContent = ''; return; }
          f.value = s.fact[idx] != null ? s.fact[idx] : '';
          hint.textContent = 'План: ' + App.fmtNum(s.plan[idx], s.suffix) + (s.fact[idx] != null ? ' · сейчас ' + App.fmtNum(s.fact[idx], s.suffix) : '');
        });
      };
      m.querySelector('[name="month"]').addEventListener('change', fill);
      m.querySelector('[name="project"]').addEventListener('change', fill);
      m.addEventListener('modal:open', () => {
        const project = m.querySelector('[name="project"]');
        project.disabled = !!App.metrics;
        project.classList.toggle('bg-zinc-50', !!App.metrics);
        const src = m.querySelector('[name="source"]');
        if (src) src.value = 'manual';
        setTimeout(fill);
      });
    },
    onSubmit(m, d) {
      const idx = m.querySelector('[name="month"]').selectedIndex;
      const values = { traffic: +val(m, 'traffic'), leads: +val(m, 'leads'), top10: +val(m, 'top10') };
      d.toast = 'Факт за ' + label(m, 'month').toLowerCase() + ' сохранён · трафик ' + values.traffic.toLocaleString('ru-RU') + ', лиды ' + values.leads + ', ТОП-10 ' + App.fmtNum(values.top10, '%');
      emit('fact:saved', { index: idx, values, month: label(m, 'month') });
    }
  });

  /* ---------- Подключить источник данных к проекту ---------- */
  const SOURCES = {
    metrika:   { name: 'Яндекс.Метрика',        idLabel: 'ID счётчика',        ph: '94512367',              hint: 'Метрика → Настройки → номер счётчика',        digits: '6,7,8,9' },
    webmaster: { name: 'Яндекс.Вебмастер',      idLabel: 'Сайт в Вебмастере',  ph: 'https:holod-shop.ru:443', hint: 'Как сайт записан в Вебмастере' },
    gsc:       { name: 'Google Search Console', idLabel: 'Ресурс',             ph: 'sc-domain:holod-shop.ru', hint: 'Доменный ресурс или URL-префикс' },
    callibri:  { name: 'Callibri',              idLabel: 'ID проекта Callibri', ph: '108422',               hint: 'Callibri → Настройки проекта → ID',            digits: '4,5,6,7' }
  };
  App.registerModal('source', {
    title: 'Подключить источник', subtitle: 'Метрики подтянутся в проект, графики и отчёты', submit: 'Подключить', submitCan: 'link_counter',
    body: () =>
      grid(2,
        field('Тип источника', select('stype', Object.keys(SOURCES).map(k => option(k, SOURCES[k].name)).join(''), 'required data-dep-source="stype"'), { req: true }) +
        field('Аккаунт', select('account',
          option('direct@romashka.ru', 'direct@romashka.ru (Яндекс)', { when: 'metrika webmaster' }) +
          option('seo@romashka.ru', 'seo@romashka.ru (Google)', { when: 'gsc' }) +
          option('callibri-api', 'API-ключ компании Callibri', { when: 'callibri' }), 'data-dep="stype"'), { hint: 'Подключается один раз в Настройках → Интеграции' })) +
      field('ID счётчика', input('counter', 'type="text" required'), { req: true, hint: '', hintAttr: 'data-source-hint' }) +
      field('Что подтягивать', '<div class="rounded-2xl border border-zinc-200 p-4">' +
        '<div data-show-when="stype:metrika" class="space-y-2">' + check('m', 'Визиты из поиска', { checked: true }) + check('m', 'Конверсии по целям', { checked: true }) + check('m', 'Отказы и глубина', {}) + '</div>' +
        '<div data-show-when="stype:webmaster|gsc" class="hidden space-y-2">' + check('m', 'Позиции и показы запросов', { checked: true }) + check('m', 'Индексация страниц', { checked: true }) + check('m', 'Ошибки и предупреждения', {}) + '</div>' +
        '<div data-show-when="stype:callibri" class="hidden space-y-2">' + check('m', 'Звонки и заявки', { checked: true }) + check('m', 'Источник обращения', { checked: true }) + '</div></div>') +
      '<div data-show-when="stype:metrika">' + field('Цель «Лид»', select('goal', option('form', 'Отправка формы заявки') + option('call', 'Клик по телефону') + option('cart', 'Оформление заказа')), { hint: 'Конверсии по этой цели станут лидами в проекте' }) + '</div>' +
      field('Загрузить историю', select('history', option('3', 'За 3 месяца') + option('6', 'За 6 месяцев', { selected: true }) + option('12', 'За 12 месяцев'))),
    init(m) {
      const paint = () => {
        const s = SOURCES[val(m, 'stype')];
        const f = m.querySelector('[name="counter"]');
        f.closest('div').querySelector('label').firstChild.textContent = s.idLabel + ' ';
        f.placeholder = s.ph;
        if (s.digits) { f.dataset.digits = s.digits; f.inputMode = 'numeric'; } else { delete f.dataset.digits; f.inputMode = 'text'; }
        m.querySelector('[data-source-hint]').textContent = s.hint;
      };
      m.addEventListener('change', paint);
      m.addEventListener('modal:open', () => setTimeout(paint));
    },
    onSubmit(m, d) {
      const s = SOURCES[val(m, 'stype')];
      d.toast = s.name + ' подключён · ' + s.idLabel.toLowerCase() + ' ' + val(m, 'counter');
      emit('source:connected', { type: val(m, 'stype'), name: s.name, id: val(m, 'counter'), account: label(m, 'account') });
    }
  });

  /* ---------- Добавить в команду проекта / сменить роль ---------- */
  const PROJECT_ROLES = [
    { id: 'seo_head', name: 'Руководитель SEO', short: 'Рук. SEO', tone: 'bg-blue-50 text-blue-700' },
    { id: 'pm', name: 'Менеджер проекта', short: 'Менеджер', tone: 'bg-amber-50 text-amber-700' },
    { id: 'employee', name: 'SEO-специалист', short: 'SEO-специалист', tone: 'bg-emerald-50 text-emerald-700' },
    { id: 'contractor', name: 'Подрядчик', short: 'Подрядчик', tone: 'bg-zinc-100 text-zinc-700' }
  ];
  const projectRoleOptions = sel => PROJECT_ROLES.map(r => option(r.id, r.name, { selected: r.id === sel })).join('');
  let teamRoleRow = null;

  App.registerModal('team-add', {
    title: 'Добавить в команду', subtitle: 'Интернет-магазин «Холод»', submit: 'Добавить', submitCan: 'edit_project',
    body: () =>
      field('Сотрудник', select('member', option('', 'Выберите') + teamOptions(p => ['dronov', 'vetrova', 'smirnov', 'kim'].indexOf(p.id) !== -1, null, true), 'required'), { req: true }) +
      grid(2,
        field('Роль в проекте', select('as', projectRoleOptions('employee'), 'required data-dep-source="prole"'), { req: true }) +
        field('Лимит часов в месяц', input('hours', 'type="number" min="1" value="20"'))) +
      '<div data-show-when="prole:contractor" class="hidden">' + field('Доступ до', input('until', 'type="date" value="2025-09-30"'), { hint: 'Подрядчик увидит только назначенные задачи проекта' }) + '</div>',
    onSubmit(m, d) {
      const p = person(val(m, 'member'));
      const role = PROJECT_ROLES.find(r => r.id === val(m, 'as')) || PROJECT_ROLES[2];
      d.toast = p.name + ' добавлен(а) в команду · ' + role.name;
      emit('team:added', { person: p, as: role.name, note: role.name, projectRole: role.name, role: roleLabel(p.role) });
    }
  });

  App.registerModal('team-role', {
    title: 'Роль в проекте', subtitle: 'Изменить роль участника команды', submit: 'Сохранить', submitCan: 'edit_project', reset: false,
    body: () =>
      field('Сотрудник', '<div data-team-role-name class="px-3.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-700">—</div>') +
      field('Роль в проекте', select('as', projectRoleOptions('employee'), 'required'), { req: true, hint: 'Роль определяет доступ к задачам, отчётам и финансам проекта' }),
    init(m) {
      m.addEventListener('modal:open', e => {
        const opener = e.detail && e.detail.opener;
        teamRoleRow = opener ? opener.closest('li') : null;
        const name = teamRoleRow ? (teamRoleRow.querySelector('.text-sm.font-medium') || {}).textContent || '—' : '—';
        const cur = teamRoleRow ? (teamRoleRow.querySelector('[data-team-role]') || {}).textContent || '' : '';
        m.querySelector('[data-team-role-name]').textContent = name;
        const match = PROJECT_ROLES.find(r => r.short === cur || r.name === cur);
        m.querySelector('[name="as"]').value = match ? match.id : 'employee';
      });
    },
    onSubmit(m, d) {
      const role = PROJECT_ROLES.find(r => r.id === val(m, 'as')) || PROJECT_ROLES[2];
      d.toast = 'Роль обновлена: ' + role.name;
      emit('team:role', { row: teamRoleRow, role: role.name, short: role.short, tone: role.tone });
      teamRoleRow = null;
    }
  });

  document.addEventListener('confirm:ok', e => {
    const btn = e.target.closest('[data-team-remove]');
    if (!btn) return;
    /* Удаление строки — через data-confirm-remove="li" в app.js; здесь фиксируем событие для страницы */
    emit('team:removed', { row: btn.closest('li') });
  });

  /* ---------- Интеграции компании ---------- */
  const INT_STORE = 'seo_company_integrations';
  const INT_DEFAULT = {
    yandex:   { status: 'connected', account: 'direct@romashka.ru', projects: 12 },
    google:   { status: 'expired', account: 'marketing@romashka.ru', projects: 0 },
    callibri: { status: 'off', account: '', projects: 0 },
    amocrm:   { status: 'off', account: '', projects: 0 }
  };
  function readIntegrations() {
    try {
      const raw = JSON.parse(localStorage.getItem(INT_STORE) || 'null');
      return Object.assign({}, INT_DEFAULT, raw || {});
    } catch (e) { return Object.assign({}, INT_DEFAULT); }
  }
  function writeIntegrations(map) {
    localStorage.setItem(INT_STORE, JSON.stringify(map));
    App.integrations = map;
  }
  App.integrations = readIntegrations();
  App.readIntegrations = readIntegrations;
  App.writeIntegrations = writeIntegrations;

  const SERVICES = {
    yandex:   {
      name: 'Яндекс (Метрика и Вебмастер)', short: 'Яндекс', logo: 'Я', tone: 'bg-red-50 text-red-600',
      auth: 'oauth', btn: 'Войти через Яндекс ID', account: 'agency-master@yandex.ru',
      accounts: ['agency-master@yandex.ru', 'direct@romashka.ru', 'seo@romashka.ru'],
      perms: ['Просмотр данных счётчиков Яндекс.Метрики', 'Чтение поисковых запросов и индексации в Вебмастере', 'Управление доступом к статистике проектов'],
      bind: ['Метрика 48 213 907', 'Метрика 51 604 112', 'Метрика 39 877 450']
    },
    google:   {
      name: 'Google Search Console', short: 'Google Search Console', logo: 'G', tone: 'bg-blue-50 text-blue-600',
      auth: 'oauth', btn: 'Войти через Google', account: 'agency-master@gmail.com',
      accounts: ['agency-master@gmail.com', 'marketing@romashka.ru', 'seo@romashka.ru'],
      perms: ['Просмотр данных Search Console', 'Чтение поисковых запросов и индексации', 'Управление доступом к статистике проектов'],
      bind: ['sc-domain:holod-shop.ru', 'sc-domain:remont-plus.ru', 'https://stroytech.ru/']
    },
    callibri: {
      name: 'Callibri — коллтрекинг', short: 'Callibri', logo: 'C', tone: 'bg-amber-50 text-amber-600',
      auth: 'key', host: 'romashka.callibri.ru', account: 'romashka.callibri.ru',
      perms: ['Чтение статистики звонков и заявок', 'Доступ к номерам коллтрекинга проектов', 'Управление доступом к статистике проектов'],
      bind: ['Сайт #2231 · 6 номеров', 'Сайт #2240 · 2 номера', 'Сайт #2318 · 3 номера']
    },
    amocrm:   {
      name: 'amoCRM — лиды', short: 'amoCRM', logo: 'A', tone: 'bg-emerald-50 text-emerald-700',
      auth: 'key', host: 'romashka.amocrm.ru', account: 'romashka.amocrm.ru',
      perms: ['Чтение сделок и контактов', 'Доступ к воронкам SEO-заявок', 'Управление доступом к статистике проектов'],
      bind: ['Воронка «SEO-заявки»', 'Воронка «Опт»', 'Воронка «Сервис»']
    }
  };

  /* Окно симуляции OAuth / API-разрешений (нативный вид Яндекс/Google) */
  App.registerModal('integration-oauth', {
    title: 'Подключение сервиса',
    subtitle: 'Яндекс',
    submit: false,
    cancel: 'Отмена',
    size: 'md',
    body: () =>
      '<div class="space-y-5" data-oauth-root>' +
        '<div class="flex items-center justify-center gap-3 py-2">' +
          '<span data-oauth-logo class="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center text-lg font-bold shadow-sm">Я</span>' +
          '<svg class="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M8 12h8m0 0l-3-3m3 3l-3 3"/></svg>' +
          '<span class="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center text-sm font-semibold shadow-sm">РМ</span>' +
        '</div>' +
        '<p class="text-center text-sm text-zinc-600"><span data-oauth-svc class="font-medium text-ink">Яндекс</span> запрашивает доступ для <span class="font-medium text-ink">Ромашка Digital</span></p>' +
        '<ul data-oauth-perms class="rounded-2xl border border-zinc-200 divide-y divide-zinc-100 text-sm text-zinc-700"></ul>' +
        '<div data-oauth-account-wrap>' +
          field('Сервисный аккаунт', select('oauth_account', '')) +
        '</div>' +
        '<div data-oauth-key-wrap class="hidden space-y-3">' +
          field('Адрес аккаунта', input('oauth_domain', 'type="text" placeholder="romashka.callibri.ru"')) +
          field('API-ключ', input('oauth_token', 'type="password" autocomplete="off" placeholder="Вставьте ключ из настроек сервиса"')) +
        '</div>' +
        '<button type="button" data-oauth-allow class="w-full h-11 px-4 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-hover transition shadow-sm inline-flex items-center justify-center gap-2">' +
          '<span data-oauth-allow-label>Разрешить доступ</span>' +
          '<svg data-oauth-spin class="hidden w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>' +
        '</button>' +
        '<p class="text-[11px] text-zinc-400 text-center">Sandbox OAuth · пароль сервису не передаётся</p>' +
      '</div>',
    init(m) {
      let current = 'yandex';
      const logo = m.querySelector('[data-oauth-logo]');
      const svcEl = m.querySelector('[data-oauth-svc]');
      const perms = m.querySelector('[data-oauth-perms]');
      const accWrap = m.querySelector('[data-oauth-account-wrap]');
      const keyWrap = m.querySelector('[data-oauth-key-wrap]');
      const allowBtn = m.querySelector('[data-oauth-allow]');
      const allowLabel = m.querySelector('[data-oauth-allow-label]');
      const spin = m.querySelector('[data-oauth-spin]');
      const accSel = m.querySelector('[name="oauth_account"]');

      const paint = (id) => {
        current = id;
        const s = SERVICES[id] || SERVICES.yandex;
        m.querySelector('[data-modal-subtitle]').textContent = s.short;
        logo.className = 'w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm ' + s.tone;
        logo.textContent = s.logo;
        svcEl.textContent = s.short;
        perms.innerHTML = (s.perms || []).map(p =>
          '<li class="px-4 py-2.5 flex items-start gap-2.5"><svg class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/></svg><span>' + p + '</span></li>'
        ).join('');
        const isKey = s.auth === 'key';
        accWrap.classList.toggle('hidden', isKey);
        keyWrap.classList.toggle('hidden', !isKey);
        allowLabel.textContent = isKey ? 'Подключить по API' : 'Разрешить доступ';
        if (!isKey && s.accounts) {
          accSel.innerHTML = s.accounts.map((a, i) => option(a, a, { selected: i === 0 })).join('');
        }
        if (isKey && s.host) m.querySelector('[name="oauth_domain"]').value = s.host;
      };

      let deferPersist = false;
      let returnOpener = null;
      m.addEventListener('modal:open', e => {
        const op = e.detail.opener;
        returnOpener = op;
        deferPersist = !!(op && op.dataset.oauthDefer === '1');
        const id = (op && (op.dataset.prefillService || op.dataset.oauthService)) || 'yandex';
        paint(id);
        allowBtn.disabled = false;
        spin.classList.add('hidden');
      });

      allowBtn.addEventListener('click', () => {
        if (allowBtn.disabled) return;
        const s = SERVICES[current];
        const isKey = s.auth === 'key';
        let account = s.account;
        if (isKey) {
          const token = val(m, 'oauth_token');
          if (token.length < 8) return App.toast('Вставьте API-ключ (не меньше 8 символов)');
          account = val(m, 'oauth_domain') || s.host || s.short;
        } else {
          account = val(m, 'oauth_account') || s.account;
        }
        allowBtn.disabled = true;
        spin.classList.remove('hidden');
        allowLabel.textContent = 'Проверяем доступ…';
        setTimeout(() => {
          spin.classList.add('hidden');
          allowBtn.disabled = false;
          allowLabel.textContent = isKey ? 'Подключить по API' : 'Разрешить доступ';
          if (deferPersist) {
            emit('integration:oauth-ok', { service: current, account: account, projects: (s.bind || []).length });
            App.closeModals();
            if (returnOpener && returnOpener.dataset.oauthReturn === 'integration') {
              setTimeout(() => App.openModal('integration', returnOpener), 40);
            }
            return;
          }
          const map = readIntegrations();
          map[current] = { status: 'connected', account: account, projects: s.bind ? s.bind.length : 0 };
          writeIntegrations(map);
          App.toast('Интеграция с ' + s.short + ' успешно подключена для компании');
          emit('integration:connected', { service: current, account: account, projects: map[current].projects, via: 'oauth' });
          App.closeModals();
        }, 1000);
      });
    }
  });
  const WZ_PROJECTS = PROJECTS.filter(p => ['holod', 'remont', 'stroytech'].indexOf(p.id) !== -1).map(p => [p.id, p.name]);
  const WZ_STEPS = ['Сервис', 'Авторизация', 'Проекты'];
  App.registerModal('integration', {
    title: 'Подключить интеграцию', subtitle: 'Один аккаунт на компанию — счётчики привязываются в проектах', submit: 'Далее', submitCan: 'int_seo,int_client',
    body: () =>
      '<ol class="flex items-center gap-2 text-xs" aria-label="Шаги">' + WZ_STEPS.map((t, i) =>
        '<li class="flex items-center gap-2 min-w-0' + (i ? ' flex-1' : '') + '">' + (i ? '<span class="flex-1 h-px bg-zinc-200"></span>' : '') +
        '<span data-wz-dot="' + (i + 1) + '" class="w-6 h-6 rounded-full flex items-center justify-center font-semibold tabular-nums shrink-0 bg-zinc-100 text-zinc-500 transition">' + (i + 1) + '</span>' +
        '<span data-wz-label="' + (i + 1) + '" class="font-medium text-zinc-500 whitespace-nowrap">' + t + '</span></li>').join('') + '</ol>' +

      '<div data-wz-step="1" class="grid grid-cols-1 sm:grid-cols-2 gap-2">' + Object.keys(SERVICES).map(k => {
        const v = SERVICES[k];
        return '<label class="flex items-center gap-3 rounded-2xl border border-zinc-200 p-3 cursor-pointer hover:bg-zinc-50 has-[:checked]:border-accent has-[:checked]:ring-4 has-[:checked]:ring-accent/15 transition">' +
          '<input type="radio" name="service" value="' + k + '"' + (k === 'yandex' ? ' checked' : '') + ' required data-dep-source="svc" class="sr-only">' +
          '<span class="w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ' + v.tone + '">' + v.logo + '</span>' +
          '<span class="min-w-0"><span class="block text-sm font-medium truncate">' + v.short + '</span><span class="block text-xs text-zinc-500 truncate">' + (v.auth === 'oauth' ? 'Вход через OAuth' : 'По API-ключу') + '</span></span></label>';
      }).join('') + '</div>' +

      '<div data-wz-step="2" class="hidden space-y-4">' +
        '<div data-show-when="svc:yandex|google" class="space-y-4">' +
          '<button type="button" data-wz-oauth class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition"></button>' +
          '<div data-wz-oauth-state class="hidden rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800"></div>' +
          note('Откроется окно входа сервиса. SEO Control запрашивает доступ <b class="font-medium">только на чтение</b>: посещаемость, цели, поисковые запросы и индексацию. Пароль нам не передаётся.') +
        '</div>' +
        '<div data-show-when="svc:callibri|amocrm" class="hidden space-y-4">' +
          field('Адрес аккаунта', input('domain', 'type="text" required placeholder="romashka.callibri.ru"'), { req: true }) +
          field('API-ключ', '<div class="flex gap-2"><input name="token" type="password" required autocomplete="off" placeholder="Вставьте ключ из настроек сервиса" class="' + F + ' font-mono"><button type="button" data-wz-check class="shrink-0 px-3.5 rounded-xl border border-zinc-200 text-sm font-medium hover:bg-zinc-50 transition">Проверить</button></div>', { req: true, hint: 'Ключ хранится в зашифрованном виде, сотрудники видят только последние 4 символа' }) +
          '<div data-wz-key-state class="hidden rounded-2xl px-4 py-3 text-sm"></div>' +
        '</div>' +
      '</div>' +

      '<div data-wz-step="3" class="hidden space-y-3">' +
        '<p class="text-xs text-zinc-500">Найдены источники данных. Отметьте, к каким проектам их привязать — потом это можно поменять в «Источниках» проекта.</p>' +
        '<ul data-wz-bind class="rounded-2xl border border-zinc-200 divide-y divide-zinc-100"></ul>' +
      '</div>' +
      '<button type="button" data-wz-back class="hidden text-xs text-zinc-500 hover:text-zinc-900 transition">← Назад</button>',
    init(m) {
      let step = 1, authed = false, keyOk = false, pendingOAuth = null;
      const svc = () => (m.querySelector('[name="service"]:checked') || {}).value || 'yandex';
      const sub = m.querySelector('[data-modal-submit]');
      const paint = () => {
        const s = SERVICES[svc()];
        m.querySelectorAll('[data-wz-step]').forEach(el => el.classList.toggle('hidden', +el.dataset.wzStep !== step));
        m.querySelectorAll('[data-wz-dot]').forEach(el => {
          const n = +el.dataset.wzDot;
          el.className = 'w-6 h-6 rounded-full flex items-center justify-center font-semibold tabular-nums shrink-0 transition ' + (n < step ? 'bg-emerald-500 text-white' : n === step ? 'bg-accent text-white' : 'bg-zinc-100 text-zinc-500');
          el.textContent = n < step ? '' : n;
          if (n < step) el.setAttribute('aria-label', 'Шаг выполнен');
          m.querySelector('[data-wz-label="' + n + '"]').className = 'font-medium whitespace-nowrap ' + (n === step ? 'text-zinc-900' : 'text-zinc-500');
        });
        m.querySelector('[data-wz-back]').classList.toggle('hidden', step === 1);
        m.querySelector('[data-modal-subtitle]').textContent = step === 1 ? 'Шаг 1 из 3 · выберите сервис' : s.name + ' · шаг ' + step + ' из 3';
        sub.textContent = step < 3 ? 'Далее' : 'Подключить';
        const ob = m.querySelector('[data-wz-oauth]');
        ob.className = 'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition ' + (svc() === 'yandex' ? 'bg-[#fc3f1d] text-white hover:brightness-95' : 'bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50');
        ob.innerHTML = '<span class="w-6 h-6 rounded-full flex items-center justify-center font-bold ' + (svc() === 'yandex' ? 'bg-white text-[#fc3f1d]' : 'bg-blue-50 text-blue-600') + '">' + s.logo + '</span>' + (authed ? 'Войти другим аккаунтом' : s.btn);
        if (step === 3) m.querySelector('[data-wz-bind]').innerHTML = WZ_PROJECTS.map((p, i) =>
          '<li class="px-3 py-2.5 flex items-center gap-3"><input type="checkbox" name="bind-' + p[0] + '"' + (i < 2 ? ' checked' : '') + ' class="w-4 h-4 rounded accent-accent shrink-0">' +
          '<span class="min-w-0 flex-1"><span class="block text-sm font-medium truncate">' + p[1] + '</span><span class="block text-xs text-zinc-500 truncate">' + s.bind[i] + '</span></span></li>').join('');
      };
      m.addEventListener('modal:open', e => {
        const op = e.detail.opener;
        keyOk = false;
        if (pendingOAuth && pendingOAuth.service === ((op && op.dataset.prefillService) || svc())) {
          authed = true;
          SERVICES[pendingOAuth.service].account = pendingOAuth.account;
          step = 2;
        } else {
          authed = false;
          pendingOAuth = null;
          step = op && op.dataset.prefillService ? 2 : 1;
        }
        m.querySelector('[data-wz-oauth-state]').classList.add('hidden');
        m.querySelector('[data-wz-key-state]').classList.add('hidden');
        m.querySelector('[data-modal-title]').textContent = op && op.dataset.reconnect ? 'Переподключить интеграцию' : 'Подключить интеграцию';
        const s = SERVICES[svc()];
        if (s.host) m.querySelector('[name="domain"]').value = s.host;
        setTimeout(() => {
          paint();
          if (authed && pendingOAuth) {
            const st = m.querySelector('[data-wz-oauth-state]');
            st.innerHTML = 'Доступ разрешён · <b class="font-medium">' + pendingOAuth.account + '</b><div class="text-xs text-emerald-700 mt-0.5">Найдено источников: ' + s.bind.length + '</div>';
            st.classList.remove('hidden');
            pendingOAuth = null;
          }
        });
      });
      m.addEventListener('change', e => {
        if (e.target.name !== 'service') return;
        authed = false; keyOk = false;
        const s = SERVICES[svc()];
        m.querySelector('[name="domain"]').value = s.host || '';
        m.querySelector('[data-wz-oauth-state]').classList.add('hidden');
        m.querySelector('[data-wz-key-state]').classList.add('hidden');
        paint();
      });
      m.querySelector('[name="token"]').addEventListener('input', () => { keyOk = false; m.querySelector('[data-wz-key-state]').classList.add('hidden'); });
      m.addEventListener('click', e => {
        if (e.target.closest('[data-wz-back]')) { step = Math.max(1, step - 1); paint(); return; }
        const ob = e.target.closest('[data-wz-oauth]');
        if (ob) {
          const id = svc();
          const opener = document.createElement('button');
          opener.dataset.prefillService = id;
          opener.dataset.oauthDefer = '1';
          opener.dataset.oauthReturn = 'integration';
          const onOk = e2 => {
            if (e2.detail.service !== id) return;
            document.removeEventListener('integration:oauth-ok', onOk);
            pendingOAuth = { service: id, account: e2.detail.account };
            SERVICES[id].account = e2.detail.account;
          };
          document.addEventListener('integration:oauth-ok', onOk);
          App.openModal('integration-oauth', opener);
          return;
        }
        if (e.target.closest('[data-wz-check]')) {
          const key = val(m, 'token'), st = m.querySelector('[data-wz-key-state]');
          keyOk = key.length >= 8;
          st.className = 'rounded-2xl px-4 py-3 text-sm ' + (keyOk ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700');
          st.textContent = keyOk ? 'Ключ действителен · найдено источников: ' + SERVICES[svc()].bind.length : 'Ключ не подошёл — проверьте, что скопировали его целиком';
          if (!keyOk) App.toast('Проверьте API-ключ');
        }
      });
      m.addEventListener('modal:submit', e => {
        const s = SERVICES[svc()];
        if (step === 2 && s.auth === 'oauth' && !authed) { e.preventDefault(); return App.toast('Сначала войдите через ' + s.short); }
        if (step === 2 && s.auth === 'key' && !keyOk) {
          e.preventDefault();
          if (val(m, 'token').length >= 8) { m.querySelector('[data-wz-check]').click(); if (keyOk) { step = 3; paint(); } }
          else App.toast('Проверьте API-ключ');
          return;
        }
        if (step < 3) { e.preventDefault(); step++; paint(); return; }
        const n = m.querySelectorAll('[data-wz-bind] input:checked').length;
        if (!n) { e.preventDefault(); return App.toast('Выберите хотя бы один проект'); }
        const account = s.account || s.host || val(m, 'domain');
        const map = readIntegrations();
        map[svc()] = { status: 'connected', account: account, projects: n };
        writeIntegrations(map);
        e.detail.toast = s.short + ' подключён · ' + n + ' ' + App.plural(n, ['проект', 'проекта', 'проектов']);
        emit('integration:connected', { service: svc(), account: account, projects: n, via: 'wizard' });
      });
    }
  });

  /* ---------- Тарифы и Sandbox-оплата ---------- */
  const RUB_PLANS = [
    { id: 'start', name: 'Старт',           price: 4900,  projects: 5,  seats: 3,  note: 'Небольшие команды и соло-специалисты' },
    { id: 'pro',   name: 'Про / Агентство', price: 9900,  projects: 25, seats: 10, note: 'Хит продаж для агентств с отделом' },
    { id: 'ent',   name: 'Enterprise',      price: 39900, projects: 0,  seats: 0,  note: 'Сети агентств и in-house отделы' }
  ];
  const fmtRub = n => n.toLocaleString('ru-RU') + ' ₽';
  const YEAR_FACTOR = 0.8;

  const tariffChangeDef = {
    title: 'Сменить тариф',
    subtitle: 'Сейчас: Тариф Про (Агентство) · пробный период',
    submit: 'Перейти на тариф',
    submitCan: 'billing',
    size: 'lg',
    body: () =>
      '<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">' + RUB_PLANS.map(p =>
        '<label class="relative rounded-2xl border border-zinc-200 p-4 cursor-pointer hover:bg-zinc-50 has-[:checked]:border-accent has-[:checked]:ring-4 has-[:checked]:ring-accent/15 transition">' +
        '<input type="radio" name="plan" value="' + p.id + '"' + (p.id === 'pro' ? ' checked' : '') + ' class="sr-only">' +
        '<div class="text-sm font-semibold">' + p.name + '</div>' +
        '<div class="text-xl font-semibold tracking-tight mt-1 tabular-nums">' + fmtRub(p.price) + '<span class="text-xs font-normal text-zinc-500">/мес</span></div>' +
        '<div class="text-xs text-zinc-500 mt-2">' + p.note + '</div>' +
        '<div class="text-xs text-zinc-400 mt-1">' + (p.projects ? 'До ' + p.projects + ' проектов' : 'Без лимита проектов') +
        (p.seats ? ' · до ' + p.seats + ' сотрудников' : '') + '</div></label>').join('') + '</div>' +
      field('Период оплаты', select('period', option('month', 'Помесячно') + option('year', 'За год — скидка 20%'))) +
      '<div data-tariff-total class="rounded-2xl bg-zinc-50 px-4 py-3 text-sm"></div>',
    init(m) {
      const paint = () => {
        const p = RUB_PLANS.find(x => x.id === (m.querySelector('[name="plan"]:checked') || {}).value) || RUB_PLANS[1];
        const year = val(m, 'period') === 'year';
        const monthly = Math.round(p.price * (year ? YEAR_FACTOR : 1));
        m.querySelector('[data-tariff-total]').innerHTML =
          'Итого: <span class="font-semibold tabular-nums">' + fmtRub(monthly) + '/мес</span>' +
          (year ? ' · <span class="tabular-nums">' + fmtRub(monthly * 12) + '</span> за год' : '') +
          (p.id === 'start' ? '<div class="text-xs text-amber-700 mt-1">На «Старте» лимит 5 проектов — лишние придётся архивировать</div>' : '');
      };
      m.addEventListener('change', paint);
      m.addEventListener('modal:open', () => setTimeout(paint));
    },
    onSubmit(m, d) {
      const p = RUB_PLANS.find(x => x.id === m.querySelector('[name="plan"]:checked').value) || RUB_PLANS[1];
      if (p.id === 'pro') {
        d.toast = 'Тариф «Про» сохранён — оформите оплату в окне Checkout';
        setTimeout(() => App.openModal('checkout'), 280);
        return;
      }
      d.toast = 'Заявка на смену тарифа на «' + p.name + '» отправлена · менеджер свяжется в течение дня';
    }
  };
  App.registerModal('tariff-change', tariffChangeDef);
  App.registerModal('tariff', tariffChangeDef);

  App.registerModal('checkout', {
    title: 'Оплата подписки SEO Control',
    subtitle: 'Тариф «Про»',
    submit: false,
    cancel: 'Закрыть',
    size: 'lg',
    body: () =>
      '<div data-seg-scope class="space-y-4">' +
        '<div>' +
          '<div class="text-xs font-medium text-zinc-500 mb-2">Период</div>' +
          '<div data-segmented data-checkout-period class="inline-flex flex-wrap bg-zinc-100 rounded-full p-1 gap-0.5" role="group">' +
            '<button type="button" data-seg="month" aria-pressed="true" class="px-3.5 py-1.5 rounded-full text-sm font-medium">На 1 месяц · 9 900 ₽</button>' +
            '<button type="button" data-seg="year" aria-pressed="false" class="px-3.5 py-1.5 rounded-full text-sm font-medium">На 1 год · 95 040 ₽ (−20%)</button>' +
          '</div>' +
        '</div>' +
        '<div>' +
          '<div class="text-xs font-medium text-zinc-500 mb-2">Способ оплаты</div>' +
          '<div data-segmented data-checkout-pay class="inline-flex bg-zinc-100 rounded-full p-1" role="group">' +
            '<button type="button" data-seg="card" aria-pressed="true" class="px-3.5 py-1.5 rounded-full text-sm font-medium">Банковская карта</button>' +
            '<button type="button" data-seg="invoice" aria-pressed="false" class="px-3.5 py-1.5 rounded-full text-sm font-medium">Счёт на оплату</button>' +
          '</div>' +
        '</div>' +
        '<div data-seg-panel="card" class="space-y-3">' +
          '<p class="text-xs text-zinc-500">Для физлиц и самозанятых · Sandbox Test</p>' +
          field('Номер карты', '<input name="card_number" type="text" inputmode="numeric" placeholder="4242 •••• •••• 4242" value="4242 •••• •••• 4242" class="' + F + ' tabular-nums">') +
          grid(2,
            field('Срок', '<input name="card_exp" type="text" inputmode="numeric" placeholder="MM/YY" value="12/28" class="' + F + ' tabular-nums">') +
            field('CVC', '<input name="card_cvc" type="password" inputmode="numeric" placeholder="•••" value="123" maxlength="4" class="' + F + ' tabular-nums">')
          ) +
        '</div>' +
        '<div data-seg-panel="invoice" class="hidden space-y-3">' +
          '<p class="text-xs text-zinc-500">Для юрлиц и ИП · данные подставлены из профиля компании</p>' +
          grid(2,
            field('ИНН', '<input name="inn" type="text" value="7701234567" class="' + F + ' tabular-nums">') +
            field('Организация', '<input name="org" type="text" value="Ромашка Digital" class="' + F + '">')
          ) +
          '<button type="button" data-checkout-invoice class="w-full h-10 px-4 rounded-full bg-white border border-zinc-200 text-sm font-medium hover:bg-zinc-50 transition inline-flex items-center justify-center gap-1.5">Сформировать и скачать счёт на оплату (PDF)</button>' +
        '</div>' +
        '<button type="button" data-checkout-pay-btn data-can="billing" class="w-full h-11 px-4 rounded-full bg-accent text-white text-sm font-medium hover:bg-accent-hover transition shadow-sm inline-flex items-center justify-center gap-2">' +
          '<span data-pay-label>Оплатить 9 900 ₽ (Тестовый платеж)</span>' +
          '<svg data-pay-spin class="hidden w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>' +
        '</button>' +
        '<p class="text-[11px] text-zinc-400 text-center">Sandbox Checkout · деньги не списываются</p>' +
      '</div>',
    init(m) {
      let period = 'month';
      let payMethod = 'card';
      const payBtn = m.querySelector('[data-checkout-pay-btn]');
      const payLabel = m.querySelector('[data-pay-label]');
      const spin = m.querySelector('[data-pay-spin]');
      const amountOf = () => period === 'year' ? 95040 : 9900;
      const syncPay = () => {
        payLabel.textContent = 'Оплатить ' + fmtRub(amountOf()) + ' (Тестовый платеж)';
        payBtn.classList.toggle('hidden', payMethod === 'invoice');
      };
      m.querySelector('[data-checkout-period]').addEventListener('seg:change', e => {
        period = e.detail.value;
        syncPay();
      });
      m.querySelector('[data-checkout-pay]').addEventListener('seg:change', e => {
        payMethod = e.detail.value;
        syncPay();
      });
      m.querySelector('[data-checkout-invoice]').addEventListener('click', () => {
        const org = val(m, 'org') || 'Ромашка Digital';
        App.toast('Счёт № СЧ-' + amountOf() + ' для «' + org + '» сформирован · PDF скачивается');
      });
      payBtn.addEventListener('click', () => {
        if (payBtn.disabled) return;
        payBtn.disabled = true;
        spin.classList.remove('hidden');
        payLabel.textContent = 'Обработка платежа…';
        setTimeout(() => {
          spin.classList.add('hidden');
          payBtn.disabled = false;
          syncPay();
          const amt = amountOf();
          const isYear = period === 'year';
          App.toast('Оплата успешно проведена! Тариф «Про» активен на ' + (isYear ? '365 дней' : '30 дней'));
          emit('billing:paid', {
            amount: amt,
            period: period,
            method: 'card',
            purpose: isYear ? 'Подписка «Про» на 1 год' : 'Подписка «Про» на 1 месяц',
            until: '26.11.2026'
          });
          App.closeModals();
        }, 1000);
      });
      m.addEventListener('modal:open', () => {
        period = 'month';
        payMethod = 'card';
        if (App.segment) {
          App.segment(m.querySelector('[data-checkout-period]'), 'month');
          App.segment(m.querySelector('[data-checkout-pay]'), 'card');
        }
        syncPay();
      });
    }
  });

})();
