<script setup lang="ts">
// Карточка участника компании (registerModal('employee') в assets/modals.js): загрузка, роль, отдел, норма, проекты.
import type { Role } from '@crm/access'
import { PROJECTS, TEAM } from '~/constants/directory'

const props = defineProps<{
  modelValue: boolean
  /** id участника (data-employee / data-user-id). */
  employee?: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [detail: { id: string; name: string; role: Role; roleLabel: string; roleShort: string; roleTone: string; dept: string }]
}>()

const { can } = useRole()
const notify = useNotify()
const { confirm } = useConfirm()

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const ROLE_BADGE: Record<Role, [string, string]> = {
  owner: ['Владелец компании', 'bg-zinc-900 text-white'],
  seo_head: ['Руководитель SEO', 'bg-blue-50 text-blue-700'],
  mgr_head: ['Руководитель менеджеров', 'bg-violet-50 text-violet-700'],
  account_manager: ['Менеджер проекта', 'bg-amber-50 text-amber-700'],
  seo_specialist: ['SEO-специалист', 'bg-emerald-50 text-emerald-700'],
  contractor: ['Подрядчик', 'bg-zinc-100 text-zinc-700'],
  client: ['Клиент', 'bg-cyan-50 text-cyan-700']
}
const ROLE_SHORT: Record<Role, string> = {
  owner: 'Owner', seo_head: 'SEO Head', mgr_head: 'Account Head', account_manager: 'PM',
  seo_specialist: 'Специалист', contractor: 'Подрядчик', client: 'Клиент'
}
const ROLE_OPTIONS = [
  { value: 'owner', label: 'Владелец компании (один на компанию)', disabled: true },
  { value: 'seo_head', label: 'Руководитель SEO' },
  { value: 'mgr_head', label: 'Руководитель менеджеров' },
  { value: 'account_manager', label: 'Менеджер проекта (PM)' },
  { value: 'seo_specialist', label: 'SEO-специалист' },
  { value: 'contractor', label: 'Подрядчик' },
  { value: 'client', label: 'Клиент' }
]
const DEPT_OPTIONS = [
  { value: 'SEO', label: 'SEO' },
  { value: 'Менеджеры', label: 'Менеджеры' },
  { value: 'Аккаунтинг', label: 'Аккаунтинг' },
  { value: 'Контент', label: 'Контент' },
  { value: '—', label: 'Без отдела' }
]

type Member = (typeof TEAM)[number]
const EXTRA_USERS: Record<string, Member> = {
  krylova: { id: 'krylova', name: 'Елена Крылова', role: 'client', dept: '—', load: '0/40', projects: ['medlife'] }
}
// Изменения карточки живут, пока открыта страница (как мутация TEAM в прототипе).
const members = useState<Record<string, Member>>('employee-modal-members', () => Object.fromEntries([...TEAM, ...Object.values(EXTRA_USERS)].map(p => [p.id, { ...p, projects: [...p.projects] }])))

