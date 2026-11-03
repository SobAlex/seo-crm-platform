<script setup lang="ts">
// clients.html → Сетка 1 (Registry): фокус «Сотрудничество», поиск, реестр клиентов с брифом и проектами.
import type { BriefSent, DirectoryClient } from '~/types/clients'

definePageMeta({ roles: ['owner', 'seo_head', 'mgr_head', 'pm', 'employee'] })
useHead({ title: 'Клиенты — SEO Control' })

const { can } = useRole()
const notify = useNotify()

type Coop = 'active' | 'paused' | 'lead'
type ProjectStatus = 'active' | 'launch' | 'paused'
/** filled — заполнен, sent — отправлен (дата, напоминания), none — не отправлен. */
interface Brief { state: 'filled' | 'sent' | 'none'; date?: string; reminded?: string }
interface ClientRow {
  id: string
  name: string
  status: Coop
  since: string
  contact: string
  phone: string
  email: string
  brief: Brief
  projects: { id: string; name: string; site: string; status: ProjectStatus }[]
  isNew?: boolean
}

const STATUS: Record<Coop, [string, string, string]> = {
  active: ['bg-emerald-50 text-emerald-700', 'bg-emerald-500', 'Активный'],
  paused: ['bg-zinc-100 text-zinc-600', 'bg-zinc-400', 'Приостановлен'],
  lead: ['bg-violet-50 text-violet-700', 'bg-violet-500', 'Лид']
}
const PSTATUS: Record<ProjectStatus, [string, string]> = { active: ['bg-emerald-500', 'Активен'], launch: ['bg-blue-500', 'Запуск'], paused: ['bg-zinc-400', 'На паузе'] }

const clients = ref<ClientRow[]>([
  {
    id: 'holod', name: 'ООО «Холод Групп»', status: 'active', since: 'с мая 2025', contact: 'Сергей Волков', phone: '+7 495 123-45-67', email: 's.volkov@holod.ru',
    brief: { state: 'filled', date: '03.05' },
    projects: [{ id: 'holod', name: 'Интернет-магазин «Холод»', site: 'holod-shop.ru', status: 'active' }, { id: 'holodb2b', name: 'Оптовый портал «Холод B2B»', site: 'b2b.holod-shop.ru', status: 'launch' }]
  },
  {
    id: 'smirnov', name: 'ИП Смирнов А.', status: 'active', since: 'с марта 2025', contact: 'Андрей Смирнов', phone: '+7 916 555-12-34', email: 'a@remont-plus.ru',
    brief: { state: 'sent', date: '12.06' },
    projects: [{ id: 'remont', name: 'Сайт услуг «Ремонт+»', site: 'remont-plus.ru', status: 'active' }]
  },
  {
    id: 'stroytech', name: 'АО «Стройтех»', status: 'paused', since: 'пауза с 01.06', contact: 'Михаил Орлов', phone: '+7 812 300-40-50', email: 'm.orlov@stroytech.ru',
    brief: { state: 'filled', date: '14.02' },
    projects: [{ id: 'stroytech', name: 'B2B портал «Стройтех»', site: 'stroytech.ru', status: 'paused' }]
  },
  {
    id: 'medlife', name: 'ООО «МедЛайф»', status: 'active', since: 'с апреля 2025', contact: 'Елена Крылова', phone: '+7 383 200-10-20', email: 'e.krylova@medlife.ru',
    brief: { state: 'none' },
    projects: [{ id: 'medlife', name: 'Клиника «МедЛайф»', site: 'medlife-clinic.ru', status: 'active' }]
  },
  {
    id: 'alfa', name: 'ООО «Альфа»', status: 'lead', since: 'КП отправлено 10.06', contact: 'Дмитрий Лебедев', phone: '+7 343 222-33-44', email: 'd.lebedev@alfa-group.ru',
    brief: { state: 'sent', date: '16.06' },
    projects: []
  }
])

// Тулбар: строка 1 — сотрудничество, строка 2 — поиск.
const coop = ref('all')
const coopOptions = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'paused', label: 'Приостановлены' },
  { value: 'lead', label: 'Лиды' }
]
const q = ref('')
const perPage = ref('10')

const visible = computed(() => {
  const needle = q.value.trim().toLowerCase()
  return clients.value.filter(c =>
    (coop.value === 'all' || c.status === coop.value) &&
    (!needle || `${c.name} ${c.contact} ${c.email}`.toLowerCase().includes(needle))
  )
})

