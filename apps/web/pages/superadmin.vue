<script setup lang="ts">
// superadmin.html → консоль основателя: свой сайдбар платформы, Сетка 1 (Registry) — фильтр компаний и поиск,
// сводка, компании, платежи, песочница событий. Каркас кабинета агентства не нужен — layout auth.
definePageMeta({ layout: 'auth' })
useHead({ title: 'SuperAdmin — SEO Control' })

const toast = useToast()
const { confirm } = useConfirm()

type PlanKey = 'start' | 'pro' | 'ent'
type Status = 'active' | 'trial' | 'overdue' | 'blocked'

const PLANS: Record<PlanKey, { label: string; cls: string; price: number }> = {
  start: { label: 'Старт', cls: 'bg-zinc-100 text-zinc-700', price: 4900 },
  pro: { label: 'Про', cls: 'bg-blue-50 text-blue-700', price: 9900 },
  ent: { label: 'Enterprise', cls: 'bg-zinc-900 text-white', price: 39900 }
}
const fmt = (n: number) => Number(n).toLocaleString('ru-RU')
const daysWord = (n: number) => plural(n, ['день', 'дня', 'дней'])

/** Пуш платформы: «SEO Control · платформа», заголовок и пояснение. */
function push(title: string, text?: string) {
  toast.add({ title, description: text ? `SEO Control · платформа · ${text}` : 'SEO Control · платформа', timeout: 4200 })
}

interface Company {
  id: string; name: string; city: string; domain: string; owner: string; email: string; phone: string
  plan: PlanKey; status: Status; until: string; days: number; projects: number; people: number; ltv: number
}
interface Payment { date: string; company: string; amount: number; plan: PlanKey; method: string; ok: boolean }

const stats = reactive({ mrr: 485000, companies: 48, paid: 32, trial: 11, overdue: 5, projects: 312, conv: 68 })
const companies = ref<Company[]>([
  { id: 'romashka', name: 'Ромашка Digital', city: 'Москва', domain: 'romashka.seo', owner: 'Александр Смирнов', email: 'a@romashka.ru', phone: '+7 495 120-00-11', plan: 'pro', status: 'active', until: '15.11', days: 0, projects: 14, people: 8, ltv: 892000 },
  { id: 'sever', name: 'Север SEO', city: 'Санкт-Петербург', domain: 'sever.seo', owner: 'Мария Козлова', email: 'm@sever.ru', phone: '+7 812 300-11-22', plan: 'start', status: 'trial', until: '', days: 4, projects: 3, people: 2, ltv: 0 },
  { id: 'media', name: 'МедиаЛайт', city: 'Новосибирск', domain: 'medialight.ru', owner: 'Елена Крылова', email: 'e@medialight.ru', phone: '+7 383 200-10-20', plan: 'pro', status: 'overdue', until: '', days: 0, projects: 9, people: 5, ltv: 268000 },
  { id: 'alfa', name: 'Альфа Продвижение', city: 'Екатеринбург', domain: 'alfa-seo.ru', owner: 'Дмитрий Лебедев', email: 'd@alfa.ru', phone: '+7 343 222-33-44', plan: 'ent', status: 'active', until: '01.12', days: 0, projects: 41, people: 22, ltv: 2140000 },
  { id: 'holod', name: 'Холод Маркетинг', city: 'Москва', domain: 'holod-mkt.ru', owner: 'Сергей Волков', email: 's@holod.ru', phone: '+7 495 123-45-67', plan: 'pro', status: 'active', until: '28.10', days: 0, projects: 6, people: 4, ltv: 178800 },
  { id: 'stroy', name: 'СтройТех SEO', city: 'Казань', domain: 'stroytech-seo.ru', owner: 'Михаил Орлов', email: 'm@stroy.ru', phone: '+7 843 200-40-50', plan: 'start', status: 'active', until: '03.11', days: 0, projects: 4, people: 2, ltv: 49000 },
  { id: 'vector', name: 'Вектор', city: 'Краснодар', domain: 'vector-seo.ru', owner: 'Ольга Ветрова', email: 'o@vector.ru', phone: '+7 861 555-12-34', plan: 'pro', status: 'trial', until: '', days: 11, projects: 2, people: 3, ltv: 0 },
  { id: 'legal', name: 'Смирнов и партнёры', city: 'Москва', domain: 'smirnov.legal', owner: 'Андрей Смирнов', email: 'a@smirnov.ru', phone: '+7 916 555-12-34', plan: 'ent', status: 'overdue', until: '', days: 0, projects: 18, people: 11, ltv: 956000 }
])
const payments = ref<Payment[]>([
  { date: '12.10.2026', company: 'Ромашка Digital', amount: 9900, plan: 'pro', method: 'Карта', ok: true },
  { date: '01.10.2026', company: 'Альфа Продвижение', amount: 39900, plan: 'ent', method: 'Счёт', ok: true },
  { date: '28.09.2026', company: 'МедиаЛайт', amount: 9900, plan: 'pro', method: 'Карта', ok: false },
  { date: '15.09.2026', company: 'Холод Маркетинг', amount: 9900, plan: 'pro', method: 'Карта', ok: true },
  { date: '03.09.2026', company: 'СтройТех SEO', amount: 4900, plan: 'start', method: 'Карта', ok: true },
  { date: '20.08.2026', company: 'Смирнов и партнёры', amount: 39900, plan: 'ent', method: 'Счёт', ok: false }
])
const SIGNUPS = [
  ['Новая студия', 'Иван Петров', 'ivan@newstudio.ru'],
  ['Точка Роста', 'Анна Белова', 'anna@tochka.ru'],
  ['Лаборатория трафика', 'Павел Орлов', 'p@labtraf.ru'],
  ['Семантика', 'Кирилл Новиков', 'k@semantika.ru']
] as const
let signupN = 0

