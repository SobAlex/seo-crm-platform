<script setup lang="ts">
// settings.html → Сетка 1 (Registry): табы Общие / Интеграции / Роли и доступ / Биллинг (#hash), окна интеграций и оплаты.
import { INT_DEFAULT, INT_STORE, SERVICES, useCompanyIntegrations, type BillingPaid, type IntegrationRow, type PlanId, type ServiceId } from '~/types/settings'

definePageMeta({ roles: ['owner', 'seo_head', 'mgr_head', 'pm', 'employee'] })
useHead({ title: 'Настройки компании — SEO Control' })

const { can, hasRole } = useRole()
const notify = useNotify()
const { confirm } = useConfirm()

const profileOk = computed(() => can('company.profile.manage'))
const intOk = computed(() => can('integrations.manage'))
const billingOk = computed(() => can('company.billing.manage'))
const BILLING_TIP = 'Тариф и счета доступны только владельцу компании'

// Табы: недоступный роли таб остаётся, но выключен с подсказкой; открывается первый доступный.
const tabOptions = computed(() => [
  { value: 'general', label: 'Общие', disabled: !profileOk.value, tip: TIP_SYSTEM },
  { value: 'integrations', label: 'Интеграции', disabled: !intOk.value, tip: TIP_SYSTEM },
  { value: 'roles', label: 'Роли и доступ', disabled: !hasRole(['owner', 'seo_head', 'mgr_head']), tip: TIP_SYSTEM },
  { value: 'billing', label: 'Биллинг', disabled: !billingOk.value, tip: TIP_SYSTEM }
])
const tab = ref(tabOptions.value.find(o => !o.disabled)?.value ?? 'general')

// Общие
const company = ref({
  name: 'Ромашка Digital',
  inn: '7701234567',
  city: 'Москва',
  email: 'hello@romashka.ru',
  address: '',
  title: 'SEO Control — кабинет агентства «Ромашка Digital»',
  description: 'Проекты, задачи, приёмка и отчёты клиенту в одном кабинете.',
  social: 'Ромашка Digital ведёт SEO в SEO Control: видно, что принять и что горит.'
})
const logoInput = ref<HTMLInputElement | null>(null)
function onLogo(e: Event) {
  const input = e.target as HTMLInputElement
  const f = input.files?.[0]
  if (!f) return
  notify('Файл «' + f.name + '» прикреплён')
  input.value = ''
}

// Интеграции
const integrations = useCompanyIntegrations()
const SEO_TIP = 'SEO-интеграции доступны владельцу и руководителю SEO'
const CRM_TIP = 'CRM и телефония доступны владельцу и руководителю менеджеров'
const CARDS: { id: ServiceId; title: string; sub: string; roles: string[]; tip: string }[] = [
  { id: 'yandex', title: 'Яндекс', sub: 'Метрика и Вебмастер', roles: ['owner', 'seo_head'], tip: SEO_TIP },
  { id: 'google', title: 'Google Search Console', sub: 'Показы, клики и индексация', roles: ['owner', 'seo_head'], tip: SEO_TIP },
  { id: 'callibri', title: 'Callibri', sub: 'Коллтрекинг', roles: ['owner', 'mgr_head'], tip: CRM_TIP },
  { id: 'amocrm', title: 'amoCRM', sub: 'Лиды из CRM', roles: ['owner', 'mgr_head'], tip: CRM_TIP }
]

const wizardOpen = ref(false)
const oauthOpen = ref(false)
const oauthService = ref<ServiceId>('yandex')
function connect(id: ServiceId) {
  oauthService.value = id
  oauthOpen.value = true
}
async function disconnect(id: ServiceId) {
  const title = CARDS.find(c => c.id === id)!.title
  const ok = await confirm({
    title: `Отключить ${title}?`,
    text: 'Метрики перестанут обновляться автоматически, проекты перейдут на ручной ввод факта.',
    ok: 'Отключить',
    toast: `${title} отключён`
  })
  if (ok) integrations.value = { ...integrations.value, [id]: { status: 'off', account: '', projects: 0 } }
}

onMounted(() => {
  try {
    const raw = JSON.parse(localStorage.getItem(INT_STORE) || 'null') as Partial<Record<ServiceId, IntegrationRow>> | null
    if (raw) integrations.value = { ...INT_DEFAULT, ...raw }
  } catch { /* битое хранилище — остаются значения по умолчанию */ }
  watch(integrations, v => {
    try { localStorage.setItem(INT_STORE, JSON.stringify(v)) } catch { /* file:// или приватный режим */ }
  }, { deep: true })
  void loadBilling()
})