const expanded = ref<Record<string, boolean>>({})

const MANAGE_TIP = 'Управление клиентами доступно менеджерам и руководству'

function remind(c: ClientRow) {
  c.brief.reminded = '18.06'
  notify('Напоминание отправлено: ссылка на бриф повторно ушла на ' + c.email, 'success')
}

// Окна: новый клиент и отправка брифа.
const createOpen = ref(false)
const briefOpen = ref(false)
const briefClient = ref<string | undefined>()
const createdClients = ref<DirectoryClient[]>([])

function openBrief(id: string) {
  briefClient.value = id
  briefOpen.value = true
}

function onCreated(c: DirectoryClient) {
  createdClients.value.push(c)
  clients.value.unshift({ id: c.id, name: c.name, status: 'lead', since: 'добавлен 18.06', contact: c.contact, phone: c.phone || '', email: c.email, brief: { state: 'none' }, projects: [], isNew: true })
}

function onBriefSent(e: BriefSent) {
  const c = clients.value.find(x => x.id === e.client)
  if (!c || c.brief.state === 'filled') return
  c.brief = { state: 'sent', date: '18.06' }
}

const TD = 'md:px-3 md:py-3 lg:py-4 min-w-0 before:block before:text-[11px] before:text-zinc-500 before:mb-0.5 before:content-[attr(data-label)] md:before:hidden'
const CHIP = 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0'
const LINK = 'text-xs font-medium text-accent hover:underline whitespace-nowrap disabled:text-zinc-400 disabled:no-underline'
</script>