const MONTH: Record<string, { spent: number; cap: number; phone: string; mail: string; tasks: [string, number][] }> = {
  sidorov: { spent: 116, cap: 160, phone: '+7 495 120-11-01', mail: 'ivan@seo.ru', tasks: [['Аудит семантики «Холод»', 40], ['План на июль «Ремонт+»', 36], ['Технический контроль «Стройтех»', 40]] },
  vetrova: { spent: 104, cap: 160, phone: '+7 495 120-11-02', mail: 'olga@seo.ru', tasks: [['Контент-план «МедЛайф»', 48], ['Правки мета «Холод»', 32], ['Бриф нового клиента', 24]] },
  morozov: { spent: 62, cap: 80, phone: '+7 495 120-11-03', mail: 'n.morozov@seo.ru', tasks: [['Согласование отчёта «Холод»', 28], ['Встреча с «Ремонт+»', 22], ['Передача на отпуск', 12]] },
  petrov: { spent: 176, cap: 160, phone: '+7 495 120-11-04', mail: 'alex@dev.ru', tasks: [['Индексация GSC «Холод»', 64], ['Ссылки «Ремонт+»', 58], ['Скорость «Стройтех»', 54]] },
  dronov: { spent: 108, cap: 160, phone: '+7 495 120-11-05', mail: 'ivan.d@seo.ru', tasks: [['Кластеризация «МедЛайф»', 42], ['Сниппеты «Холод»', 36], ['Мониторинг позиций', 30]] },
  kim: { spent: 56, cap: 80, phone: '+7 495 120-11-06', mail: 'maria@copy.ru', tasks: [['Тексты категорий «Холод»', 24], ['Описания услуг «Ремонт+»', 18], ['Правки по замечаниям', 14]] },
  krylova: { spent: 0, cap: 40, phone: '+7 383 200-10-20', mail: 'e.krylova@medlife.ru', tasks: [] },
  smirnov: { spent: 48, cap: 160, phone: '+7 495 120-11-00', mail: 'a.smirnov@romashka.ru', tasks: [['Стратегия агентства', 24], ['Тариф и биллинг', 12], ['Найм и роли', 12]] }
}

const p = computed<Member>(() => members.value[props.employee ?? ''] ?? members.value[TEAM[1]!.id]!)
const load = computed(() => MONTH[p.value.id] ?? { spent: 0, cap: 160, phone: '', mail: p.value.id + '@romashka.ru', tasks: [] })
const rate = computed(() => p.value.role === 'contractor' ? 1200 : p.value.role === 'client' ? 0 : 1800)
const initials = computed(() => p.value.name.split(' ').map(s => s[0]).join(''))
const barWidth = computed(() => Math.min(100, Math.round((load.value.spent / (load.value.cap || 1)) * 100)) + '%')
const isOwnerSeat = computed(() => p.value.role === 'owner')
const canChange = computed(() => can('users.assign_role'))
const projectNames = computed(() => p.value.projects.map(pid => PROJECTS.find(x => x.id === pid)?.name || pid))

const ROLE_TIP = 'Только владелец компании может менять роли сотрудников'
const BLOCK_TIP = 'Блокировка участников доступна только владельцу компании'

const form = ref({ role: 'seo_specialist' as Role, dept: 'SEO', week: '40', rate: '' })
watch(open, v => {
  if (!v) return
  const m = p.value
  form.value = {
    role: m.role,
    dept: m.dept === 'Менеджеры' ? 'Аккаунтинг' : m.dept,
    week: (m.load || '40/40').split('/')[1] || '40',
    rate: rate.value ? String(rate.value) : ''
  }
}, { immediate: true })

function submit() {
  const m = p.value
  const was = m.role
  if (m.role !== 'owner' && form.value.role && form.value.role !== 'owner') m.role = form.value.role
  m.dept = form.value.dept || m.dept
  if (m.load) m.load = (m.load.split('/')[0] || '0') + '/' + (form.value.week || '40')
  const badge = ROLE_BADGE[m.role]
  emit('saved', { id: m.id, name: m.name, role: m.role, roleLabel: badge[0], roleShort: ROLE_SHORT[m.role], roleTone: badge[1], dept: m.dept })
  open.value = false
  notify(m.role !== was ? `Роль пользователя ${m.name} изменена на «${badge[0]}»` : `Сохранено: ${m.name}`)
}

async function block() {
  open.value = false
  await confirm({ title: 'Заблокировать участника?', text: 'Это действие необратимо. Связанные данные будут удалены или переведены в архив.', ok: 'Подтвердить', toast: 'Участник заблокирован' })
}
</script>

