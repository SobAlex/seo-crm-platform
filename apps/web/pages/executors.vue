<script setup lang="ts">
// executors.html → Сетка 1 (Registry): вкладки «Список / Загрузка по неделям», фильтр по роли и поиск, отпуска, команда.
import type { Role } from '@crm/access'
import { PROJECTS, TEAM } from '~/constants/directory'

definePageMeta({ roles: ['owner', 'seo_head', 'mgr_head', 'pm', 'employee'] })
useHead({ title: 'Сотрудники — SEO Control' })

const { can, hasRole } = useRole()

interface Member {
  id: string
  initials: string
  avatar: string
  name: string
  email: string
  sub: string
  badge: { label: string; title: string; cls: string }
  dept: string
  projects: number
  active: number
  load: { hours: number; pct: number; cap: number; over?: boolean; note?: string }
  done: number
}

const AVATAR = 'bg-zinc-900 text-white'
const members = ref<Member[]>([
  { id: 'sidorov', initials: 'ИС', avatar: AVATAR, name: 'Иван Сидоров', email: 'ivan@seo.ru', sub: 'Руководитель SEO', badge: { label: 'SEO Head', title: 'Руководитель SEO', cls: 'bg-blue-50 text-blue-700 ring-blue-100' }, dept: 'SEO', projects: 3, active: 2, load: { hours: 116, pct: 72, cap: 160 }, done: 48 },
  { id: 'vetrova', initials: 'ОВ', avatar: AVATAR, name: 'Ольга Ветрова', email: 'olga@seo.ru', sub: 'Руководитель менеджеров', badge: { label: 'Account Head', title: 'Руководитель менеджеров', cls: 'bg-violet-50 text-violet-700 ring-violet-100' }, dept: 'Аккаунтинг', projects: 2, active: 1, load: { hours: 104, pct: 65, cap: 160 }, done: 32 },
  { id: 'morozov', initials: 'НМ', avatar: AVATAR, name: 'Никита Морозов', email: 'n.morozov@seo.ru', sub: 'Менеджер проекта', badge: { label: 'PM', title: 'Менеджер проекта', cls: 'bg-amber-50 text-amber-700 ring-amber-100' }, dept: 'Аккаунтинг', projects: 3, active: 2, load: { hours: 62, pct: 78, cap: 80, note: 'отпуск 16–29.06' }, done: 24 },
  { id: 'petrov', initials: 'АП', avatar: AVATAR, name: 'Алексей Петров', email: 'alex@dev.ru', sub: 'SEO-специалист', badge: { label: 'Специалист', title: 'SEO-специалист', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-100' }, dept: 'SEO', projects: 4, active: 5, load: { hours: 176, pct: 110, cap: 160, over: true, note: 'перегруз +16 ч' }, done: 67 },
  { id: 'dronov', initials: 'ИД', avatar: AVATAR, name: 'Иван Дронов', email: 'ivan.d@seo.ru', sub: 'SEO-специалист', badge: { label: 'Специалист', title: 'SEO-специалист', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-100' }, dept: 'SEO', projects: 2, active: 3, load: { hours: 108, pct: 68, cap: 160 }, done: 41 },
  { id: 'kim', initials: 'МК', avatar: 'bg-zinc-200 text-zinc-500', name: 'Мария Ким', email: 'maria@copy.ru', sub: 'Подрядчик', badge: { label: 'Подрядчик', title: 'Подрядчик', cls: 'bg-zinc-100 text-zinc-700 ring-zinc-200' }, dept: '—', projects: 3, active: 4, load: { hours: 56, pct: 70, cap: 80, note: 'подрядчик · 20 ч/нед' }, done: 53 }
])

const WEEKS = ['02–08.06', '09–15.06', '16–22.06', '23–29.06']
const OK = 'bg-emerald-50 text-emerald-700'
const WARN = 'bg-amber-50 text-amber-700'
const OVER = 'bg-red-50 text-red-700'
const OFF = 'bg-zinc-100 text-zinc-500'
const WEEKLY = [
  { initials: 'ИС', name: 'Иван Сидоров', sub: 'Руководитель SEO · 40 ч в неделю', weeks: [['22/40', OK], ['30/40', OK], ['36/40', WARN], ['28/40', OK]] },
  { initials: 'АП', name: 'Алексей Петров', sub: 'SEO-специалист · 40 ч в неделю', weeks: [['42/40', OVER], ['44/40', OVER], ['46/40', OVER], ['44/40', OVER]] },
  { initials: 'ИД', name: 'Иван Дронов', sub: 'SEO-специалист · 40 ч в неделю', weeks: [['24/40', OK], ['28/40', OK], ['30/40', OK], ['26/40', OK]] },
  { initials: 'НМ', name: 'Никита Морозов', sub: 'Менеджер проекта · 40 ч в неделю', weeks: [['30/40', OK], ['32/40', OK], ['отпуск', OFF], ['отпуск', OFF]] },
  { initials: 'МК', name: 'Мария Ким', sub: 'Подрядчик · 20 ч в неделю', weeks: [['12/20', OK], ['16/20', OK], ['20/20', WARN], ['8/20', OK]] }
] as const

// Тулбар: вкладка, роль, поиск (filterTeam — по тексту строки).
const tab = ref('list')
const tabOptions = [{ value: 'list', label: 'Список' }, { value: 'load', label: 'Загрузка по неделям' }]
const roleFilter = ref('')
const roleOptions = [
  { value: '', label: 'Все роли' },
  ...['Руководитель SEO', 'Руководитель менеджеров', 'Менеджер проекта', 'SEO-специалист', 'Подрядчик'].map(v => ({ value: v, label: v }))
]
const q = ref('')
const shown = (text: string) => {
  const needle = q.value.trim().toLowerCase()
  return !(needle && !text.toLowerCase().includes(needle)) && !(roleFilter.value && !text.includes(roleFilter.value))
}
const memberText = (m: Member) => [m.name, m.sub, m.badge.label, m.dept, m.projects, m.active, `${m.load.hours} ч ${m.load.pct}% из ${m.load.cap} ч/мес`, m.load.note ?? '', m.done, 'Изменить роль'].join(' ')
const visibleMembers = computed(() => members.value.filter(m => shown(memberText(m))))
const visibleWeekly = computed(() => WEEKLY.filter(w => shown([w.name, w.sub, ...w.weeks.map(x => x[0])].join(' '))))

// Карточка сотрудника.
const employeeOpen = ref(false)
const employeeId = ref<string>()
function openEmployee(id: string) {
  employeeId.value = id
  employeeOpen.value = true
}
function onRowClick(e: MouseEvent, id: string) {
  if ((e.target as HTMLElement).closest('a, button, input, select')) return
  openEmployee(id)
}
const RING: Record<Role, string> = {
  owner: 'ring-zinc-800', seo_head: 'ring-blue-100', mgr_head: 'ring-violet-100',
  account_manager: 'ring-amber-100', seo_specialist: 'ring-emerald-100', contractor: 'ring-zinc-200', client: 'ring-cyan-100'
}
function onEmployeeSaved(d: { id: string; role: Role; roleLabel: string; roleShort: string; roleTone: string; dept: string }) {
  const m = members.value.find(x => x.id === d.id)
  if (!m) return
  m.badge = { label: d.roleShort || d.roleLabel, title: d.roleLabel, cls: `${d.roleTone || 'bg-zinc-100 text-zinc-700'} ${RING[d.role] || 'ring-zinc-200'}` }
  m.sub = d.roleLabel
  m.dept = d.dept
}

// Отпуска.
interface VacationRow { employee: string; name: string; text: string; from: string; to: string; substitute: string; fresh?: boolean }
const vacations = ref<VacationRow[]>([
  { employee: 'petrov', name: 'Алексей Петров', text: '14–28 июля · проекты «Холод» и «Ремонт+» · замещает Никита Морозов', from: '2025-07-14', to: '2025-07-28', substitute: 'morozov' }
])
const vacationOpen = ref(false)
const vacationPrefill = ref<{ employee?: string; from?: string; to?: string; substitute?: string }>()
function openVacation(v?: VacationRow) {
  vacationPrefill.value = v ? { employee: v.employee, from: v.from, to: v.to, substitute: v.substitute } : undefined
  vacationOpen.value = true
}
function onVacationSaved(d: { employee: (typeof TEAM)[number]; substitute: (typeof TEAM)[number]; from: string; to: string; projects: string[] }) {
  const names = d.projects
    .map(id => PROJECTS.find(p => p.id === id)?.name)
    .filter((n): n is string => !!n)
    .map(n => n.replace(/^.*?(«.*»)$/, '$1'))
  const text = `${d.from}–${d.to}${names.length ? ' · проекты ' + names.join(', ') : ''} · замещает ${d.substitute.name}`
  const iso = (s: string) => `2025-${s.split('.')[1]}-${s.split('.')[0]}`
  const row = vacations.value.find(r => r.name === d.employee.name)
  const next = { employee: d.employee.id, name: d.employee.name, text, from: iso(d.from), to: iso(d.to), substitute: d.substitute.id, fresh: true }
  if (row) Object.assign(row, next)
  else vacations.value.push(next)
}

const inviteOpen = ref(false)

const TD = 'md:px-3 md:py-3 lg:py-4 min-w-0 before:block before:text-[11px] before:text-zinc-500 before:mb-0.5 before:content-[attr(data-label)] md:before:hidden'
const ROLE_TIP = 'Смена ролей доступна только владельцу компании'
</script>

<template>
  <PageRegistry title="Сотрудники">
    <template #actions>
      <AccessGate :allowed="can('users.invite')" :tip="TIP_SYSTEM">
        <UButton :disabled="!can('users.invite')" :data-deny-tip="can('users.invite') ? undefined : TIP_SYSTEM" @click="inviteOpen = true">
          <span class="sm:hidden">+ Пригласить</span><span class="hidden sm:inline">+ Пригласить сотрудника</span>
        </UButton>
      </AccessGate>
    </template>

    <template #focus>
      <UiSegmented v-model="tab" :options="tabOptions" hash aria-label="Представление" />
    </template>

    <template #filters>
      <USelect v-model="roleFilter" :options="roleOptions" size="xs" aria-label="Роль" class="w-full sm:w-auto sm:ml-auto" />
      <UInput
        v-model="q"
        type="search"
        size="xs"
        placeholder="Поиск"
        aria-label="Поиск сотрудников"
        icon="i-heroicons-magnifying-glass-20-solid"
        class="w-full sm:w-64 shrink-0"
      />
    </template>

    <section class="w-full bg-white rounded-2xl shadow-card p-4 lg:p-6 space-y-4">
      <div class="flex items-center justify-between gap-3">
        <h3 class="text-sm font-semibold tracking-tight">Отпуск сотрудников</h3>
        <button type="button" class="h-9 px-4 rounded-full bg-white border border-zinc-200 text-xs font-medium hover:bg-zinc-50 transition shrink-0" @click="openVacation()">Оформить отпуск</button>
      </div>
      <div class="w-full space-y-2.5">
        <div
          v-for="v in vacations"
          :key="v.employee"
          class="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          :class="v.fresh && 'ring-2 ring-accent/20'"
        >
          <div>
            <div class="text-sm font-medium">{{ v.name }}</div>
            <div class="text-xs text-zinc-500 mt-0.5">{{ v.text }}</div>
          </div>
          <div class="flex flex-wrap gap-2">
            <button v-if="hasRole(['owner', 'seo_head', 'mgr_head'])" type="button" class="px-3.5 py-1.5 rounded-full bg-white border border-zinc-200 text-sm font-medium hover:bg-zinc-50 transition" @click="openVacation(v)">Изменить</button>
            <UButton v-if="hasRole(['employee'])" @click="openVacation(v)">Кому передать</UButton>
          </div>
        </div>
      </div>
    </section>

    <div v-show="tab === 'list'">
      <section class="bg-white rounded-2xl shadow-card overflow-hidden">
        <div class="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 max-w-full">
          <table class="w-full block md:table">
            <thead class="hidden md:table-header-group">
              <tr class="border-b border-zinc-100">
                <th class="text-left text-xs font-medium text-zinc-500 whitespace-nowrap px-4 lg:px-6 py-3">Сотрудник</th>
                <th class="text-left text-xs font-medium text-zinc-500 whitespace-nowrap px-3 py-3">Роль</th>
                <th class="text-left text-xs font-medium text-zinc-500 whitespace-nowrap px-3 py-3">Отдел</th>
                <th class="text-right text-xs font-medium text-zinc-500 whitespace-nowrap px-3 py-3">Проектов</th>
                <th class="text-right text-xs font-medium text-zinc-500 whitespace-nowrap px-3 py-3">В работе</th>
                <th class="text-left text-xs font-medium text-zinc-500 whitespace-nowrap px-3 py-3">Загрузка · июнь</th>
                <th class="text-right text-xs font-medium text-zinc-500 whitespace-nowrap px-3 py-3">Готово</th>
                <th class="px-4 lg:px-6 py-3 whitespace-nowrap" />
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100 block md:table-row-group">
              <tr
                v-for="m in visibleMembers"
                :key="m.id"
                class="hover:bg-zinc-50/50 transition grid grid-cols-2 gap-x-4 gap-y-3 p-4 md:p-0 md:table-row align-top cursor-pointer"
                @click="onRowClick($event, m.id)"
              >
                <td class="md:px-4 lg:px-6 md:py-3 lg:py-4 col-span-2 md:col-span-1">
                  <button type="button" class="flex items-center gap-3 group text-left" @click="openEmployee(m.id)">
                    <span class="w-9 h-9 rounded-full text-[11px] font-semibold flex items-center justify-center shrink-0" :class="m.avatar">{{ m.initials }}</span>
                    <div>
                      <div class="text-sm font-semibold group-hover:underline">{{ m.name }}</div>
                      <div class="text-xs text-zinc-500 mt-0.5" :title="m.email">{{ m.sub }}</div>
                    </div>
                  </button>
                </td>
                <td data-label="Роль" :class="TD">
                  <span :title="m.badge.title" class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ring-1" :class="m.badge.cls">{{ m.badge.label }}</span>
                </td>
                <td data-label="Отдел" :class="[TD, 'text-sm text-zinc-500']">{{ m.dept }}</td>
                <td data-label="Проектов" :class="[TD, 'md:text-right text-sm tabular-nums']">{{ m.projects }}</td>
                <td data-label="В работе" :class="[TD, 'md:text-right text-sm tabular-nums']">{{ m.active }}</td>
                <td data-label="Загрузка" :class="[TD, 'text-sm']"><ExecutorsLoadCell v-bind="m.load" /></td>
                <td data-label="Готово" :class="[TD, 'md:text-right text-sm tabular-nums']">{{ m.done }}</td>
                <td class="md:px-4 lg:px-6 md:py-3 lg:py-4 md:text-right col-span-2 md:col-span-1">
                  <AccessGate :allowed="can('users.assign_role')" :tip="ROLE_TIP">
                    <UButton color="white" size="xs" class="rounded-full shadow-none border-zinc-200 text-zinc-700" :disabled="!can('users.assign_role')" :data-deny-tip="can('users.assign_role') ? undefined : ROLE_TIP" @click="openEmployee(m.id)">Изменить роль</UButton>
                  </AccessGate>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <div v-show="tab === 'load'">
      <section class="bg-white rounded-2xl shadow-card overflow-hidden">
        <div class="px-4 lg:px-6 py-4">
          <h3 class="text-sm font-semibold tracking-tight">Загрузка по неделям</h3>
        </div>
        <div class="hidden lg:grid grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] gap-6 px-6 py-2.5 border-t border-zinc-100 text-xs font-medium text-zinc-500">
          <div>Сотрудник</div>
          <div class="grid grid-cols-4 gap-2 text-center"><div v-for="w in WEEKS" :key="w">{{ w }}</div></div>
        </div>
        <div class="grid grid-cols-4 gap-2 px-4 pb-2 pt-1 border-t border-zinc-100 text-center text-[11px] font-medium text-zinc-500 lg:hidden"><div v-for="w in WEEKS" :key="w" class="pt-2">{{ w }}</div></div>
        <ul class="divide-y divide-zinc-100 border-t border-zinc-100">
          <li v-for="p in visibleWeekly" :key="p.name" class="px-4 lg:px-6 py-4 grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)] gap-3 lg:gap-6 lg:items-center">
            <div class="flex items-center gap-3 min-w-0">
              <span class="w-9 h-9 rounded-full bg-zinc-900 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">{{ p.initials }}</span>
              <div class="min-w-0"><div class="text-sm font-medium truncate">{{ p.name }}</div><div class="text-xs text-zinc-500">{{ p.sub }}</div></div>
            </div>
            <div class="grid grid-cols-4 gap-2">
              <div v-for="(w, i) in p.weeks" :key="i" class="rounded-xl px-1 py-2 text-center text-xs font-medium tabular-nums" :class="w[1]">{{ w[0] }}</div>
            </div>
          </li>
        </ul>
      </section>
    </div>

    <ModalsEmployee v-model="employeeOpen" :employee="employeeId" @saved="onEmployeeSaved" />
    <ModalsInvite v-model="inviteOpen" />
    <ModalsVacation v-model="vacationOpen" :prefill="vacationPrefill" @saved="onVacationSaved" />
  </PageRegistry>
</template>