<template>
  <PageRegistry title="Клиенты">
    <template #actions>
      <AccessGate :allowed="can('client.manage')" :tip="MANAGE_TIP">
        <UButton :disabled="!can('client.manage')" :data-deny-tip="MANAGE_TIP" @click="createOpen = true">
          <span class="sm:hidden">+ Создать</span><span class="hidden sm:inline">+ Новый клиент</span>
        </UButton>
      </AccessGate>
    </template>

    <template #focus>
      <UiSegmented v-model="coop" :options="coopOptions" aria-label="Сотрудничество" />
    </template>

    <template #filters>
      <UInput
        v-model="q"
        type="search"
        size="xs"
        placeholder="Поиск"
        aria-label="Поиск клиентов"
        icon="i-heroicons-magnifying-glass-20-solid"
        class="w-full sm:w-64 shrink-0 sm:ml-auto"
      />
    </template>

    <section class="bg-white rounded-2xl shadow-card overflow-hidden">
      <div class="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 max-w-full">
        <table class="w-full block md:table">
          <thead class="hidden md:table-header-group">
            <tr class="border-b border-zinc-100">
              <th class="text-left text-xs font-medium text-zinc-500 whitespace-nowrap px-4 lg:px-6 py-3">Клиент</th>
              <th class="text-left text-xs font-medium text-zinc-500 whitespace-nowrap px-3 py-3">Сотрудничество</th>
              <th class="text-left text-xs font-medium text-zinc-500 whitespace-nowrap px-3 py-3">Контакт</th>
              <th class="text-left text-xs font-medium text-zinc-500 whitespace-nowrap px-3 py-3">Бриф</th>
              <th class="text-right text-xs font-medium text-zinc-500 whitespace-nowrap px-4 lg:px-6 py-3">Проектов</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 block md:table-row-group">
            <tr
              v-for="c in visible"
              :key="c.id"
              class="hover:bg-zinc-50/50 transition grid grid-cols-2 gap-x-4 gap-y-3 p-4 md:p-0 md:table-row align-top"
              :class="c.isNew && 'bg-accent/5'"
            >
              <td class="md:px-4 lg:px-6 md:py-3 lg:py-4 col-span-2 md:col-span-1">
                <div class="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <NuxtLink :to="`/clients/${c.id}`" class="text-sm font-semibold hover:underline">{{ c.name }}</NuxtLink>
                  <span :class="[CHIP, STATUS[c.status][0]]"><span class="w-1.5 h-1.5 rounded-full" :class="STATUS[c.status][1]" />{{ STATUS[c.status][2] }}</span>
                </div>
                <div class="text-xs text-zinc-500 mt-0.5">{{ c.contact }}{{ c.phone ? ' · ' + c.phone : '' }}</div>
              </td>
              <td data-label="Сотрудничество" :class="TD"><div class="text-sm text-zinc-700">{{ c.since }}</div></td>
              <td data-label="Контакт" :class="TD">
                <div class="text-sm">{{ c.contact }}</div>
                <div class="text-xs text-zinc-500 mt-0.5">{{ c.email }}</div>
              </td>
              <td data-label="Бриф" :class="TD">
                <div v-if="c.brief.state === 'filled'" class="flex items-center gap-2">
                  <span :class="[CHIP, 'bg-emerald-50 text-emerald-700']"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />Заполнен</span>
                  <span class="text-xs text-zinc-500 tabular-nums">{{ c.brief.date }}</span>
                </div>
                <div v-else-if="c.brief.state === 'sent'" class="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span :class="[CHIP, 'bg-amber-50 text-amber-700']"><span class="w-1.5 h-1.5 rounded-full bg-amber-500" />Отправлен {{ c.brief.date }}</span>
                  <span v-if="c.brief.reminded" class="text-xs text-zinc-500">напомнили {{ c.brief.reminded }}</span>
                  <AccessGate :allowed="can('client.manage')" :tip="MANAGE_TIP">
                    <button type="button" :disabled="!can('client.manage')" :data-deny-tip="MANAGE_TIP" :class="LINK" @click="remind(c)">Напомнить</button>
                  </AccessGate>
                </div>
                <div v-else class="flex items-center gap-2">
                  <span :class="[CHIP, 'bg-zinc-100 text-zinc-600']"><span class="w-1.5 h-1.5 rounded-full bg-zinc-400" />Не отправлен</span>
                  <AccessGate :allowed="can('client.manage')" :tip="MANAGE_TIP">
                    <button type="button" :disabled="!can('client.manage')" :data-deny-tip="MANAGE_TIP" :class="LINK" @click="openBrief(c.id)">Отправить</button>
                  </AccessGate>
                </div>
              </td>
              <td data-label="Проектов" class="md:px-4 lg:px-6 md:py-3 lg:py-4 md:text-right text-sm min-w-0 before:block before:text-[11px] before:text-zinc-500 before:mb-0.5 before:content-[attr(data-label)] md:before:hidden">
                <template v-if="c.projects.length">
                  <button
                    type="button"
                    :aria-expanded="expanded[c.id] ? 'true' : 'false'"
                    class="inline-flex items-center gap-1 px-2 py-0.5 -mx-2 rounded-lg tabular-nums font-medium hover:bg-zinc-100 transition"
                    @click="expanded[c.id] = !expanded[c.id]"
                  >
                    {{ c.projects.length }}<svg class="w-3.5 h-3.5 text-zinc-400 transition-transform" :class="expanded[c.id] && 'rotate-180'" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <ul class="mt-2 space-y-1.5 md:min-w-[240px] text-left" :class="!expanded[c.id] && 'hidden'">
                    <li v-for="p in c.projects" :key="p.id">
                      <NuxtLink :to="`/projects/${p.id}`" class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-50 hover:bg-zinc-100 transition">
                        <span :title="PSTATUS[p.status][1]" class="w-1.5 h-1.5 rounded-full shrink-0" :class="PSTATUS[p.status][0]" />
                        <span class="min-w-0">
                          <span class="block text-xs font-medium truncate">{{ p.name }}</span>
                          <span class="block text-[11px] text-zinc-500 truncate">{{ p.site }} · {{ PSTATUS[p.status][1].toLowerCase() }}</span>
                        </span>
                      </NuxtLink>
                    </li>
                  </ul>
                </template>
                <span v-else class="text-zinc-400 tabular-nums">0</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="px-4 lg:px-6 py-4 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
        <div class="text-sm text-zinc-500">
          Показано <span class="tabular-nums text-zinc-900 font-medium">{{ visible.length ? `1–${visible.length}` : '0' }}</span> из <span class="tabular-nums text-zinc-900 font-medium">{{ clients.length }}</span>
        </div>
        <div class="flex items-center gap-2 text-sm text-zinc-500">
          <span>На странице</span>
          <USelect v-model="perPage" :options="['10', '20', '50', 'Все']" size="xs" />
        </div>
      </div>
    </section>

    <ModalsClientCreate v-model="createOpen" @created="onCreated" @brief-sent="onBriefSent" />
    <ModalsBriefSend v-model="briefOpen" :prefill-client="briefClient" :extra-clients="createdClients" @sent="onBriefSent" />
  </PageRegistry>
</template>
