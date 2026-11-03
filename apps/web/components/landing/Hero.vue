<script setup lang="ts">
// Первый экран: оффер, две кнопки и макет кабинета «план и факт» + задачи по статусам.
defineEmits<{ signup: []; demo: [] }>()

const CHART_MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн']
const TASKS = [
  { status: 'На проверке', title: 'Индексация в GSC', box: 'bg-amber-50', tone: 'text-amber-700' },
  { status: 'На доработке', title: 'Мета-теги категорий', box: 'bg-zinc-50', tone: 'text-zinc-500' },
  { status: 'В отчёт', title: 'Сбор семантики · 10 ч', box: 'bg-emerald-50', tone: 'text-emerald-700' }
]
</script>

<template>
  <section class="px-4 sm:px-6 pt-12 sm:pt-20 pb-16">
    <div class="max-w-6xl mx-auto grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)] gap-10 lg:gap-14 items-center">
      <div>
        <p class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white shadow-card text-xs font-medium text-zinc-600 mb-5">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Создано практикующими руководителями SEO-агентств
        </p>
        <h1 class="text-4xl sm:text-5xl lg:text-[3.25rem] font-semibold tracking-tight leading-[1.08]">Операционная система для SEO-агентств и in-house команд</h1>
        <p class="mt-5 text-base sm:text-lg text-zinc-500 leading-relaxed max-w-xl">Дорожные карты проектов, приёмка задач по регламентам, прозрачная отчётность для клиентов в один клик и сквозной контроль нагрузки команды.</p>
        <div class="mt-8 flex flex-col sm:flex-row sm:flex-wrap gap-3">
          <UButton size="lg" class="px-5 justify-center rounded-full whitespace-nowrap" @click="$emit('signup')">Начать 14 дней триала без карты</UButton>
          <UButton size="lg" color="white" class="px-5 justify-center rounded-full whitespace-nowrap border-0 shadow-card" @click="$emit('demo')">Смотреть интерактивное демо</UButton>
        </div>
      </div>

      <div class="rounded-3xl bg-white shadow-card p-3 sm:p-4">
        <div class="rounded-2xl bg-canvas p-4 sm:p-5">
          <div class="flex items-center gap-2 mb-4">
            <span class="w-2.5 h-2.5 rounded-full bg-zinc-300" />
            <span class="w-2.5 h-2.5 rounded-full bg-zinc-300" />
            <span class="w-2.5 h-2.5 rounded-full bg-zinc-300" />
            <span class="ml-2 text-xs text-zinc-500">Холод · план и факт</span>
          </div>
          <div class="grid sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-3">
            <div class="rounded-2xl bg-white shadow-card p-4">
              <div class="flex items-end justify-between mb-3">
                <div>
                  <div class="text-xs text-zinc-500">Трафик</div>
                  <div class="text-xl font-semibold tabular-nums tracking-tight">24 380</div>
                </div>
                <span class="text-xs font-semibold text-amber-600">94% плана</span>
              </div>
              <svg viewBox="0 0 280 96" class="w-full h-24" role="img" aria-label="График план против факта">
                <line x1="8" y1="80" x2="272" y2="80" stroke="#e4e4e7" stroke-width="1" />
                <path d="M8 62 L60 54 L112 46 L164 34 L216 24 L272 16" fill="none" stroke="#a1a1aa" stroke-width="1.5" stroke-dasharray="4 4" />
                <path d="M8 68 L60 58 L112 50 L164 40 L216 30 L272 22" fill="none" stroke="#0071e3" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
                <circle cx="272" cy="22" r="3.5" fill="#0071e3" />
              </svg>
              <div class="flex justify-between text-[10px] text-zinc-400 mt-1"><span v-for="m in CHART_MONTHS" :key="m">{{ m }}</span></div>
              <div class="mt-2 flex items-center gap-3 text-[11px] text-zinc-500"><span class="inline-flex items-center gap-1"><span class="w-3 h-0.5 bg-accent rounded" />Факт</span><span class="inline-flex items-center gap-1"><span class="w-3 h-0.5 bg-zinc-400 rounded" />План</span></div>
            </div>
            <div class="rounded-2xl bg-white shadow-card p-3 flex flex-col gap-2">
              <div class="text-xs font-medium text-zinc-500 px-1">Задачи</div>
              <div v-for="t in TASKS" :key="t.title" class="rounded-xl px-3 py-2" :class="t.box">
                <div class="text-[10px] font-medium" :class="t.tone">{{ t.status }}</div>
                <div class="text-sm font-medium mt-0.5">{{ t.title }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