// Биллинг
const PLAN_CARDS = computed(() => [
  { id: 'start' as PlanId, name: 'Старт', sub: 'Небольшие команды', price: '1 900', features: ['До 3 проектов', 'До 3 сотрудников', 'Задачи, приёмка и отчёты'], current: billing.value?.plan === 'START' },
  { id: 'pro' as PlanId, name: 'Про', sub: 'Хит', price: '4 900', features: ['До 15 проектов · 10 сотрудников', 'Автоматический съём позиций', 'Портал клиентов и отчёты'], current: billing.value?.plan === 'PRO' },
  { id: 'ent' as PlanId, name: 'Агентство', sub: 'Сети и in-house', price: '9 900', features: ['Безлимит проектов и команды', 'Приоритетная поддержка', 'Портал клиентов'], current: billing.value?.plan === 'AGENCY' }
])

const checkoutOpen = ref(false)
const tariffOpen = ref(false)
const tariffPlan = ref<PlanId>('pro')
function openTariff(plan: PlanId = 'pro') {
  tariffPlan.value = plan
  tariffOpen.value = true
}

const autoRenew = ref(true)
function toggleRenew() {
  autoRenew.value = !autoRenew.value
  notify(autoRenew.value ? 'Автопродление включено' : 'Автопродление отключено')
}

const paidUntil = ref('')

interface Payment { date: string; purpose: string; amount: number; method: string; ok: boolean | 'trial'; doc: string | null }
interface BillingInvoice { id: string; amount: number; status: string; description: string; paidAt: string | null; createdAt: string }
interface BillingCurrent {
  plan: 'TRIAL' | 'START' | 'PRO' | 'AGENCY'
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'EXPIRED'
  expiresAt: string
  daysLeft: number
  projectsUsed: number
  maxProjects: number
  membersUsed: number
  maxMembers: number
  invoices: BillingInvoice[]
}
const PLAN_VIEW = {
  TRIAL: { title: 'Триал', badge: 'TRIAL 14 ДНЕЙ', price: '0' },
  START: { title: 'Старт', badge: 'START', price: '1 900' },
  PRO: { title: 'Про', badge: 'PRO', price: '4 900' },
  AGENCY: { title: 'Агентство', badge: 'AGENCY', price: '9 900' }
} as const
const billing = ref<BillingCurrent | null>(null)
const planView = computed(() => PLAN_VIEW[billing.value?.plan ?? 'TRIAL'])
const payments = ref<Payment[]>([])
let actN = 1042

function ruDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ru-RU')
}
function usagePct(used: number, max: number) {
  if (!max) return 0
  return Math.min(100, Math.round((used / max) * 100))
}
function usageBar(used: number, max: number) {
  return usagePct(used, max) >= 90 ? 'bg-red-500' : 'bg-zinc-900'
}

async function loadBilling() {
  try {
    const data = await $fetch<BillingCurrent>('/api/billing/current', { credentials: 'include' })
    billing.value = data
    paidUntil.value = ruDate(data.expiresAt)
    payments.value = data.invoices.map(row => ({
      date: ruDate(row.paidAt || row.createdAt),
      purpose: row.description,
      amount: row.amount,
      method: '—',
      ok: row.status === 'PAID',
      doc: null
    }))
  } catch {
    billing.value = null
  }
}

function todayRu() {
  const d = new Date()
  return String(d.getDate()).padStart(2, '0') + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear()
}

function onPaid(d: BillingPaid) {
  paidUntil.value = d.until || '26.11.2026'
  payments.value.unshift({
    date: todayRu(),
    purpose: d.purpose || 'Подписка «Про» на 1 месяц',
    amount: d.amount || 9900,
    method: d.method === 'invoice' ? 'Безналичный расчёт' : 'Карта •••• 4242',
    ok: true,
    doc: 'А-' + (++actN)
  })
}

const fmt = (n: number) => n.toLocaleString('ru-RU') + ' ₽'
const PILL = 'rounded-full text-sm'
</script>

