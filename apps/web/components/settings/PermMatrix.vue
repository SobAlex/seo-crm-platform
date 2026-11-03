<script setup lang="ts">
// Матрица разрешений ([data-perm-matrix], renderMatrix() в assets/app.js) из @crm/access:
// каждое действие × 7 ролей; workspace — зелёная точка, ограниченный scope — янтарная подпись, deny — «—».
import { ACTIONS, ROLES, ROLE_INFO, SCOPE_DESCRIPTION, scopeOf, type Action, type Role, type Scope } from '@crm/access'

const { role, isLead } = useRole()

const LABEL: Record<Action, string> = {
  'dashboard.view': 'Главная: сводка, лента и очередь приёмки',
  'company.profile.manage': 'Профиль: название, ИНН, адрес, логотип',
  'company.billing.manage': 'Тариф, счета и смена тарифа',
  'company.delete': 'Удаление компании',
  'users.invite': 'Пригласить сотрудника, подрядчика или клиента',
  'users.deactivate': 'Отключить доступ человека',
  'users.assign_role': 'Менять роль человека',
  'directory.view': 'Справочник сотрудников и загрузка',
  'templates.manage': 'Типы проектов, шаблоны карт и планов месяца',
  'workflows.manage': 'Процессы и статусы задач',
  'integrations.manage': 'Подключить Метрику, Вебмастер, GSC, коллтрекинг и CRM',
  'project.sources.link': 'Привязать или отвязать счётчик проекта',
  'metrics.view': 'Смотреть уже подтянутые метрики',
  'client.view': 'Смотреть клиентов',
  'client.manage': 'Создать и редактировать клиента',
  'project.create': 'Создать проект',
  'project.view': 'Смотреть проект',
  'project.update': 'Редактировать проект, карту и план месяца',
  'project.apply_template': 'Применить шаблон к проекту',
  'project.archive': 'Архивировать проект',
  'project.delete': 'Удалить проект',
  'project.assign_team': 'Назначать и убирать команду, передать проект',
  'task.create': 'Задача из карты, свободная и подзадача',
  'task.view': 'Внутренние задачи',
  'task.update': 'Вести назначенную задачу',
  'task.delete': 'Удалить задачу',
  'task.assign': 'Назначить исполнителя и соисполнителя',
  'task.review': 'Принять задачу или вернуть на доработку',
  'comment.internal.write': 'Внутренний комментарий',
  'comment.client.write': 'Комментарий для клиента',
  'time.log': 'Вести свои часы',
  'time.view': 'Смотреть часы',
  'time.approve': 'Править и утверждать чужие часы',
  'finance.fee.view': 'Видеть чек проекта',
  'finance.cost.view': 'Видеть ставку и маржу',
  'finance.payout.manage': 'Начислять выплаты исполнителям',
  'finance.payout.view': 'Смотреть выплаты',
  'report.view': 'Смотреть отчёты',
  'report.draft': 'Составлять отчёт',
  'report.review': 'Проверить отчёт перед отправкой',
  'report.publish': 'Отправить отчёт клиенту',
  'brief.manage': 'Отправить и вести бриф',
  'brief.respond': 'Заполнить бриф',
  'portal.view': 'Свой проект без редактирования',
  'portal.preview': 'Предпросмотр портала клиента',
  'portal.request.create': 'Запрос клиенту из портала',
  'portal.request.respond': 'Ответить на запрос агентства',
  'audit.run': 'Запустить аудит сайта',
  'audit.view': 'Смотреть результаты аудита',
  'audit.apply': 'Превратить находки аудита в задачи'
}

const GROUP_DEF: { title: string; prefixes: string[] }[] = [
  { title: 'Компания', prefixes: ['company.', 'users.assign_role'] },
  { title: 'Люди', prefixes: ['users.', 'directory.'] },
  { title: 'Шаблоны', prefixes: ['templates.', 'workflows.'] },
  { title: 'Интеграции', prefixes: ['integrations.', 'project.sources.', 'metrics.'] },
  { title: 'Проекты и клиенты', prefixes: ['dashboard.', 'client.', 'project.'] },
  { title: 'Задачи', prefixes: ['task.', 'comment.'] },
  { title: 'Отчёты', prefixes: ['report.'] },
  { title: 'Деньги и часы', prefixes: ['time.', 'finance.'] },
  { title: 'Брифы и портал', prefixes: ['brief.', 'portal.'] },
  { title: 'Аудит', prefixes: ['audit.'] }
]