const STATUS: Record<Status, { cls: string; dot: string }> = {
  active: { cls: 'bg-emerald-50 text-emerald-800', dot: 'bg-emerald-500' },
  trial: { cls: 'bg-amber-50 text-amber-800', dot: 'bg-amber-500' },
  blocked: { cls: 'bg-zinc-100 text-zinc-600', dot: 'bg-zinc-400' },
  overdue: { cls: 'bg-red-50 text-red-700', dot: 'bg-red-500' }
}
function statusLabel(c: Company) {
  if (c.status === 'active') return `Активна (до ${c.until})`
  if (c.status === 'trial') return `Триал (осталось ${c.days} ${daysWord(c.days)})`
  if (c.status === 'blocked') return 'Заблокирована'
  return 'Просрочена'
}

function leaveBucket(c: Company) {
  if (c.status === 'active') stats.paid = Math.max(0, stats.paid - 1)
  else if (c.status === 'trial') stats.trial = Math.max(0, stats.trial - 1)
  else if (c.status === 'overdue') stats.overdue = Math.max(0, stats.overdue - 1)
}

// Тулбар: фильтр по статусу подписки и поиск.
const filter = ref('all')
const filterOptions = [
  { value: 'all', label: 'Все компании' },
  { value: 'active', label: 'Активные' },
  { value: 'trial', label: 'Триал' },
  { value: 'blocked', label: 'Просрочены / Блок' }
]
const q = ref('')
const visible = computed(() => {
  const needle = q.value.trim().toLowerCase()
  return companies.value.filter(c => {
    if (filter.value === 'active' && c.status !== 'active') return false
    if (filter.value === 'trial' && c.status !== 'trial') return false
    if (filter.value === 'blocked' && c.status !== 'overdue' && c.status !== 'blocked') return false
    return !needle || [c.name, c.domain, c.city, c.owner, c.email].join(' ').toLowerCase().includes(needle)
  })
})

