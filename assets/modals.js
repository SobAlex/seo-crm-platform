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
    return '<label class="flex items-start gap-2.5 text-sm cursor-pointer"' + (o.attrs ? ' ' + o.attrs : '') + '><input type="checkbox" name="' + name + '"' + (o.checked ? ' checked' : '') + (o.value ? ' value="' + esc(o.value) + '"' : '') + ' class="mt-0.5 w-4 h-4 rounded border-zinc-300 accent-[#0071e3]"><span>' + label + (o.hint ? '<span class="block text-xs text-zinc-500 mt-0.5">' + o.hint + '</span>' : '') + '</span></label>';
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

  /* ---------- Новый проект ---------- */
  App.registerModal('project-create', {
    title: 'Новый проект', subtitle: 'Клиент, тип и дорожная карта связаны: карта подбирается по типу проекта',
    size: 'lg', submit: 'Создать проект', submitCan: 'create_project',
    body: () =>
      grid(2,
        field('Название проекта', input('title', 'type="text" required placeholder="Интернет-магазин «Альфа»"'), { req: true }) +
        field('Сайт', input('site', 'type="text" required placeholder="alfa-shop.ru" inputmode="url"'), { req: true })) +
      field('Клиент', select('client', option('', 'Выберите клиента') + clientOptions() + option('__new', '＋ Новый клиент…'), 'required data-dep-source="pclient"'), { req: true, hint: 'Ставка и контакты подтянутся из карточки клиента', hintAttr: 'data-client-info' }) +
      '<div data-show-when="pclient:__new" class="hidden">' + box(
        '<div class="text-xs font-medium text-zinc-900">Новый клиент</div>' +
        grid(2,
          field('Компания', input('new_client', 'type="text" required placeholder="ООО «Бета»"'), { req: true }) +
          field('ИНН', input('new_inn', 'type="text" required inputmode="numeric" data-digits="10,12" placeholder="10 или 12 цифр"'), { req: true })) +
        field('Контактное лицо', input('new_contact', 'type="text" placeholder="Имя и фамилия"'), { opt: 'можно позже' })) + '</div>' +
      grid(2,
        field('Тип проекта', select('type', option('', 'Выберите тип') + TYPES.map(t => option(t.id, t.name)).join(''), 'required data-dep-source="ptype"'), { req: true }) +
        field('Дорожная карта', select('roadmap', option('', 'Сначала выберите тип') + ROADMAPS.map(r => option(r.id, r.name, { when: r.type })).join(''), 'required data-dep="ptype"'), { req: true, hint: 'Показаны шаблоны выбранного типа', hintAttr: 'data-roadmap-info' })) +
      grid(3,
        field('Старт работ', select('start', MONTH_OPTIONS(6, 11, '2025-07'))) +
        field('Чек в месяц, ₽', input('budget', 'type="number" min="0" step="1000" placeholder="120 000"'), { attrs: 'data-can="see_finance"' }) +
        field('Лимит часов', input('hours', 'type="number" min="1" value="60"'))) +
      grid(2,
        field('Менеджер проекта', select('pm', option('', 'Выберите') + teamOptions(p => p.role === 'pm' || p.role === 'mgr_head'), 'required'), { req: true }) +
        field('SEO-специалист', select('seo', option('', 'Выберите') + teamOptions(p => p.role === 'employee' || p.role === 'seo_head', null, true), 'required'), { req: true })) +
      check('first_plan', 'Сразу собрать план первого месяца из дорожной карты', { checked: true, hint: 'Работы месяца 1 станут задачами с исполнителями по ролям' }),
    init(m) {
      const info = m.querySelector('[data-roadmap-info]');
      const cInfo = m.querySelector('[data-client-info]');
      const paint = () => {
        const c = client(val(m, 'client'));
        cInfo.textContent = c ? c.contact + ' · ' + c.email + ' · ставка ' + c.rate.toLocaleString('ru-RU') + ' ₽/ч' : 'Ставка и контакты подтянутся из карточки клиента';
        const t = m.querySelector('[name="type"]');
        if (c && !t.value && TYPES.some(x => x.id === c.brief)) { t.value = c.brief; App.syncDeps(m); }
        const r = ROADMAPS.find(x => x.id === val(m, 'roadmap'));
        info.textContent = r ? r.info : 'Показаны шаблоны выбранного типа';
      };
      m.addEventListener('change', paint);
      m.addEventListener('modal:open', () => setTimeout(paint));
    },
    onSubmit(m, d) {
      const c = val(m, 'client') === '__new' ? val(m, 'new_client') : label(m, 'client');
      d.toast = 'Проект «' + val(m, 'title') + '» создан · ' + c + (m.querySelector('[name="first_plan"]').checked ? ' · план месяца 1 собран' : '');
      emit('project:created', { title: val(m, 'title'), site: val(m, 'site'), client: c, type: label(m, 'type'), roadmap: label(m, 'roadmap') });
    }
  });

  /* ---------- Клиент: создать / редактировать ---------- */
  const CITIES = ['Москва', 'Санкт-Петербург', 'Екатеринбург', 'Новосибирск', 'Казань', 'Краснодар', 'Нижний Новгород'];
  function clientBody(c) {
    c = c || {};
    const v = x => x ? ' value="' + esc(x) + '"' : '';
    return grid(2,
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
    onSubmit(m, d) {
      const c = { id: 'c' + Date.now(), name: val(m, 'name'), inn: val(m, 'inn'), city: val(m, 'city'), rate: +val(m, 'rate') || 0, contact: val(m, 'contact'), email: val(m, 'email'), brief: val(m, 'brief') };
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
    onSubmit(m, d) {
      d.toast = 'Карточка клиента сохранена';
      emit('client:updated', { name: val(m, 'name'), inn: val(m, 'inn'), city: val(m, 'city'), rate: val(m, 'rate'), contact: val(m, 'contact'), email: val(m, 'email'), phone: val(m, 'phone'), post: val(m, 'post') });
    }
  });

  /* ---------- Отправить бриф ---------- */
  App.registerModal('brief-send', {
    title: 'Отправить бриф', subtitle: 'Публичная ссылка на форму или приглашение в портал', submit: 'Готово', submitCan: 'create_client',
    body: () =>
      grid(2,
        field('Клиент', select('client', clientOptions('holod'), 'required'), { req: true }) +
        field('Шаблон брифа', select('brief', briefOptions('ecommerce')))) +
      '<div data-seg-scope class="space-y-4">' +
        '<div data-segmented data-brief-mode class="w-full" role="group" aria-label="Способ">' +
          '<button type="button" data-seg="link" aria-pressed="true" class="flex-1 px-4 py-1.5 rounded-full text-sm font-medium text-zinc-500 transition">Публичная ссылка</button>' +
          '<button type="button" data-seg="invite" class="flex-1 px-4 py-1.5 rounded-full text-sm font-medium text-zinc-500 transition">Приглашение в портал</button>' +
        '</div>' +
        '<div data-seg-panel="link" class="space-y-4">' +
          field('Ссылка на бриф', '<div class="flex gap-2"><input name="link" type="text" readonly class="' + F + ' bg-zinc-50 text-zinc-600 font-mono text-xs"><button type="button" data-copy data-copy-from="[name=link]" data-copy-toast="Ссылка на бриф скопирована" class="shrink-0 px-4 py-2 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition">Скопировать</button></div>', { hint: 'Клиент заполнит бриф без регистрации. Ответы появятся в карточке клиента.' }) +
          grid(2,
            field('Ссылка действует', select('ttl', option('7', '7 дней') + option('14', '14 дней', { selected: true }) + option('30', '30 дней') + option('0', 'Без срока'))) +
            '<div class="flex items-end"><a data-brief-preview href="brief-form.html" target="_blank" rel="noopener" class="w-full text-center px-4 py-2 rounded-full bg-white border border-zinc-200 text-sm font-medium hover:bg-zinc-50 transition">Открыть форму брифа ↗</a></div>') +
        '</div>' +
        '<div data-seg-panel="invite" class="space-y-4 hidden">' +
          grid(2,
            field('Email контакта', input('email', 'type="email" required'), { req: true }) +
            field('Имя', input('contact', 'type="text"'))) +
          check('portal', 'Открыть клиенту доступ к порталу проекта', { checked: true, hint: 'Роль «Клиент»: результаты, дорожная карта и принятые отчёты', attrs: 'data-can="invite_clients"' }) +
          field('Сообщение', textarea('message', '', 'Здравствуйте! Чтобы мы быстрее стартовали, заполните, пожалуйста, бриф — это займёт около 10 минут.')) +
        '</div>' +
      '</div>',
    init(m) {
      const paint = () => {
        const c = client(val(m, 'client')) || CLIENTS[0];
        const url = new URL('brief-form.html', location.href);
        url.searchParams.set('client', c.id);
        url.searchParams.set('brief', val(m, 'brief'));
        url.searchParams.set('t', (c.inn || '').slice(-4) + 'k9');
        m.querySelector('[name="link"]').value = url.href;
        m.querySelector('[data-brief-preview]').href = url.href;
        const email = m.querySelector('[name="email"]');
        if (email && (!email.value || email.dataset.auto === '1')) { email.value = c.email || ''; email.dataset.auto = '1'; }
        const name = m.querySelector('[name="contact"]');
        if (name && (!name.value || name.dataset.auto === '1')) { name.value = c.contact || ''; name.dataset.auto = '1'; }
      };
      m.querySelector('[name="client"]').addEventListener('change', () => {
        const c = client(val(m, 'client'));
        if (c && c.brief) m.querySelector('[name="brief"]').value = c.brief;
        m.querySelectorAll('[data-auto]').forEach(f => { f.value = ''; });
      });
      m.addEventListener('change', paint);
      m.querySelectorAll('[name="email"], [name="contact"]').forEach(f => f.addEventListener('input', () => { f.dataset.auto = '0'; }));
      const submit = m.querySelector('[data-modal-submit]');
      m.addEventListener('seg:change', e => {
        if (!e.target.matches('[data-brief-mode]')) return;
        submit.textContent = e.detail.value === 'invite' ? 'Отправить приглашение' : 'Готово';
      });
      m.addEventListener('modal:open', () => {
        const c = client(val(m, 'client'));
        if (c && c.brief) m.querySelector('[name="brief"]').value = c.brief;
        m.querySelectorAll('[data-auto]').forEach(f => { f.value = ''; });
        App.segment(m.querySelector('[data-brief-mode]'), 'link');
        submit.textContent = 'Готово';
        paint();
      });
    },
    onSubmit(m, d) {
      const invite = m.querySelector('[data-seg-panel="invite"]:not(.hidden)');
      d.toast = invite ? 'Бриф отправлен на ' + val(m, 'email') + (m.querySelector('[name="portal"]').checked ? ' · доступ в портал открыт' : '') : 'Ссылка на бриф сохранена в карточке клиента';
      emit('brief:sent', { client: label(m, 'client'), mode: invite ? 'invite' : 'link' });
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
  App.registerModal('employee', {
    title: 'Сотрудник', subtitle: 'Роль, отдел и норма часов', submit: 'Сохранить',
    body: () =>
      '<div class="flex items-center gap-3"><span data-emp-avatar class="w-11 h-11 rounded-full bg-zinc-900 text-white text-xs font-semibold flex items-center justify-center shrink-0"></span><div class="min-w-0"><div data-emp-name class="text-sm font-semibold"></div><div data-emp-mail class="text-xs text-zinc-500"></div></div></div>' +
      field('Роль', select('role', App.ROLES.map(r => option(r.id, r.label, { disabled: r.id === 'owner' })).join(''), 'data-can="change_roles" data-deny-tip="Менять роль может только владелец компании"'), { hint: 'Смена роли сразу меняет доступы человека' }) +
      grid(3,
        field('Отдел', select('dept', option('SEO', 'SEO') + option('Менеджеры', 'Менеджеры') + option('Контент', 'Контент') + option('—', 'Без отдела'))) +
        field('Часов в неделю', input('week', 'type="number" min="1" max="60" required'), { req: true }) +
        field('Ставка, ₽/ч', input('rate', 'type="number" min="0" step="100"'), { attrs: 'data-can="see_finance"' })) +
      field('Проекты', '<div data-emp-projects class="flex flex-wrap gap-1.5"></div>'),
    onOpen(m, opener) {
      const p = person(opener && opener.dataset.employee) || TEAM[1];
      m.querySelector('[data-emp-name]').textContent = p.name;
      const mail = opener && opener.querySelector('.text-xs');
      m.querySelector('[data-emp-mail]').textContent = (mail ? mail.textContent.trim() : p.id + '@romashka.ru') + ' · ' + roleLabel(p.role);
      m.querySelector('[data-emp-avatar]').textContent = p.name.split(' ').map(s => s[0]).join('');
      m.querySelector('[data-modal-title]').textContent = p.name;
      m.querySelector('[name="role"]').value = p.role;
      m.querySelector('[name="dept"]').value = p.dept;
      m.querySelector('[name="week"]').value = p.load.split('/')[1];
      m.querySelector('[name="rate"]').value = p.role === 'contractor' ? 1200 : 1800;
      m.querySelector('[data-emp-projects]').innerHTML = p.projects.length
        ? p.projects.map(id => '<span class="px-2.5 py-1 rounded-full bg-zinc-100 text-xs text-zinc-700">' + esc((PROJECTS.find(x => x.id === id) || {}).name) + '</span>').join('')
        : '<span class="text-xs text-zinc-500">Нет назначенных проектов</span>';
      m.dataset.employee = p.id;
    },
    onSubmit(m, d) { d.toast = 'Сохранено: ' + person(m.dataset.employee).name; }
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
      field('Источник цифр', select('source', option('manual', 'Ручной ввод') + option('metrika', 'Сверка с Яндекс.Метрикой') + option('crm', 'Данные клиента из CRM'))) +
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

  /* ---------- Добавить в команду проекта ---------- */
  App.registerModal('team-add', {
    title: 'Добавить в команду', subtitle: 'Интернет-магазин «Холод»', submit: 'Добавить', submitCan: 'edit_project',
    body: () =>
      field('Сотрудник', select('member', option('', 'Выберите') + teamOptions(p => ['dronov', 'vetrova', 'sidorov', 'kim'].indexOf(p.id) !== -1, null, true), 'required data-dep-source="member"'), { req: true }) +
      grid(2,
        field('Роль в проекте', select('as', option('exec', 'Исполнитель') + option('accept', 'Принимает работу') + option('watch', 'Наблюдатель'))) +
        field('Лимит часов в месяц', input('hours', 'type="number" min="1" value="20"'))) +
      '<div data-show-when="member:kim" class="hidden">' + field('Доступ до', input('until', 'type="date" value="2025-09-30"'), { hint: 'Подрядчик увидит только назначенные задачи проекта' }) + '</div>',
    onSubmit(m, d) {
      const p = person(val(m, 'member'));
      d.toast = p.name + ' добавлен(а) в команду · ' + label(m, 'as').toLowerCase();
      emit('team:added', { person: p, as: label(m, 'as'), role: roleLabel(p.role) });
    }
  });

  /* ---------- Интеграции компании ---------- */
  const SERVICES = { yandex: 'Яндекс (Метрика и Вебмастер)', google: 'Google Search Console', callibri: 'Callibri', amocrm: 'amoCRM' };
  App.registerModal('integration', {
    title: 'Подключить интеграцию', subtitle: 'Один аккаунт на компанию — счётчики привязываются в проектах', submit: 'Подключить', submitCan: 'int_seo',
    body: () =>
      field('Сервис', select('service', Object.keys(SERVICES).map(k => option(k, SERVICES[k])).join(''), 'required data-dep-source="svc"'), { req: true }) +
      '<div data-show-when="svc:yandex|google" class="space-y-4">' +
        note('Откроется окно входа сервиса. SEO Control запросит доступ только на чтение статистики.') +
        field('Аккаунт', input('account', 'type="email" required placeholder="seo@romashka.ru"'), { req: true }) + '</div>' +
      '<div data-show-when="svc:callibri|amocrm" class="hidden space-y-4">' +
        grid(2,
          field('Адрес аккаунта', input('domain', 'type="text" required placeholder="romashka.amocrm.ru"'), { req: true }) +
          field('API-ключ', input('token', 'type="password" required placeholder="••••••••••••"'), { req: true })) +
        '<div data-show-when="svc:amocrm" class="hidden">' + field('Воронка с лидами', select('pipeline', option('seo', 'SEO-заявки') + option('all', 'Все воронки'))) + '</div>' +
      '</div>',
    onOpen(m, opener) {
      const s = val(m, 'service');
      m.querySelector('[data-modal-title]').textContent = opener && opener.dataset.reconnect ? 'Переподключить · ' + SERVICES[s] : 'Подключить интеграцию';
      const sub = m.querySelector('[data-modal-submit]');
      sub.textContent = opener && opener.dataset.reconnect ? 'Переподключить' : 'Подключить';
    },
    onSubmit(m, d) { d.toast = SERVICES[val(m, 'service')] + ' — подключено'; }
  });

  /* ---------- Тариф ---------- */
  const PLANS = [
    { id: 'solo',     name: 'Solo',     base: 19,  per: 0,  note: 'До 3 проектов, 2 пользователя' },
    { id: 'agency',   name: 'Agency',   base: 49,  per: 15, note: 'Без лимита пользователей, портал клиента' },
    { id: 'business', name: 'Business', base: 149, per: 10, note: 'SSO, API, выделенный менеджер' }
  ];
  const ACTIVE = 5;
  App.registerModal('tariff', {
    title: 'Сменить тариф', subtitle: 'Сейчас: Agency · ' + ACTIVE + ' активных проектов', submit: 'Перейти на тариф', submitCan: 'billing',
    body: () =>
      '<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">' + PLANS.map(p =>
        '<label class="relative rounded-2xl border border-zinc-200 p-4 cursor-pointer hover:bg-zinc-50 has-[:checked]:border-accent has-[:checked]:ring-4 has-[:checked]:ring-accent/15 transition">' +
        '<input type="radio" name="plan" value="' + p.id + '"' + (p.id === 'agency' ? ' checked' : '') + ' class="sr-only">' +
        '<div class="text-sm font-semibold">' + p.name + '</div>' +
        '<div class="text-xl font-semibold tracking-tight mt-1 tabular-nums">$' + p.base + '<span class="text-xs font-normal text-zinc-500">/мес' + (p.per ? ' + $' + p.per + ' за проект' : '') + '</span></div>' +
        '<div class="text-xs text-zinc-500 mt-2">' + p.note + '</div></label>').join('') + '</div>' +
      field('Оплата', select('period', option('month', 'Помесячно') + option('year', 'За год — скидка 15%'))) +
      '<div data-tariff-total class="rounded-2xl bg-zinc-50 px-4 py-3 text-sm"></div>',
    init(m) {
      const paint = () => {
        const p = PLANS.find(x => x.id === (m.querySelector('[name="plan"]:checked') || {}).value) || PLANS[1];
        const year = val(m, 'period') === 'year';
        const sum = (p.base + p.per * ACTIVE) * (year ? 0.85 : 1);
        m.querySelector('[data-tariff-total]').innerHTML = 'Итого за ' + ACTIVE + ' проектов: <span class="font-semibold tabular-nums">$' + Math.round(sum) + '/мес</span>' + (year ? ' · $' + Math.round(sum * 12) + ' за год' : '') + (p.id === 'solo' ? '<div class="text-xs text-red-700 mt-1">На Solo доступно 3 проекта — два придётся архивировать</div>' : '');
      };
      m.addEventListener('change', paint);
      m.addEventListener('modal:open', () => setTimeout(paint));
    },
    onSubmit(m, d) {
      const p = PLANS.find(x => x.id === m.querySelector('[name="plan"]:checked').value);
      d.toast = p.id === 'agency' ? 'Вы уже на тарифе Agency' : 'Тариф изменится на ' + p.name + ' с 1-го числа';
    }
  });
})();
