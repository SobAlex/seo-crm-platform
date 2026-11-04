<script setup lang="ts">
// client.html → Сетка 2 (Split): шапка клиента и сводка сверху, проекты / история / комментарии слева, бриф / контакты / документы справа.
import { shortName } from '~/constants/directory'
import { clientMono, type ClientUpdated } from '~/types/clients'

definePageMeta({ roles: ['owner', 'seo_head', 'mgr_head', 'pm', 'employee'] })
useHead({ title: 'Клиент · Холод Групп — SEO Control' })

const { can, user } = useRole()
const notify = useNotify()

const route = useRoute()
const crumbName = ref('Холод Групп')
const crumbs = computed(() => [
  { label: 'Главная', to: '/' },
  { label: 'Клиенты', to: '/clients' },
  { label: crumbName.value }
])
const MANAGE_TIP = 'Управление клиентами доступно менеджерам и руководству'
const PROJECT_TIP = 'Создание проектов доступно менеджеру или руководству'
const INVITE_TIP = 'Приглашать в портал может владелец или руководитель отдела'

const client = ref({
  name: 'ООО «Холод Групп»',
  meta: 'ИНН 7701234567 · Москва · в базе с 01.05.2025',
  rate: '2 500'
})
const logo = ref('')
const mono = computed(() => clientMono(client.value.name || 'Холод Групп', 'ХГ'))
onMounted(async () => {
  try { logo.value = localStorage.getItem('seo_client_logo_holod') || '' } catch { /* ignore */ }
  try {
    const row = await $fetch<{
      name: string
      inn: string | null
      city: string | null
      since: string
      ratePerHour: number | null
      contactPerson: string
      contactPosition: string
      email: string
      phone: string
      projects: { id: string; name: string; site: string; status: string }[]
    }>(`/api/clients/${route.params.id}`, { credentials: 'include' })
    client.value.name = row.name
    crumbName.value = row.name.replace(/^ООО |^АО |^ИП /, '')
    client.value.meta = [row.inn ? `ИНН ${row.inn}` : '', row.city || '', row.since].filter(Boolean).join(' · ')
    if (row.ratePerHour != null) client.value.rate = row.ratePerHour.toLocaleString('ru-RU')
    if (row.contactPerson) {
      contacts.value.splice(0, 1, { name: row.contactPerson, post: row.contactPosition || '', email: row.email, phone: row.phone || '' })
    }
    if (row.projects.length) {
      projects.value = row.projects.map(project => ({
        id: project.id,
        name: project.name,
        site: project.site,
        status: project.status === 'active'
          ? { label: 'Активен', badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-600' }
          : { label: 'На паузе', badge: 'bg-zinc-100 text-zinc-700', dot: 'bg-zinc-500' },
        fee: '—'
      }))
    }
  } catch { /* карточка прототипа остаётся, если сервер недоступен */ }
})

const projects = ref([
  { id: 'holod', name: 'Интернет-магазин «Холод»', site: 'holod-shop.ru', status: { label: 'Активен', badge: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-600' }, fee: '240 000 ₽' },
  { id: 'holodb2b', name: 'Оптовый портал «Холод B2B»', site: 'b2b.holod-shop.ru', status: { label: 'Запуск', badge: 'bg-blue-50 text-blue-700', dot: 'bg-blue-600' }, fee: '90 000 ₽' }
])

const HISTORY = [
  { text: 'Отправлен бриф по проекту «Холод B2B»', date: '12.06.2025' },
  { text: 'Создан проект «Холод B2B»', date: '10.06.2025' },
  { text: 'Создан проект «Холод»', date: '01.05.2025' },
  { text: 'Подписан договор на 6 мес', date: '28.04.2025' },
  { text: 'Проведена встреча-знакомство', date: '22.04.2025' }
]

// Лента комментариев (data-thread).
const comments = ref([
  { initials: 'ИС', name: 'И. Сидоров', time: '10.05, 12:30', text: 'Клиент просит ускорить техаудит. Добавить в план на следующую неделю.' },
  { initials: 'ОВ', name: 'О. Ветрова', time: '06.05, 15:45', text: 'Обсудили бюджет на Q3. Клиент готов рассмотреть увеличение чека при росте трафика на 30%.' },
  { initials: 'ИС', name: 'И. Сидоров', time: '02.05, 10:15', text: 'Старт проекта. Согласовали приоритеты: техника, потом семантика, потом контент.' }
])
const draft = ref('')
const draftBox = ref<HTMLElement | null>(null)
function sendComment() {
  const text = draft.value.trim()
  if (!text) {
    draftBox.value?.querySelector('textarea')?.focus()
    notify('Напишите комментарий')
    return
  }
  const now = new Date()
  comments.value.unshift({
    initials: user.value.initials,
    name: shortName(user.value.name),
    time: String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0'),
    text
  })
  draft.value = ''
  notify('Комментарий добавлен')
}

const contacts = ref([
  { name: 'Сергей Волков', post: 'Директор по маркетингу', email: 's.volkov@holod.ru', phone: '+7 495 123-45-67' },
  { name: 'Анна Морозова', post: 'Менеджер проекта', email: 'a.morozova@holod.ru', phone: '' }
])
const docs = ref(['Договор №1205', 'ТЗ на квартал Q2'])

// Бриф: «Холод» — заполнен; состояние «отправлен» оставлено для других клиентов.
const briefState = ref<'filled' | 'sent'>('filled')
const BRIEF_LINK = 'https://romashka.seo-control.app/brief/holod-7f3a'
function copyBriefLink() {
  navigator.clipboard?.writeText(BRIEF_LINK).catch(() => {})
  notify('Ссылка на бриф скопирована', 'success')
}

// data-attach: выбор файла, тост; в «Документах» файл добавляется в список.
const picker = ref<HTMLInputElement | null>(null)
const attachTarget = ref<'thread' | 'docs'>('thread')
function attach(target: 'thread' | 'docs', accept = '') {
  if (!picker.value) return
  attachTarget.value = target
  picker.value.accept = accept
  picker.value.click()
}
function onPicked() {
  const f = picker.value?.files?.[0]
  if (!f) return
  notify(`Файл «${f.name}» прикреплён`)
  if (attachTarget.value === 'docs') docs.value.push(f.name)
  picker.value!.value = ''
}

// Окна.
const briefOpen = ref(false)
const inviteOpen = ref(false)
const editOpen = ref(false)
const projectOpen = ref(false)

function onUpdated(c: ClientUpdated) {
  client.value.name = c.name
  client.value.meta = `ИНН ${c.inn} · ${c.city} · в базе с 01.05.2025`
  if (c.rate) client.value.rate = (+c.rate).toLocaleString('ru-RU')
  const first = contacts.value[0]!
  first.name = c.contact
  first.post = c.post || ''
  first.email = c.email
  first.phone = c.phone || ''
  if (c.logo) logo.value = c.logo
}

const TD = 'md:px-3 md:py-3 lg:py-4 text-sm min-w-0 before:block before:text-[11px] before:text-zinc-500 before:mb-0.5 before:content-[attr(data-label)] md:before:hidden'
const DOC_ICON = 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
</script>

<template>
  <PageSplit :back="{ to: '/clients', label: 'Клиенты' }" :crumbs="crumbs">
    <template #title>
      <h1 :title="client.name" class="text-base font-semibold tracking-tight text-ink leading-none truncate max-w-[200px]">{{ client.name }}</h1>
    </template>

    <template #actions>
      <AccessGate :allowed="can('client.manage')" :tip="MANAGE_TIP">
        <UButton color="white" class="rounded-full hidden sm:inline-flex" :disabled="!can('client.manage')" :data-deny-tip="MANAGE_TIP" @click="briefOpen = true">Отправить бриф</UButton>
      </AccessGate>
      <AccessGate :allowed="can('users.invite')" :tip="INVITE_TIP">
        <UButton color="white" class="rounded-full hidden md:inline-flex" :disabled="!can('users.invite')" :data-deny-tip="INVITE_TIP" @click="inviteOpen = true">Пригласить в портал</UButton>
      </AccessGate>
      <AccessGate :allowed="can('client.manage')" :tip="MANAGE_TIP">
        <UButton color="white" class="rounded-full" :disabled="!can('client.manage')" :data-deny-tip="MANAGE_TIP" @click="editOpen = true">
          <span class="sm:hidden">Изменить</span><span class="hidden sm:inline">Редактировать</span>
        </UButton>
      </AccessGate>
      <AccessGate :allowed="can('project.create')" :tip="PROJECT_TIP">
        <UButton :disabled="!can('project.create')" :data-deny-tip="PROJECT_TIP" @click="projectOpen = true">+ Проект</UButton>
      </AccessGate>
    </template>

    <template #top>
      <div class="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5">
        <div v-if="logo" class="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl overflow-hidden shrink-0">
          <img :src="logo" alt="" class="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl object-contain bg-white border border-zinc-200 p-1">
        </div>
        <div v-else class="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-zinc-900 text-white text-lg lg:text-xl font-semibold flex items-center justify-center shrink-0 overflow-hidden">{{ mono }}</div>
        <div>
          <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 class="text-2xl lg:text-3xl font-semibold tracking-tight">{{ client.name }}</h2>
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />Активный</span>
          </div>
          <p class="text-sm text-zinc-500 mt-1">{{ client.meta }}</p>
        </div>
      </div>

      <section class="grid grid-cols-2 gap-3 lg:gap-4">
        <div class="bg-white rounded-2xl shadow-card p-4 lg:p-5">
          <div class="text-xs font-medium text-zinc-500 mb-2">Проектов</div>
          <a href="#client-projects" class="inline-flex items-baseline gap-2 group">
            <span class="text-2xl font-semibold tracking-tight tabular-nums">2</span>
            <span class="text-xs text-zinc-500 group-hover:text-zinc-900 group-hover:underline">1 активный · 1 на запуске</span>
          </a>
        </div>
        <div v-if="can('finance.fee.view')" class="bg-white rounded-2xl shadow-card p-4 lg:p-5">
          <div class="text-xs font-medium text-zinc-500 mb-2">Ставка</div>
          <div class="text-2xl font-semibold tracking-tight tabular-nums"><span>{{ client.rate }}</span> <span class="text-sm font-normal text-zinc-500">₽/ч</span></div>
        </div>
      </section>
    </template>

    <section id="client-projects" class="bg-white rounded-2xl shadow-card overflow-hidden scroll-mt-20">
      <div class="px-4 lg:px-6 py-4 flex items-center justify-between gap-3">
        <div class="min-w-0">
          <h3 class="text-sm font-semibold tracking-tight">Проекты клиента</h3>
          <p class="text-xs text-zinc-500 mt-0.5">2 сайта</p>
        </div>
        <AccessGate :allowed="can('project.create')" :tip="PROJECT_TIP">
          <UButton :disabled="!can('project.create')" :data-deny-tip="PROJECT_TIP" class="gap-1.5" @click="projectOpen = true">+ Новый проект</UButton>
        </AccessGate>
      </div>
      <div class="overflow-x-auto border-t border-zinc-100">
        <table class="w-full block md:table">
          <thead class="hidden md:table-header-group">
            <tr class="border-b border-zinc-100">
              <th class="text-left text-xs font-medium text-zinc-500 px-4 lg:px-6 py-3">Проект</th>
              <th class="text-left text-xs font-medium text-zinc-500 px-3 py-3">Статус</th>
              <th v-if="can('finance.fee.view')" class="text-right text-xs font-medium text-zinc-500 px-4 lg:px-6 py-3">Чек</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 block md:table-row-group">
            <tr v-for="p in projects" :key="p.id" class="hover:bg-zinc-50/50 transition grid grid-cols-2 gap-x-4 gap-y-3 p-4 md:p-0 md:table-row">
              <td class="md:px-4 lg:px-6 md:py-3 lg:py-4 col-span-2 md:col-span-1">
                <NuxtLink :to="`/projects/${p.id}`" class="text-sm font-medium hover:underline">{{ p.name }}</NuxtLink>
                <div class="text-xs text-zinc-500 mt-0.5">{{ p.site }}</div>
              </td>
              <td data-label="Статус" :class="TD">
                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap" :class="p.status.badge"><span class="w-1.5 h-1.5 rounded-full" :class="p.status.dot" />{{ p.status.label }}</span>
              </td>
              <td v-if="can('finance.fee.view')" data-label="Чек" :class="[TD, 'md:px-4 lg:px-6 md:text-right whitespace-nowrap tabular-nums']">{{ p.fee }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="bg-white rounded-2xl shadow-card overflow-hidden">
      <div class="px-4 lg:px-6 py-4">
        <h3 class="text-sm font-semibold tracking-tight">История взаимодействия</h3>
      </div>
      <ul class="divide-y divide-zinc-100 border-t border-zinc-100 text-sm">
        <li v-for="h in HISTORY" :key="h.date" class="px-4 lg:px-6 py-3 flex items-center justify-between gap-3">
          <span>{{ h.text }}</span>
          <span class="text-xs text-zinc-500 tabular-nums shrink-0">{{ h.date }}</span>
        </li>
      </ul>
    </section>

    <section class="bg-white rounded-2xl shadow-card overflow-hidden">
      <div class="px-4 lg:px-6 py-4 flex items-center justify-between">
        <h3 class="text-sm font-semibold tracking-tight">Комментарии</h3>
        <span class="text-xs text-zinc-500">{{ comments.length }} {{ plural(comments.length, ['сообщение', 'сообщения', 'сообщений']) }}</span>
      </div>
      <ul class="divide-y divide-zinc-100 border-t border-zinc-100">
        <li v-for="m in comments" :key="`${m.time}-${m.text}`" class="p-4 lg:p-5">
          <div class="flex gap-3">
            <span class="w-8 h-8 shrink-0 rounded-full bg-zinc-900 text-white text-[10px] font-semibold flex items-center justify-center">{{ m.initials }}</span>
            <div class="flex-1 min-w-0">
              <div class="flex flex-wrap items-baseline gap-x-2 mb-1">
                <span class="text-sm font-medium">{{ m.name }}</span>
                <span class="text-xs text-zinc-500">{{ m.time }}</span>
              </div>
              <p class="text-sm text-zinc-600 whitespace-pre-line">{{ m.text }}</p>
            </div>
          </div>
        </li>
      </ul>

      <div class="border-t border-zinc-100 p-4 lg:p-5 bg-zinc-50">
        <div ref="draftBox"><UTextarea v-model="draft" :rows="3" resize size="md" placeholder="Написать комментарий..." textarea-class="bg-white" /></div>
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
          <UButton color="white" size="md" class="rounded-full justify-center gap-2" @click="attach('thread')">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            Прикрепить файл
          </UButton>
          <UButton class="justify-center" @click="sendComment">Отправить</UButton>
        </div>
      </div>
    </section>

    <template #aside>
      <section class="bg-white rounded-2xl shadow-card overflow-hidden">
        <div class="px-4 lg:px-6 py-4 flex items-center justify-between gap-3">
          <h3 class="text-sm font-semibold tracking-tight">Бриф</h3>
          <AccessGate :allowed="can('client.manage')" :tip="MANAGE_TIP">
            <button type="button" :disabled="!can('client.manage')" :data-deny-tip="MANAGE_TIP" class="text-xs text-zinc-500 hover:text-zinc-900 transition shrink-0 disabled:opacity-50" @click="briefOpen = true">Отправить ещё</button>
          </AccessGate>
        </div>
        <div class="px-4 lg:px-6 pb-5 space-y-4 border-t border-zinc-100 pt-4">
          <div v-show="briefState === 'filled'" class="space-y-4">
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />Заполнен 03.05.2025</span>
            <p class="text-xs text-zinc-500">Заполнил: Сергей Волков (Директор по маркетингу)</p>
            <UButton to="/brief?client=holod" color="black" block class="rounded-full">Посмотреть ответы клиента</UButton>
          </div>
          <div v-show="briefState === 'sent'" class="space-y-4">
            <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 whitespace-nowrap"><span class="w-1.5 h-1.5 rounded-full bg-amber-500" />Отправлен 12.06.2025</span>
            <div class="flex items-center gap-2">
              <UInput :model-value="BRIEF_LINK" readonly aria-label="Ссылка на бриф" class="flex-1 min-w-0" input-class="text-zinc-700 tabular-nums truncate" />
              <UButton color="white" class="rounded-full shrink-0 px-3" @click="copyBriefLink">Скопировать ссылку</UButton>
            </div>
            <AccessGate :allowed="can('client.manage')" :tip="MANAGE_TIP" block>
              <UButton color="white" block class="rounded-full" :disabled="!can('client.manage')" :data-deny-tip="MANAGE_TIP" @click="notify('Напоминание отправлено', 'success')">Напомнить клиенту</UButton>
            </AccessGate>
          </div>
        </div>
      </section>

      <section class="bg-white rounded-2xl shadow-card overflow-hidden">
        <div class="px-4 lg:px-6 py-4">
          <h3 class="text-sm font-semibold tracking-tight">Контакты</h3>
        </div>
        <ul class="divide-y divide-zinc-100 border-t border-zinc-100 text-sm">
          <li v-for="(p, i) in contacts" :key="i" class="p-4 lg:p-5">
            <div class="font-medium">{{ p.name }}</div>
            <div class="text-xs text-zinc-500 mt-0.5">{{ p.post }}</div>
            <div class="mt-3 text-sm text-zinc-700">{{ p.email }}</div>
            <div v-if="p.phone" class="text-sm text-zinc-700">{{ p.phone }}</div>
          </li>
        </ul>
      </section>

      <section class="bg-white rounded-2xl shadow-card overflow-hidden">
        <div class="px-4 lg:px-6 py-4 flex items-center justify-between">
          <h3 class="text-sm font-semibold tracking-tight">Документы</h3>
          <AccessGate :allowed="can('client.manage')" :tip="MANAGE_TIP">
            <button type="button" :disabled="!can('client.manage')" :data-deny-tip="MANAGE_TIP" class="text-xs text-zinc-500 hover:text-zinc-900 transition disabled:opacity-50" @click="attach('docs', '.pdf,.doc,.docx,.xlsx')">+ Загрузить</button>
          </AccessGate>
        </div>
        <ul class="divide-y divide-zinc-100 border-t border-zinc-100 text-sm">
          <li v-for="(d, i) in docs" :key="i" class="px-4 lg:px-6 py-3 flex items-center gap-3">
            <svg class="w-4 h-4 text-zinc-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="DOC_ICON" /></svg>
            <span class="truncate flex-1">{{ d }}</span>
          </li>
        </ul>
      </section>
    </template>

    <template #bottom>
      <input ref="picker" type="file" class="hidden" @change="onPicked">
      <ModalsBriefSend v-model="briefOpen" prefill-client="holod" />
      <ModalsClientInvite v-model="inviteOpen" prefill-client="holod" />
      <ModalsClientEdit v-model="editOpen" @updated="onUpdated" />
      <ModalsProjectCreate v-model="projectOpen" prefill-client="holod" />
    </template>
  </PageSplit>
</template>