function impersonate(c: Company) {
  if (c.status === 'blocked') return push('Вход закрыт', `Компания «${c.name}» заблокирована`)
  push('Вход под компанией', `${c.name} · открыт кабинет агентства`)
  window.open('/', '_blank')
}
function extend(c: Company) {
  leaveBucket(c)
  c.status = 'active'
  c.until = '18.11'
  c.days = 0
  stats.paid += 1
  push('Подписка продлена', `${c.name} активна до 18.11`)
}
async function block(c: Company) {
  const ok = await confirm({
    title: `Заблокировать компанию «${c.name}»?`,
    text: 'Кабинет компании будет закрыт до разблокировки. Платежи и данные сохранятся.',
    ok: 'Заблокировать',
    toast: `Компания «${c.name}» заблокирована`
  })
  if (!ok) return
  if (c.status === 'blocked') return push('Уже заблокирована', c.name)
  leaveBucket(c)
  c.status = 'blocked'
}

function simSignup() {
  const [name, owner, email] = SIGNUPS[signupN % SIGNUPS.length]!
  signupN += 1
  companies.value.unshift({
    id: 'new' + signupN, name: name + (signupN > SIGNUPS.length ? ' ' + signupN : ''), city: 'Москва', domain: `trial-${signupN}.seo`,
    owner, email, phone: `+7 900 100-0${signupN}-10`,
    plan: 'pro', status: 'trial', until: '', days: 14, projects: 0, people: 1, ltv: 0
  })
  stats.companies += 1
  stats.trial += 1
  push('Новая регистрация с лендинга', `${name} · триал «Про», 14 дней`)
}
function simPay() {
  const list = companies.value
  const c = list.find(x => x.status === 'trial') || list.find(x => x.status !== 'blocked') || list[0]!
  const amount = PLANS[c.plan].price
  if (c.status !== 'active') {
    leaveBucket(c)
    c.status = 'active'
    c.until = '18.11'
    c.days = 0
    stats.paid += 1
    stats.mrr += amount
  }
  c.ltv += amount
  payments.value.unshift({ date: '18.10.2026', company: c.name, amount, plan: c.plan, method: 'Карта', ok: true })
  push('Оплата тарифа', `${c.name} · ${fmt(amount)} ₽, «${PLANS[c.plan].label}»`)
}

const sideOpen = ref(false)

const TH = 'px-4 py-3 font-medium'
const TD = 'px-4 py-3'
const TABLE_WRAP = 'md:bg-white md:rounded-3xl md:shadow-card md:overflow-hidden overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 max-w-full'
</script>

