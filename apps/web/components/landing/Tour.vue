<script setup lang="ts">
// «Возможности»: вертикальные вкладки слева, справа сценарий выбранного экрана кабинета.
const PRESSED = 'bg-white !text-ink shadow-[0_1px_2px_rgba(0,0,0,.04),0_0_0_1px_rgba(0,0,0,.06)]'

const TABS = [
  { id: 'map', label: 'Дорожные карты и планы', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7' },
  { id: 'board', label: 'Канбан задач и приёмка', icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2' },
  { id: 'portal', label: 'Клиентский портал', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { id: 'metrics', label: 'Аналитика метрик', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' }
]

const MAP_WORKS = [
  { title: 'Аудит технический', hours: '8 ч' },
  { title: 'Сбор семантики', hours: '10 ч' },
  { title: 'Перелинковка', hours: '4 ч' }
]
const BOARD = [
  { title: 'В работе', task: 'Кластеризация', box: 'bg-canvas', tone: 'text-zinc-500' },
  { title: 'На проверке', task: 'Индексация', box: 'bg-amber-50', tone: 'text-amber-700' },
  { title: 'На доработке', task: 'Нет таблицы URL', box: 'bg-canvas', tone: 'text-zinc-500' }
]
const PORTAL_KPI = [
  { label: 'Посетители', value: '23 120' },
  { label: 'Заявки', value: '287' },
  { label: 'Топ-10', value: '139' }
]
const PLAN_BARS = [
  { label: 'Трафик', pct: '94%', tone: 'text-amber-600', bar: 'bg-amber-500', width: 'w-[94%]' },
  { label: 'Лиды', pct: '108%', tone: 'text-emerald-600', bar: 'bg-emerald-500', width: 'w-full' },
  { label: 'Топ-10', pct: '114%', tone: 'text-emerald-600', bar: 'bg-emerald-500', width: 'w-full' }
]
const NOTES: Record<string, string[]> = {
  map: ['Карта копируется из шаблона типа проекта и дальше живёт уже в проекте.', 'У каждой работы есть роль исполнителя и часы — план месяца собирается из них.'],
  board: ['Принять или вернуть можно прямо из очереди на главной.', 'Причина возврата остаётся в задаче, а не в личной переписке.'],
  portal: ['Клиент видит результаты, согласования и отправленные отчёты.', 'Часы, ставки и внутренние комментарии в портал не попадают.'],
  metrics: ['Факт приходит из Метрики, Вебмастера и Search Console.', 'Процент плана открывает график за полгода, без отдельного статуса «хорошо/плохо».']
}

const tab = ref('map')
</script>

<template>
  <section id="features" class="px-4 sm:px-6 py-8 pb-16 scroll-mt-20">
    <div class="max-w-6xl mx-auto">
      <div class="max-w-2xl mb-8">
        <h2 class="text-3xl sm:text-4xl font-semibold tracking-tight">Возможности</h2>
        <p class="mt-3 text-zinc-500">Четыре экрана кабинета. Переключите вкладку — справа тот же сценарий, что увидит команда.</p>
      </div>
      <div class="grid lg:grid-cols-[16rem_minmax(0,1fr)] gap-4 items-start">
        <div class="flex lg:flex-col gap-1 overflow-x-auto bg-zinc-200/60 rounded-2xl p-1" role="group" aria-label="Экраны продукта">
          <button
            v-for="t in TABS"
            :key="t.id"
            type="button"
            :aria-pressed="tab === t.id"
            class="shrink-0 text-left px-3.5 py-2.5 rounded-xl text-sm font-medium text-zinc-500 transition inline-flex items-center gap-2.5"
            :class="tab === t.id && PRESSED"
            @click="tab = t.id"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" :d="t.icon" /></svg>{{ t.label }}
          </button>
        </div>
        <div class="bg-white rounded-3xl shadow-card p-4 sm:p-6 min-h-[22rem]">
          <div v-show="tab === 'map'">
            <div class="rounded-2xl bg-canvas p-4">
              <div class="text-xs text-zinc-500 mb-3">Интернет-магазин · месяц 1</div>
              <div class="flex flex-col gap-2">
                <div v-for="w in MAP_WORKS" :key="w.title" class="flex items-center justify-between rounded-xl bg-white px-3 py-2 shadow-card"><span class="text-sm">{{ w.title }}</span><span class="text-xs text-zinc-400">{{ w.hours }}</span></div>
              </div>
            </div>
          </div>
          <div v-show="tab === 'board'">
            <div class="grid grid-cols-3 gap-2">
              <div v-for="col in BOARD" :key="col.title" class="rounded-2xl p-3" :class="col.box"><div class="text-[11px] font-medium mb-2" :class="col.tone">{{ col.title }}</div><div class="rounded-xl bg-white px-2.5 py-2 text-xs shadow-card">{{ col.task }}</div></div>
            </div>
          </div>
          <div v-show="tab === 'portal'">
            <div class="rounded-2xl bg-canvas p-4">
              <div class="flex items-center justify-between"><div class="text-sm font-semibold">Май 2025</div><span class="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">Получен</span></div>
              <div class="mt-3 grid grid-cols-3 gap-2">
                <div v-for="k in PORTAL_KPI" :key="k.label" class="rounded-xl bg-white px-2.5 py-2 shadow-card"><div class="text-[11px] text-zinc-500">{{ k.label }}</div><div class="text-sm font-semibold tabular-nums">{{ k.value }}</div></div>
              </div>
            </div>
          </div>
          <div v-show="tab === 'metrics'">
            <div class="space-y-3">
              <div v-for="b in PLAN_BARS" :key="b.label"><div class="flex justify-between text-xs mb-1"><span>{{ b.label }}</span><span class="font-semibold" :class="b.tone">{{ b.pct }}</span></div><div class="h-1.5 rounded-full bg-zinc-100"><div class="h-full rounded-full" :class="[b.width, b.bar]" /></div></div>
            </div>
          </div>
          <ul class="mt-4 space-y-2 text-sm text-zinc-600">
            <li v-for="note in NOTES[tab]" :key="note">{{ note }}</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
