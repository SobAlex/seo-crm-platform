<script setup lang="ts">
// calendar.html → Сетка 2 (Split 2:1): вкладки сверху; календарь месяца слева, дедлайны недели и «Сегодня» справа.
// Вкладки «Уведомления» и «Настройки» — на всю ширину под сеткой.
definePageMeta({ roles: ['owner', 'seo_head', 'mgr_head', 'pm', 'employee'] })
useHead({ title: 'Календарь — SEO Control' })

const { can } = useRole()
const notify = useNotify()

const TODAY = '2025-06-18'

const tab = ref('calendar')
const tabOptions = [
  { value: 'calendar', label: 'Календарь' },
  { value: 'notifications', label: 'Уведомления' },
  { value: 'settings', label: 'Настройки' }
]

// Слои: дедлайны задач спринта, окно отчётов (1–5 число), отпуска, оплаты клиентов.
const DEADLINES = [
  { d: '2025-06-09', title: 'Настройка целей в Метрике', p: 'МедЛайф' },
  { d: '2025-06-10', title: 'Оптимизация карточек услуг', p: 'Ремонт+' },
  { d: '2025-06-12', title: 'Дубли Title на пагинации', p: 'Ремонт+' },
  { d: '2025-06-16', title: 'Мета-теги категорий', p: 'Ремонт+' },
  { d: '2025-06-17', title: 'Canonical для фильтров', p: 'Холод' },
  { d: '2025-06-18', title: 'Проверить индексацию в GSC', p: 'Холод' },
  { d: '2025-06-19', title: 'Кластеризация «Морозильники»', p: 'Холод' },
  { d: '2025-06-20', title: 'Статья «Как выбрать холодильник»', p: 'Холод' },
  { d: '2025-06-20', title: 'Перелинковка статей блога', p: 'Ремонт+' },
  { d: '2025-06-21', title: 'Тексты для 5 страниц услуг', p: 'МедЛайф' },
  { d: '2025-06-22', title: 'Сбор семантики', p: 'Холод' },
  { d: '2025-06-25', title: 'Микроразметка Organization', p: 'МедЛайф' },
  { d: '2025-06-26', title: 'ТЗ копирайтеру на тексты услуг', p: 'Ремонт+' },
  { d: '2025-06-30', title: 'Стратегия по наращиванию ссылок', p: 'Холод' },
  { d: '2025-07-04', title: 'Посадочные для услуг', p: 'Ремонт+' }
]
const VACATIONS = [
  { who: 'Н. Морозов', ini: 'НМ', from: '2025-06-16', to: '2025-06-29' },
  { who: 'И. Дронов', ini: 'ИД', from: '2025-06-30', to: '2025-07-04' },
  { who: 'А. Петров', ini: 'АП', from: '2025-07-14', to: '2025-07-28' },
  { who: 'М. Ким', ini: 'МК', from: '2025-05-12', to: '2025-05-16' }
]
const PAYMENTS = [
  { day: 5, client: 'Стройтех', sum: '180 000 ₽', until: '2025-05' },
  { day: 10, client: 'Холод', sum: '240 000 ₽' },
  { day: 15, client: 'Ремонт+', sum: '120 000 ₽' },
  { day: 20, client: 'МедЛайф', sum: '80 000 ₽' },
  { day: 25, client: 'Холод B2B', sum: '90 000 ₽', from: '2025-06' }
]