<template>
  <div class="min-h-screen overflow-x-hidden">
    <SuperadminSidebar v-model:open="sideOpen" />

    <main class="flex-1 min-w-0 lg:pl-[calc(16rem+2rem)] px-4 lg:px-8 pt-6 pb-24 lg:pb-20 space-y-6">
      <PageRegistry>
        <template #title>
          <button type="button" aria-label="Открыть меню" class="lg:hidden h-9 w-9 -ml-1 rounded-full hover:bg-black/5 flex items-center justify-center shrink-0" @click="sideOpen = true">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M4 7h16M4 12h16M4 17h16" /></svg>
          </button>
          <h1 class="text-base font-semibold tracking-tight text-ink leading-none truncate max-w-[140px] sm:max-w-none">Платформа</h1>
        </template>
        <template #actions>
          <UButton to="/"><span class="sm:hidden">В кабинет</span><span class="hidden sm:inline">В кабинет агентства</span></UButton>
          <span aria-label="Профиль" class="h-9 w-9 rounded-full bg-zinc-900 text-white text-[10px] font-semibold flex items-center justify-center shrink-0">SA</span>
        </template>

        <template #focus>
          <UiSegmented v-model="filter" :options="filterOptions" aria-label="Статус подписки" />
        </template>
        <template #view>
          <UInput
            v-model="q"
            type="search"
            size="xs"
            placeholder="Поиск компании или домена..."
            aria-label="Поиск компании"
            icon="i-heroicons-magnifying-glass-20-solid"
            class="w-full sm:w-64 shrink-0"
          />
        </template>

        <p class="text-sm text-zinc-500">Сводка по агентствам, подпискам и платежам. Данные на 18 октября 2026.</p>

        <section id="metrics" class="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 w-full scroll-mt-20">
          <article class="bg-white rounded-2xl shadow-card p-3 sm:p-4 flex flex-col justify-between min-w-0">
            <div class="text-xs font-medium text-zinc-500 truncate mb-1">MRR · выручка</div>
            <div class="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1.5 min-w-0">
              <span class="text-lg sm:text-2xl font-bold tracking-tight text-ink tabular-nums leading-tight">{{ fmt(stats.mrr) }} ₽</span>
            </div>
            <div class="text-xs font-medium tabular-nums text-emerald-700 mt-2">+12% за месяц</div>
          </article>
          <article class="bg-white rounded-2xl shadow-card p-3 sm:p-4 flex flex-col justify-between min-w-0">
            <div class="text-xs font-medium text-zinc-500 truncate mb-1">Компании</div>
            <div class="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1.5 min-w-0">
              <span class="text-lg sm:text-2xl font-bold tracking-tight text-ink tabular-nums leading-tight">{{ fmt(stats.companies) }}</span>
            </div>
            <div class="text-[11px] sm:text-xs text-zinc-500 mt-2 leading-snug">{{ fmt(stats.paid) }} платных · {{ fmt(stats.trial) }} триал · {{ fmt(stats.overdue) }} просроч.</div>
          </article>
          <article class="bg-white rounded-2xl shadow-card p-3 sm:p-4 flex flex-col justify-between min-w-0">
            <div class="text-xs font-medium text-zinc-500 truncate mb-1">Проекты</div>
            <div class="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1.5 min-w-0">
              <span class="text-lg sm:text-2xl font-bold tracking-tight text-ink tabular-nums leading-tight">{{ fmt(stats.projects) }}</span>
            </div>
            <div class="text-[11px] sm:text-xs text-zinc-500 mt-2">по всем агентствам</div>
          </article>
          <article class="bg-white rounded-2xl shadow-card p-3 sm:p-4 flex flex-col justify-between min-w-0">
            <div class="text-xs font-medium text-zinc-500 truncate mb-1">Конверсия триала</div>
            <div class="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-1.5 min-w-0">
              <span class="text-lg sm:text-2xl font-bold tracking-tight text-ink tabular-nums leading-tight">{{ fmt(stats.conv) }}%</span>
            </div>
            <div class="text-[11px] sm:text-xs text-zinc-500 mt-2">за последние 90 дней</div>
          </article>
        </section>

        <section id="companies" class="scroll-mt-20">
          <div class="flex items-end justify-between gap-3 mb-3">
            <h2 class="text-lg font-semibold tracking-tight">Компании</h2>
            <p class="text-xs text-zinc-500">показаны {{ visible.length }} из {{ companies.length }}</p>
          </div>
          <div :class="TABLE_WRAP">
            <table class="cards w-full text-left">
              <thead class="text-[11px] font-medium text-zinc-500 border-b border-zinc-100">
                <tr>
                  <th :class="TH">Компания</th>
                  <th :class="TH">Владелец</th>
                  <th :class="TH">Тариф</th>
                  <th :class="TH">Подписка</th>
                  <th :class="TH">Проекты / люди</th>
                  <th :class="TH">LTV</th>
                  <th :class="TH">Действия</th>
                </tr>
              </thead>
              <tbody class="md:divide-y md:divide-zinc-100">
                <tr v-if="!visible.length"><td colspan="7" class="px-4 py-10 text-center text-sm text-zinc-500">Нет компаний по текущему фильтру</td></tr>
                <tr v-for="c in visible" :key="c.id" class="align-top" :data-company-status="c.status">
                  <td data-label="Компания" :class="TD"><div class="text-sm font-semibold">{{ c.name }}</div><div class="text-xs text-zinc-400 mt-0.5">{{ c.city }} · {{ c.domain }}</div></td>
                  <td data-label="Владелец" :class="TD"><div class="text-sm">{{ c.owner }}</div><div class="text-xs text-zinc-400 mt-0.5">{{ c.email }} · {{ c.phone }}</div></td>
                  <td data-label="Тариф" :class="TD"><span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" :class="PLANS[c.plan].cls">{{ PLANS[c.plan].label }}</span></td>
                  <td data-label="Подписка" :class="TD"><span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0" :class="STATUS[c.status].cls"><span class="w-1.5 h-1.5 rounded-full" :class="STATUS[c.status].dot" />{{ statusLabel(c) }}</span></td>
                  <td data-label="Проекты / люди" :class="[TD, 'text-sm tabular-nums']">{{ c.projects }} / {{ c.people }}</td>
                  <td data-label="LTV" :class="[TD, 'text-sm tabular-nums whitespace-nowrap']">{{ fmt(c.ltv) }} ₽</td>
                  <td data-label="Действия" :class="TD">
                    <div class="flex flex-wrap gap-1.5">
                      <UButton color="black" size="2xs" class="rounded-full" @click="impersonate(c)">Войти под компанией</UButton>
                      <UButton color="white" size="2xs" class="rounded-full" @click="extend(c)">Продлить вручную</UButton>
                      <UButton color="white" size="2xs" class="rounded-full text-red-700 hover:bg-red-50" @click="block(c)">Заблокировать</UButton>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="payments" class="scroll-mt-20">
          <h2 class="text-lg font-semibold tracking-tight mb-3">Платежи</h2>
          <div :class="TABLE_WRAP">
            <table class="cards w-full text-left">
              <thead class="text-[11px] font-medium text-zinc-500 border-b border-zinc-100">
                <tr>
                  <th :class="TH">Дата</th>
                  <th :class="TH">Компания</th>
                  <th :class="TH">Сумма</th>
                  <th :class="TH">Тариф</th>
                  <th :class="TH">Метод</th>
                  <th :class="TH">Статус</th>
                </tr>
              </thead>
              <tbody class="md:divide-y md:divide-zinc-100">
                <tr v-for="(p, i) in payments" :key="`${p.date}-${p.company}-${i}`">
                  <td data-label="Дата" :class="[TD, 'text-sm tabular-nums whitespace-nowrap']">{{ p.date }}</td>
                  <td data-label="Компания" :class="[TD, 'text-sm font-medium']">{{ p.company }}</td>
                  <td data-label="Сумма" :class="[TD, 'text-sm tabular-nums whitespace-nowrap']">{{ fmt(p.amount) }} ₽</td>
                  <td data-label="Тариф" :class="TD"><span class="inline-flex px-2 py-0.5 rounded-full text-xs font-medium" :class="PLANS[p.plan].cls">{{ PLANS[p.plan].label }}</span></td>
                  <td data-label="Метод" :class="[TD, 'text-sm']">{{ p.method }}</td>
                  <td data-label="Статус" :class="TD">
                    <span v-if="p.ok" class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />Успешно</span>
                    <span v-else class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700"><span class="w-1.5 h-1.5 rounded-full bg-red-500" />Ошибка списания</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="sandbox" class="scroll-mt-20">
          <div class="bg-white rounded-3xl shadow-card p-5 sm:p-6">
            <h2 class="text-lg font-semibold tracking-tight">Песочница</h2>
            <p class="mt-1 text-sm text-zinc-500 max-w-xl">Проверка событий, которые основатель получает как пуш: новая регистрация с лендинга и успешная оплата тарифа.</p>
            <div class="mt-4 flex flex-col sm:flex-row gap-2">
              <UButton color="black" size="md" class="rounded-full text-sm" @click="simSignup">Эмулировать новую регистрацию с лендинга</UButton>
              <UButton color="white" size="md" class="rounded-full text-sm" @click="simPay">Эмулировать оплату тарифа</UButton>
            </div>
          </div>
        </section>
      </PageRegistry>
    </main>

    <UiConfirmHost />
  </div>
</template>

<style scoped>
@media (max-width: 767px) {
  table.cards thead { display: none; }
  table.cards, table.cards tbody, table.cards tr, table.cards td { display: block; width: 100%; }
  table.cards tr { background: #fff; border-radius: 1.25rem; box-shadow: 0 1px 2px rgba(0, 0, 0, .04), 0 0 0 1px rgba(0, 0, 0, .04); margin-bottom: .75rem; padding: .75rem 1rem; }
  table.cards td { border: 0; padding: .4rem 0; }
  table.cards td[data-label]::before { content: attr(data-label); display: block; font-size: 11px; color: #71717a; margin-bottom: 2px; }
}
</style>