const GROUPS = (() => {
  const used = new Set<Action>()
  const out = GROUP_DEF.map(g => {
    const items = ACTIONS.filter(a => !used.has(a) && g.prefixes.some(p => a === p || a.startsWith(p)))
    items.forEach(a => used.add(a))
    return { title: g.title, items }
  })
  const rest = ACTIONS.filter(a => !used.has(a))
  if (rest.length) out.push({ title: 'Прочее', items: rest })
  return out.filter(g => g.items.length)
})()

const SHORT: Record<Exclude<Scope, 'workspace' | 'deny'>, string> = {
  member: 'команда',
  assigned: 'назнач.',
  setter: 'постан.',
  self: 'автор',
  portal: 'портал'
}

const mark = (r: Role, a: Action) => scopeOf(r, a)

const pick = ref<Role>(role.value)
const roleOptions = ROLES.map(r => ({ value: r, label: ROLE_INFO[r].name }))
const LEGEND_TEXT: Record<keyof typeof SHORT, string> = {
  member: 'проекты своей команды',
  assigned: 'назначенные ему задачи',
  setter: 'поставленные им задачи',
  self: 'свои записи',
  portal: 'свой проект в портале'
}
const LEGEND = (Object.keys(SHORT) as (keyof typeof SHORT)[]).map(k => ({ key: k, label: SHORT[k], text: LEGEND_TEXT[k], tip: SCOPE_DESCRIPTION[k] }))
</script>

<template>
  <div class="mb-6 space-y-3">
    <div class="md:hidden">
      <label for="matrix-role" class="block text-xs font-medium text-zinc-500 mb-2">Роль</label>
      <USelect id="matrix-role" v-model="pick" :options="roleOptions" size="md" class="mb-4" :disabled="!isLead" />
      <div class="flex flex-col gap-4">
        <section v-for="g in GROUPS" :key="g.title" class="rounded-2xl bg-white shadow-card overflow-hidden">
          <h3 class="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 bg-zinc-50/70">{{ g.title }}</h3>
          <ul class="divide-y divide-zinc-100">
            <li v-for="a in g.items" :key="a" class="px-4 py-3 flex items-center justify-between gap-3 text-sm">
              <span class="min-w-0">{{ LABEL[a] }}</span>
              <span class="shrink-0 w-14 text-center"><SettingsScopeMark :scope="mark(pick, a)" :short="SHORT" /></span>
            </li>
          </ul>
        </section>
      </div>
    </div>

    <div class="hidden md:block rounded-2xl bg-white shadow-card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full min-w-[820px]">
          <thead>
            <tr class="border-b border-black/5">
              <th scope="col" class="px-4 lg:px-6 py-3 text-left text-xs font-medium text-zinc-500">Действие</th>
              <th v-for="r in ROLES" :key="r" scope="col" class="px-2 py-3 text-center text-[11px] font-medium text-zinc-500 leading-tight w-24" :class="r === role && 'text-zinc-900'">{{ ROLE_INFO[r].name }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100">
            <template v-for="g in GROUPS" :key="g.title">
              <tr><th scope="rowgroup" colspan="8" class="px-4 lg:px-6 pt-5 pb-2 text-left text-[11px] font-semibold uppercase tracking-wide text-zinc-500 bg-zinc-50/70">{{ g.title }}</th></tr>
              <tr v-for="a in g.items" :key="a" class="hover:bg-zinc-50/60 transition">
                <th scope="row" class="px-4 lg:px-6 py-3 text-left text-sm font-normal" :title="a">{{ LABEL[a] }}</th>
                <td v-for="r in ROLES" :key="r" class="px-2 py-3 text-center"><SettingsScopeMark :scope="mark(r, a)" :short="SHORT" /></td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>

    <p class="text-xs text-zinc-500 flex flex-wrap items-center gap-x-4 gap-y-1">
      <span class="inline-flex items-center gap-1.5"><span class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" />вся компания</span>
      <span v-for="l in LEGEND" :key="l.key" class="inline-flex items-center gap-1.5" :title="l.tip"><span class="font-medium text-amber-700">{{ l.label }}</span>{{ l.text }}</span>
      <span class="inline-flex items-center gap-1.5"><span class="text-zinc-300">—</span>запрещено</span>
    </p>
  </div>
</template>