<template>
  <UiSheet v-model="open" :title="p.name" subtitle="Карточка участника компании" submit="Сохранить" manual @submit="submit">
    <div class="flex items-center gap-3">
      <span class="w-11 h-11 rounded-full bg-zinc-900 text-white text-xs font-semibold flex items-center justify-center shrink-0">{{ initials }}</span>
      <div class="min-w-0">
        <div class="text-sm font-semibold">{{ p.name }}</div>
        <div class="text-xs text-zinc-500">{{ load.mail }}</div>
        <div class="text-xs text-zinc-500">{{ load.phone }}</div>
      </div>
    </div>
    <div class="rounded-2xl bg-canvas p-4">
      <div class="flex items-center justify-between gap-3 text-xs"><span class="text-zinc-500">Загрузка · июнь</span><span class="font-medium tabular-nums">{{ load.spent }} / {{ load.cap }} ч</span></div>
      <div class="mt-2 h-1.5 rounded-full bg-white overflow-hidden" role="progressbar" aria-label="Загрузка за месяц">
        <div class="h-full rounded-full" :class="load.spent > load.cap ? 'bg-red-500' : 'bg-emerald-500'" :style="{ width: barWidth }" />
      </div>
      <div v-if="can('finance.cost.view')" class="mt-2 text-xs text-zinc-500">Ставка <span class="font-medium text-zinc-900 tabular-nums">{{ rate ? rate.toLocaleString('ru-RU') + ' ₽/ч' : '—' }}</span></div>
      <div class="mt-3 text-xs font-medium text-zinc-500">Задачи месяца</div>
      <ul class="mt-1.5 space-y-1.5">
        <li v-for="t in load.tasks" :key="t[0]" class="flex items-center justify-between gap-3 text-sm"><span class="min-w-0 truncate">{{ t[0] }}</span><span class="text-xs text-zinc-500 tabular-nums shrink-0">{{ t[1] }} ч</span></li>
        <li v-if="!load.tasks.length" class="text-xs text-zinc-500">Нет активных задач</li>
      </ul>
    </div>
    <div class="mb-0">
      <label class="block text-xs font-medium text-zinc-500 mb-2">Роль в компании</label>
      <AccessGate v-if="isOwnerSeat" :allowed="false" tip="Владелец компании один" block>
        <USelect v-model="form.role" :options="ROLE_OPTIONS" disabled class="w-full" />
      </AccessGate>
      <AccessGate v-else :allowed="canChange" :tip="ROLE_TIP" block>
        <USelect v-model="form.role" :options="ROLE_OPTIONS" :disabled="!canChange" :data-deny-tip="canChange ? undefined : ROLE_TIP" class="w-full" />
      </AccessGate>
      <p class="text-[11px] text-zinc-400 mt-1">{{ isOwnerSeat ? 'Владелец компании один — роль изменить нельзя.' : 'Роль определяет доступ к разделам, финансам и клиентским отчётам.' }}</p>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <UiField label="Отдел"><USelect v-model="form.dept" :options="DEPT_OPTIONS" /></UiField>
      <UiField label="Часов в неделю" req><UInput v-model="form.week" type="number" min="1" max="60" required /></UiField>
      <UiField v-if="can('finance.cost.view')" label="Ставка, ₽/ч"><UInput v-model="form.rate" type="number" min="0" step="100" /></UiField>
    </div>
    <UiField label="Проекты">
      <div class="flex flex-wrap gap-1.5">
        <span v-for="n in projectNames" :key="n" class="px-2.5 py-1 rounded-full bg-zinc-100 text-xs text-zinc-700">{{ n }}</span>
        <span v-if="!projectNames.length" class="text-xs text-zinc-500">Нет назначенных проектов</span>
      </div>
    </UiField>
    <div class="pt-2 border-t border-zinc-100 flex justify-end">
      <AccessGate :allowed="canChange" :tip="BLOCK_TIP">
        <button type="button" :disabled="!canChange" :data-deny-tip="canChange ? undefined : BLOCK_TIP" class="h-9 px-4 rounded-full bg-white border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed" @click="block">Заблокировать</button>
      </AccessGate>
    </div>
  </UiSheet>
</template>