<template>
  <PageRegistry title="Настройки компании">
    <template #actions>
      <AccessGate :allowed="profileOk" :tip="TIP_SYSTEM">
        <UButton :disabled="!profileOk" :data-deny-tip="TIP_SYSTEM" @click="notify('Настройки сохранены')">Сохранить настройки</UButton>
      </AccessGate>
    </template>

    <template #focus>
      <UiSegmented v-model="tab" :options="tabOptions" :hash="true" aria-label="Настройки компании" />
    </template>

    <!-- ОБЩИЕ -->
    <div v-show="tab === 'general'" class="space-y-6">
      <section class="bg-white rounded-2xl shadow-card p-6 space-y-4">
        <div class="flex items-start gap-4">
          <span class="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </span>
          <div class="min-w-0">
            <h3 class="text-sm font-semibold tracking-tight">Изолированное рабочее пространство</h3>
            <p class="text-sm text-zinc-500 mt-1">Данные компании <strong class="text-zinc-900 font-medium">Ромашка Digital</strong> (клиенты, проекты, задачи, отчёты, интеграции) полностью отделены от других агентств в сервисе. Сотрудники, подрядчики и клиенты видят только это пространство.</p>
            <div class="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 text-xs text-zinc-600 font-mono">romashka.seo-control.app</div>
          </div>
        </div>
      </section>

      <section class="bg-white rounded-2xl shadow-card p-6 space-y-4">
        <h3 class="text-sm font-semibold tracking-tight mb-5">Профиль компании</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
          <div class="md:col-span-2 flex items-center gap-4">
            <span class="w-16 h-16 rounded-2xl bg-zinc-900 text-white text-xl font-semibold flex items-center justify-center shrink-0">РМ</span>
            <div>
              <AccessGate :allowed="profileOk" :tip="TIP_SYSTEM">
                <UButton color="white" :class="PILL" :disabled="!profileOk" @click="logoInput?.click()">Загрузить логотип</UButton>
              </AccessGate>
              <input ref="logoInput" type="file" accept="image/png,image/svg+xml" class="hidden" @change="onLogo">
              <div class="text-xs text-zinc-500 mt-1.5">PNG или SVG, до 1 МБ</div>
            </div>
          </div>
          <UiField label="Название компании" class="md:col-span-2"><UInput v-model="company.name" :disabled="!profileOk" /></UiField>
          <UiField label="ИНН"><UInput v-model="company.inn" :disabled="!profileOk" input-class="tabular-nums" /></UiField>
          <UiField label="Город"><UInput v-model="company.city" :disabled="!profileOk" /></UiField>
          <UiField label="Контактный email компании" class="md:col-span-2"><UInput v-model="company.email" type="email" :disabled="!profileOk" /></UiField>
          <UiField label="Юридический адрес" class="md:col-span-2"><UInput v-model="company.address" placeholder="г. Москва, ул. Пушкина, д. 10, офис 42" :disabled="!profileOk" /></UiField>
        </div>
      </section>

      <section class="bg-zinc-100/80 rounded-2xl p-4 lg:p-6">
        <h3 class="text-sm font-semibold tracking-tight mb-1">Посадочная страница</h3>
        <p class="text-xs text-zinc-500 mb-5">Тексты публичной страницы агентства. Кабинет после входа их не показывает.</p>
        <div class="grid grid-cols-1 gap-4 lg:gap-5">
          <UiField label="Title"><UInput v-model="company.title" :disabled="!profileOk" /></UiField>
          <UiField label="Description"><UTextarea v-model="company.description" :rows="3" resize :disabled="!profileOk" /></UiField>
          <UiField label="Текст для соцсетей"><UTextarea v-model="company.social" :rows="2" resize :disabled="!profileOk" /></UiField>
        </div>
      </section>

      <div class="flex flex-col sm:flex-row gap-3">
        <AccessGate :allowed="profileOk" tip="Профиль компании может менять только владелец">
          <UButton :disabled="!profileOk" data-deny-tip="Профиль компании может менять только владелец" @click="notify('Профиль компании сохранён')">Сохранить</UButton>
        </AccessGate>
      </div>
    </div>

    <!-- ИНТЕГРАЦИИ -->
    <div v-show="tab === 'integrations'" class="space-y-6">
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p class="text-sm text-zinc-500">Подключите аккаунты, чтобы метрики приходили в проекты и отчёты автоматически. Без интеграций можно вести факт вручную.</p>
        <AccessGate :allowed="intOk" :tip="TIP_SYSTEM">
          <UButton class="shrink-0 self-start sm:self-auto" :disabled="!intOk" :data-deny-tip="TIP_SYSTEM" @click="wizardOpen = true">+ Подключить сервис</UButton>
        </AccessGate>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        <SettingsIntegrationCard
          v-for="c in CARDS"
          :id="c.id"
          :key="c.id"
          :title="c.title"
          :sub="c.sub"
          :logo="SERVICES[c.id].logo"
          :tone="SERVICES[c.id].tone"
          :auth="SERVICES[c.id].auth"
          :allowed="intOk && hasRole(c.roles)"
          :tip="c.tip"
          @connect="connect"
          @disconnect="disconnect"
        />
      </div>

      <div class="bg-white rounded-2xl border border-dashed border-zinc-300 p-4 lg:p-5">
        <div class="text-xs text-zinc-500">
          После подключения аккаунтов вы сможете привязывать счётчики и домены к конкретным проектам — в разделе «Источники» внутри каждого проекта. Если интеграция отключена, проекты автоматически переходят на ручной ввод факта.
        </div>
      </div>
    </div>

    <!-- РОЛИ И ДОСТУП -->
    <div v-if="tab === 'roles'" class="space-y-6">
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p class="text-sm text-zinc-500">Регламент безопасности компании: зелёная точка — право разрешено, серый прочерк — запрещено. Команду и приглашения ведите в разделе «Сотрудники».</p>
      </div>

      <SettingsRoleCards />

      <SettingsPermMatrix />

      <section class="bg-white rounded-2xl shadow-card p-6 space-y-4">
        <h3 class="text-sm font-semibold tracking-tight mb-3">Принципы доступа</h3>
        <ul class="space-y-3 text-sm text-zinc-600">
          <li class="flex gap-3"><span class="w-1.5 h-1.5 rounded-full bg-zinc-500 mt-2 shrink-0" /><span><strong class="text-zinc-900 font-medium">Компании изолированы.</strong> Агентства не видят данные друг друга: проекты, клиентов, сотрудников и отчёты.</span></li>
          <li class="flex gap-3"><span class="w-1.5 h-1.5 rounded-full bg-zinc-500 mt-2 shrink-0" /><span><strong class="text-zinc-900 font-medium">Три уровня сотрудников.</strong> Владелец делает всё. Оба руководителя делают всё, кроме профиля, тарифа, смены ролей и удаления компании. SEO-специалист и менеджер проекта делают то же, кроме шаблонов и интеграций. Роли внутри уровня равны.</span></li>
          <li class="flex gap-3"><span class="w-1.5 h-1.5 rounded-full bg-zinc-500 mt-2 shrink-0" /><span><strong class="text-zinc-900 font-medium">Клиент только смотрит.</strong> Ему доступны результаты, дорожная карта и уже принятые отчёты. Внутренние задачи, часы, ставки и состав команды скрыты. Ничего не редактирует и отчёт не согласовывает.</span></li>
          <li class="flex gap-3"><span class="w-1.5 h-1.5 rounded-full bg-zinc-500 mt-2 shrink-0" /><span><strong class="text-zinc-900 font-medium">Подрядчик видит назначенные задачи.</strong> Может менять статус, комментировать и вести свои часы. Проекты, клиенты, отчёты, люди и деньги ему закрыты.</span></li>
          <li class="flex gap-3"><span class="w-1.5 h-1.5 rounded-full bg-zinc-500 mt-2 shrink-0" /><span><strong class="text-zinc-900 font-medium">Владелец может сам быть руководителем SEO.</strong> Это подпись состава компании, права от этого не меняются: у владельца они уже полные. Отдельного входа «Руководитель SEO» тогда нет.</span></li>
        </ul>
      </section>
    </div>

    <!-- БИЛЛИНГ -->
    <div v-show="tab === 'billing'" class="space-y-6">
      <section class="bg-white rounded-2xl shadow-card p-6 space-y-5">
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div class="min-w-0">
            <div class="text-xs font-medium text-zinc-500 mb-1">Текущий тариф</div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="text-2xl font-semibold tracking-tight">{{ planView.title }}</span>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-900 text-white">{{ planView.badge }}</span>
              <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium" :class="billing?.status === 'EXPIRED' ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-800'">
                <span class="w-1.5 h-1.5 rounded-full" :class="billing?.status === 'EXPIRED' ? 'bg-red-500' : 'bg-emerald-500'" />
                {{ billing?.status === 'EXPIRED' ? 'Доступ закончился' : `Осталось ${billing?.daysLeft ?? '…'} дн. · до ${paidUntil || '…'}` }}
              </span>
            </div>
            <div class="mt-2 text-sm text-zinc-700"><span class="text-xl font-semibold tracking-tight tabular-nums text-ink">{{ planView.price }}</span> <span class="text-zinc-500">₽ / месяц</span></div>
            <p v-if="billing" class="text-xs text-zinc-500 mt-1.5">Проекты {{ billing.projectsUsed }} из {{ billing.maxProjects }} · команда {{ billing.membersUsed }} из {{ billing.maxMembers }}</p>
          </div>
          <div class="flex flex-col sm:flex-row gap-2 shrink-0">
            <AccessGate :allowed="billingOk" :tip="BILLING_TIP">
              <UButton :disabled="!billingOk" :data-deny-tip="BILLING_TIP" class="justify-center" @click="checkoutOpen = true">Продлить / Оплатить подписку</UButton>
            </AccessGate>
            <AccessGate :allowed="billingOk" :tip="BILLING_TIP">
              <UButton color="white" :disabled="!billingOk" :data-deny-tip="BILLING_TIP" :class="[PILL, 'justify-center text-zinc-700']" @click="openTariff()">Сменить тариф</UButton>
            </AccessGate>
          </div>
        </div>

        <div v-if="billing" class="grid sm:grid-cols-2 gap-4">
          <div>
            <div class="flex items-center justify-between text-xs mb-1.5">
              <span class="font-medium text-zinc-700">Проекты</span>
              <span class="tabular-nums text-zinc-500">{{ billing.projectsUsed }} из {{ billing.maxProjects }}</span>
            </div>
            <div class="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full" :class="usageBar(billing.projectsUsed, billing.maxProjects)" :style="{ width: usagePct(billing.projectsUsed, billing.maxProjects) + '%' }" />
            </div>
            <p v-if="usagePct(billing.projectsUsed, billing.maxProjects) >= 90" class="text-xs text-red-600 mt-1.5">Лимит проектов почти исчерпан. Перейдите на тариф выше.</p>
          </div>
          <div>
            <div class="flex items-center justify-between text-xs mb-1.5">
              <span class="font-medium text-zinc-700">Команда</span>
              <span class="tabular-nums text-zinc-500">{{ billing.membersUsed }} из {{ billing.maxMembers }}</span>
            </div>
            <div class="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
              <div class="h-full rounded-full" :class="usageBar(billing.membersUsed, billing.maxMembers)" :style="{ width: usagePct(billing.membersUsed, billing.maxMembers) + '%' }" />
            </div>
            <p v-if="usagePct(billing.membersUsed, billing.maxMembers) >= 90" class="text-xs text-red-600 mt-1.5">Лимит сотрудников почти исчерпан. Перейдите на тариф выше.</p>
          </div>
        </div>

        <div class="rounded-2xl bg-zinc-50 border border-zinc-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div class="min-w-0">
            <div class="text-xs font-medium text-zinc-500 mb-1">Платёжный метод</div>
            <div class="text-sm font-medium text-ink">МИР •••• 4242 <span class="text-zinc-400 font-normal">(истекает 12/28)</span></div>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <AccessGate :allowed="billingOk" :tip="TIP_SYSTEM">
              <button
                type="button"
                :aria-pressed="autoRenew"
                :disabled="!billingOk"
                class="inline-flex items-center gap-2 h-8 px-3 rounded-full text-xs font-medium border transition disabled:opacity-50 disabled:cursor-not-allowed"
                :class="autoRenew ? 'bg-emerald-50 text-emerald-800 border-emerald-100 hover:bg-emerald-100' : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200/70'"
                @click="toggleRenew"
              >
                <span class="w-1.5 h-1.5 rounded-full" :class="autoRenew ? 'bg-emerald-500' : 'bg-zinc-400'" />
                <span>Автопродление: {{ autoRenew ? 'включено' : 'выключено' }}</span>
              </button>
            </AccessGate>
            <AccessGate :allowed="billingOk" :tip="TIP_SYSTEM">
              <UButton color="white" size="xs" class="rounded-full text-zinc-700" :disabled="!billingOk" @click="notify('Откроем форму привязки карты в следующем релизе')">Привязать другую карту</UButton>
            </AccessGate>
          </div>
        </div>
      </section>

      <div class="mb-3 flex items-end justify-between gap-3">
        <h3 class="text-sm font-semibold tracking-tight">Тарифы</h3>
        <span class="text-xs text-zinc-500">При оплате за год — скидка 20%</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 pt-2">
        <div v-for="p in PLAN_CARDS" :key="p.id" class="relative bg-white rounded-2xl shadow-card p-4 lg:p-5 flex flex-col gap-4" :class="p.current && 'ring-2 ring-accent'">
          <span v-if="p.current" class="absolute -top-2.5 left-4 px-2 py-0.5 rounded-full bg-accent text-white text-[11px] font-medium">Ваш тариф</span>
          <div><div class="text-sm font-semibold">{{ p.name }}</div><div class="text-xs text-zinc-500 mt-0.5">{{ p.sub }}</div></div>
          <div><span class="text-2xl font-semibold tracking-tight tabular-nums">{{ p.price }}</span><span class="text-xs text-zinc-500"> ₽/мес</span></div>
          <ul class="space-y-2 text-xs text-zinc-600 flex-1">
            <li v-for="f in p.features" :key="f" class="flex items-start gap-2"><svg class="w-4 h-4 text-emerald-600 shrink-0 mt-px" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg><span>{{ f }}</span></li>
          </ul>
          <AccessGate :allowed="billingOk" :tip="TIP_SYSTEM" block>
            <UButton v-if="p.current" block :class="PILL" :disabled="!billingOk" @click="checkoutOpen = true">Продлить / Оплатить</UButton>
            <UButton v-else color="white" block :class="PILL" :disabled="!billingOk" @click="openTariff(p.id)">Выбрать</UButton>
          </AccessGate>
        </div>
      </div>

      <section class="bg-white rounded-2xl shadow-card overflow-hidden">
        <div class="px-4 lg:px-6 py-4 flex items-center justify-between gap-3">
          <h3 class="text-sm font-semibold tracking-tight">История платежей</h3>
          <AccessGate :allowed="billingOk" :tip="TIP_SYSTEM">
            <button type="button" :disabled="!billingOk" class="text-xs text-zinc-500 hover:text-zinc-900 transition disabled:opacity-50" @click="notify('Акт сверки за 2026 год скачивается')">Акт сверки</button>
          </AccessGate>
        </div>
        <div class="overflow-x-auto border-t border-zinc-100">
          <table class="w-full text-sm min-w-[720px]">
            <thead>
              <tr class="text-left text-[11px] font-medium text-zinc-400 uppercase tracking-wider border-b border-zinc-100">
                <th class="px-4 lg:px-6 py-2.5">Дата платежа</th>
                <th class="px-4 py-2.5">Назначение</th>
                <th class="px-4 py-2.5 text-right">Сумма</th>
                <th class="px-4 py-2.5">Способ оплаты</th>
                <th class="px-4 py-2.5">Статус</th>
                <th class="px-4 lg:px-6 py-2.5 text-right">Документы</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-50">
              <tr v-if="!payments.length">
                <td colspan="6" class="px-4 lg:px-6 py-6 text-sm text-zinc-500">Платежей пока нет</td>
              </tr>
              <tr v-for="(row, i) in payments" :key="row.doc ?? `pay-${i}`" class="hover:bg-zinc-50/50 transition">
                <td class="px-4 lg:px-6 py-3 tabular-nums text-zinc-500 whitespace-nowrap">{{ row.date }}</td>
                <td class="px-4 py-3">{{ row.purpose }}</td>
                <td class="px-4 py-3 text-right tabular-nums font-medium whitespace-nowrap">{{ row.amount ? fmt(row.amount) : '0 ₽' }}</td>
                <td class="px-4 py-3 text-zinc-600 whitespace-nowrap">{{ row.method }}</td>
                <td class="px-4 py-3">
                  <span v-if="row.ok === 'trial'" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-accent" />Триал</span>
                  <span v-else-if="row.ok" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />Оплачено</span>
                  <span v-else class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 whitespace-nowrap">Отклонено</span>
                </td>
                <td class="px-4 lg:px-6 py-3 text-right">
                  <span v-if="!row.doc || !row.ok || row.ok === 'trial'" class="text-xs text-zinc-400">—</span>
                  <AccessGate v-else :allowed="billingOk" :tip="TIP_SYSTEM">
                    <button type="button" :disabled="!billingOk" class="inline-flex items-center gap-1 text-xs text-accent hover:underline whitespace-nowrap disabled:opacity-50" @click="notify('Формирование акта № ' + row.doc + ' и скачивание PDF')">Акт / Чек</button>
                  </AccessGate>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <ModalsIntegration v-model="wizardOpen" />
    <ModalsIntegrationOauth v-model="oauthOpen" :service="oauthService" />
    <ModalsTariffChange v-model="tariffOpen" :plan="tariffPlan" @changed="loadBilling" />
    <ModalsCheckout v-model="checkoutOpen" @paid="onPaid" />
  </PageRegistry>
</template>