const month = ref('2025-06')
const layers = reactive({ deadline: true, report: true, vacation: true, payment: true })
const LAYERS = [
  { key: 'deadline', label: 'Дедлайны', cls: 'bg-blue-50 text-blue-700 ring-blue-100', dot: 'bg-blue-500' },
  { key: 'report', label: 'Отчёты', cls: 'bg-violet-50 text-violet-700 ring-violet-100', dot: 'bg-purple-500' },
  { key: 'vacation', label: 'Отпуска', cls: 'bg-zinc-100 text-zinc-700 ring-zinc-200', dot: 'bg-zinc-400' },
  { key: 'payment', label: 'Оплаты', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-100', dot: 'bg-emerald-500' }
] as const

// Дедлайны недели 16–22 июня: карточка ведёт в задачу, без отметки выполнения.
const DOW = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
const week = DEADLINES.filter(t => t.d >= '2025-06-16' && t.d <= '2025-06-22').map(t => {
  const day = new Date(+t.d.slice(0, 4), +t.d.slice(5, 7) - 1, +t.d.slice(8))
  const late = t.d < TODAY
  const today = t.d === TODAY
  return {
    ...t,
    label: today ? 'Сегодня' : `${DOW[day.getDay()]}, ${t.d.slice(8)}.${t.d.slice(5, 7)}`,
    tone: late ? 'text-red-600 font-medium' : today ? 'text-accent font-medium' : 'text-zinc-500'
  }
})

const NOTIFICATIONS = [
  { icon: 'clock', tone: 'bg-blue-50 text-blue-600', pre: 'Вам назначена задача ', link: 'T-014 Дубли Title на пагинации', meta: '14.06, 10:15 · Холод', when: '2 ч назад' },
  { icon: 'warn', tone: 'bg-amber-50 text-amber-600', pre: 'Задача просрочена: ', link: 'T-010 Микроразметка Organization', meta: 'Дедлайн был 25.06 · Стройтех', when: '5 ч назад' },
  { icon: 'check', tone: 'bg-emerald-50 text-emerald-700', pre: 'Задача принята: ', link: 'T-011 Шаблон FAQ', meta: 'Ремонт+', when: 'вчера' }
] as const

const SETTINGS_ROWS = ref([
  { label: 'Назначена задача', sys: true, email: true, digest: false },
  { label: 'Комментарий к задаче', sys: true, email: false, digest: true },
  { label: 'Дедлайн близко', sys: true, email: true, digest: false },
  { label: 'Задача просрочена', sys: true, email: true, digest: false },
  { label: 'Мои напоминания', sys: true, email: true, digest: false },
  { label: 'События календаря', sys: true, email: true, digest: false },
  { label: 'Интеграция требует внимания', sys: true, email: true, digest: false }
])
const quietFrom = ref('22:00')
const quietTo = ref('08:00')
const digest = ref('daily')
const DIGEST = [
  { value: 'daily', label: 'Ежедневно утром' },
  { value: 'weekly', label: 'Раз в неделю (пн утром)' },
  { value: 'off', label: 'Отключить дайджест' }
]

const eventOpen = ref(false)
const eventDate = ref<string>()
function openEvent(date?: string) {
  eventDate.value = date
  eventOpen.value = true
}

const CHECK_TD = 'md:px-3 md:py-3 text-center min-w-0 before:block before:text-[11px] before:text-zinc-500 before:mb-0.5 before:content-[attr(data-label)] md:before:hidden'
</script>

<template>
  <PageSplit title="Календарь">
    <template #actions>
      <UButton @click="openEvent()"><span class="sm:hidden">+ Создать</span><span class="hidden sm:inline">+ Создать событие</span></UButton>
    </template>

    <template #top>
      <div class="bg-white rounded-2xl shadow-card w-full max-w-full overflow-hidden p-3 lg:p-3.5">
        <UiSegmented v-model="tab" :options="tabOptions" hash aria-label="Календарь" />
      </div>
    </template>

    <template v-if="tab === 'calendar'">
      <section class="bg-white rounded-2xl shadow-card overflow-hidden">
        <div class="px-4 lg:px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100">
          <UiMonthNav v-model="month" min="2025-01" max="2025-12" />
          <div class="flex items-center gap-1.5 max-w-full overflow-x-auto no-scrollbar shrink-0" role="group" aria-label="Слои календаря">
            <button
              v-for="l in LAYERS"
              :key="l.key"
              type="button"
              :aria-pressed="layers[l.key] ? 'true' : 'false'"
              class="shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ring-1 transition aria-[pressed=false]:opacity-40 aria-[pressed=false]:ring-zinc-200 aria-[pressed=false]:bg-white aria-[pressed=false]:text-zinc-500"
              :class="l.cls"
              @click="layers[l.key] = !layers[l.key]"
            >
              <span class="w-2 h-2 rounded-full" :class="l.dot" aria-hidden="true" /><span class="hidden sm:inline">{{ l.label }}</span>
            </button>
          </div>
        </div>

        <div class="p-2 sm:p-4 lg:p-6">
          <div class="grid grid-cols-7 gap-1 text-center text-xs text-zinc-500 mb-2">
            <div>Пн</div><div>Вт</div><div>Ср</div><div>Чт</div><div>Пт</div><div>Сб</div><div>Вс</div>
          </div>
          <CalendarMonthGrid
            :month="month"
            :layers="layers"
            :today="TODAY"
            :deadlines="DEADLINES"
            :vacations="VACATIONS"
            :payments="PAYMENTS"
            :finance="can('finance.fee.view')"
            @add="openEvent"
          />
          <p class="mt-3 text-[11px] text-zinc-400">1–5 число — окно подготовки клиентских отчётов. Нажмите на день, чтобы добавить напоминание или событие.</p>
        </div>
      </section>
    </template>

    <template v-if="tab === 'calendar'" #aside>
      <section class="bg-white rounded-2xl shadow-card overflow-hidden">
        <div class="px-4 lg:px-6 py-4 flex items-center justify-between gap-3 border-b border-zinc-100">
          <div>
            <h3 class="text-sm font-semibold tracking-tight">Ближайшие дедлайны на этой неделе</h3>
            <p class="text-xs text-zinc-500 mt-0.5 tabular-nums">16–22 июня · <span>{{ week.length }}</span> осталось</p>
          </div>
          <NuxtLink to="/tasks" class="text-xs text-zinc-500 hover:text-zinc-900 transition shrink-0">Все →</NuxtLink>
        </div>
        <ul class="divide-y divide-zinc-100">
          <li v-for="t in week" :key="t.d + t.title" class="px-3 py-1.5">
            <NuxtLink to="/tasks/1" class="flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-canvas hover:bg-zinc-100 transition">
              <span class="min-w-0 flex-1">
                <span class="block text-sm font-medium truncate">{{ t.title }}</span>
                <span class="block text-xs text-zinc-500 mt-0.5">{{ t.p }}</span>
              </span>
              <span class="text-xs tabular-nums shrink-0" :class="t.tone">{{ t.label }}</span>
            </NuxtLink>
          </li>
        </ul>
      </section>

      <section class="bg-white rounded-2xl shadow-card overflow-hidden">
        <div class="px-4 lg:px-6 py-4 flex items-center justify-between border-b border-zinc-100">
          <h3 class="text-sm font-semibold tracking-tight">Сегодня</h3>
          <span class="text-xs text-zinc-500">среда, 18 июня</span>
        </div>
        <ul class="divide-y divide-zinc-100">
          <li class="px-4 lg:px-5 py-3 flex items-start gap-3">
            <span class="w-1.5 h-1.5 rounded-full bg-violet-500 mt-2 shrink-0" />
            <div class="min-w-0 flex-1">
              <NuxtLink to="/reports/2025-05" class="text-sm font-medium hover:underline">Согласовать отчёт МедЛайф за май</NuxtLink>
              <div class="text-xs text-zinc-500 mt-0.5">Напоминание · 15:00 · срок отчёта прошёл 05.06</div>
            </div>
          </li>
          <li class="px-4 lg:px-5 py-3 flex items-start gap-3">
            <span class="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-2 shrink-0" />
            <div class="min-w-0 flex-1">
              <div class="text-sm font-medium">Созвон с клиентом</div>
              <div class="text-xs text-zinc-500 mt-0.5">МедЛайф · 16:30</div>
            </div>
          </li>
        </ul>
      </section>
    </template>

    <template #bottom>
      <div v-if="tab === 'notifications'">
        <div class="mb-6"><p class="text-sm text-zinc-500">Все события, требующие внимания</p></div>

        <section class="bg-white rounded-2xl shadow-card overflow-hidden">
          <ul class="divide-y divide-zinc-100">
            <li v-for="n in NOTIFICATIONS" :key="n.link" class="px-4 lg:px-6 py-4 hover:bg-zinc-50/50 transition">
              <div class="flex items-start gap-3">
                <span class="w-8 h-8 rounded-full flex items-center justify-center shrink-0" :class="n.tone">
                  <svg v-if="n.icon === 'clock'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <svg v-else-if="n.icon === 'warn'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
                </span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm">{{ n.pre }}<NuxtLink to="/tasks/1" class="font-medium hover:underline">{{ n.link }}</NuxtLink></div>
                  <div class="text-xs text-zinc-500 mt-0.5">{{ n.meta }}</div>
                </div>
                <span class="text-xs text-zinc-500 shrink-0">{{ n.when }}</span>
              </div>
            </li>
            <li class="px-4 lg:px-6 py-4 hover:bg-zinc-50/50 transition">
              <div class="flex items-start gap-3">
                <span class="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm">Интеграция требует переподключения: <strong>Google Search Console</strong></div>
                  <div class="text-xs text-zinc-500 mt-0.5">Токен истёк 20.06.2025</div>
                </div>
                <NuxtLink to="/settings" class="text-xs text-zinc-500 hover:text-zinc-900 transition shrink-0">Перейти →</NuxtLink>
              </div>
            </li>
            <li class="px-4 lg:px-6 py-4 hover:bg-zinc-50/50 transition">
              <div class="flex items-start gap-3">
                <span class="w-8 h-8 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center shrink-0">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                </span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm">Новый комментарий от <strong>И. Сидорова</strong> к задаче <NuxtLink to="/tasks/1" class="font-medium hover:underline">T-014</NuxtLink></div>
                  <div class="text-xs text-zinc-500 mt-0.5">«Проверь ещё страницы с фильтрами»</div>
                </div>
                <span class="text-xs text-zinc-500 shrink-0">вчера</span>
              </div>
            </li>
          </ul>
        </section>
      </div>

      <div v-if="tab === 'settings'">
        <div class="mb-6"><p class="text-sm text-zinc-500">Выберите, какие уведомления получать и куда</p></div>

        <section class="bg-white rounded-2xl shadow-card overflow-hidden mb-4">
          <div class="overflow-x-auto">
            <table class="w-full block md:table">
              <thead class="hidden md:table-header-group">
                <tr class="border-b border-zinc-100">
                  <th class="text-left text-xs font-medium text-zinc-500 whitespace-nowrap px-4 lg:px-6 py-3">Событие</th>
                  <th class="text-center text-xs font-medium text-zinc-500 whitespace-nowrap px-3 py-3 w-20">В системе</th>
                  <th class="text-center text-xs font-medium text-zinc-500 whitespace-nowrap px-3 py-3 w-20">Email</th>
                  <th class="text-center text-xs font-medium text-zinc-500 whitespace-nowrap px-4 lg:px-6 py-3 w-20">Дайджест</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-100 block md:table-row-group">
                <tr v-for="r in SETTINGS_ROWS" :key="r.label" class="hover:bg-zinc-50/50 transition grid grid-cols-2 gap-x-4 gap-y-3 p-4 md:p-0 md:table-row">
                  <td class="md:px-4 lg:px-6 md:py-3 text-sm col-span-2 md:col-span-1">{{ r.label }}</td>
                  <td data-label="В системе" :class="CHECK_TD"><input v-model="r.sys" type="checkbox" class="w-4 h-4 rounded border-zinc-300"></td>
                  <td data-label="Email" :class="CHECK_TD"><input v-model="r.email" type="checkbox" class="w-4 h-4 rounded border-zinc-300"></td>
                  <td data-label="Дайджест" class="md:px-4 lg:px-6 md:py-3 text-center min-w-0 before:block before:text-[11px] before:text-zinc-500 before:mb-0.5 before:content-[attr(data-label)] md:before:hidden"><input v-model="r.digest" type="checkbox" class="w-4 h-4 rounded border-zinc-300"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="bg-white rounded-2xl shadow-card p-4 lg:p-6 mb-4">
          <h3 class="text-sm font-semibold tracking-tight mb-5">Тихие часы</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UiField label="С"><UInput v-model="quietFrom" type="time" /></UiField>
            <UiField label="До"><UInput v-model="quietTo" type="time" /></UiField>
          </div>
          <div class="text-xs text-zinc-500 mt-3">В это время email-уведомления не отправляются</div>
        </section>

        <section class="bg-white rounded-2xl shadow-card p-4 lg:p-6 mb-4">
          <h3 class="text-sm font-semibold tracking-tight mb-5">Дайджест</h3>
          <div class="space-y-2">
            <label
              v-for="o in DIGEST"
              :key="o.value"
              class="flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer"
              :class="digest === o.value ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-200 hover:bg-zinc-50'"
            >
              <input v-model="digest" type="radio" name="digest" :value="o.value" class="w-4 h-4 border-zinc-300">
              <span class="text-sm">{{ o.label }}</span>
            </label>
          </div>
        </section>

        <div class="flex flex-col sm:flex-row gap-3">
          <UButton @click="notify('Настройки уведомлений сохранены')">Сохранить настройки</UButton>
        </div>
      </div>
    </template>

    <CalendarEventModal v-model="eventOpen" :date="eventDate" />
  </PageSplit>
</template>
