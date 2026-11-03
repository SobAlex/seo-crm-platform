<script setup lang="ts">
// «Тарифы»: переключатель помесячно/за год пересчитывает цены и подписи; кнопка открывает триал с тарифом.
defineEmits<{ signup: [plan: string] }>()

const PRESSED = 'bg-white !text-ink shadow-[0_1px_2px_rgba(0,0,0,.04),0_0_0_1px_rgba(0,0,0,.06)]'

const PLANS = [
  {
    id: 'start', name: 'Старт', desc: 'Небольшие команды и соло-специалисты', prices: [4900, 3920],
    features: ['До 5 проектов', 'Базовые шаблоны карт и брифа', 'Задачи, приёмка и отчёты'],
    iconBox: 'bg-zinc-100 text-zinc-700',
    icon: 'M13 10V3L4 14h7v7l9-11h-7z'
  },
  {
    id: 'pro', name: 'Про / Агентство', desc: 'Хит продаж для агентств с отделом', prices: [9900, 7920], popular: true,
    features: ['До 25 проектов', 'Дорожные карты и месячные планы', 'Портал клиентов и брендированные отчёты'],
    iconBox: 'bg-blue-50 text-accent',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'
  },
  {
    id: 'ent', name: 'Enterprise', desc: 'Сети агентств и in-house отделы', prices: [39900, 31920],
    features: ['Проекты без лимита', 'Интеграции, SSO и API', 'Выделенная поддержка'],
    iconBox: 'bg-zinc-100 text-zinc-700',
    icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
  }
]

const period = ref<'month' | 'year'>('month')
const fmt = (n: number) => n.toLocaleString('ru-RU')
const price = (p: number[]) => fmt(p[period.value === 'year' ? 1 : 0]!)
const note = (p: number[]) => period.value === 'year' ? `в месяц при оплате ${fmt(p[1]! * 12)} ₽ за год` : 'в месяц, без обязательств'
</script>

<template>
  <section id="pricing" class="px-4 sm:px-6 py-16 scroll-mt-20">
    <div class="max-w-6xl mx-auto">
      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div class="max-w-xl">
          <h2 class="text-3xl sm:text-4xl font-semibold tracking-tight">Тарифы</h2>
          <p class="mt-3 text-zinc-500">14 дней на любом тарифе, карта не нужна. Скидка 20% при оплате за год.</p>
        </div>
        <div class="inline-flex bg-zinc-200/70 rounded-full p-1 self-start" role="group" aria-label="Период оплаты">
          <button type="button" :aria-pressed="period === 'month'" class="px-3.5 py-1.5 rounded-full text-sm font-medium text-zinc-500" :class="period === 'month' && PRESSED" @click="period = 'month'">Оплата помесячно</button>
          <button type="button" :aria-pressed="period === 'year'" class="px-3.5 py-1.5 rounded-full text-sm font-medium text-zinc-500" :class="period === 'year' && PRESSED" @click="period = 'year'">Оплата за год <span class="text-emerald-700">−20%</span></button>
        </div>
      </div>
      <div class="grid lg:grid-cols-3 gap-4">
        <article v-for="p in PLANS" :key="p.id" class="bg-white rounded-3xl shadow-card p-6 flex flex-col" :class="p.popular && 'relative ring-2 ring-accent'">
          <span v-if="p.popular" class="absolute -top-2.5 left-6 px-2 py-0.5 rounded-full bg-accent text-white text-[11px] font-medium">Популярный</span>
          <div class="w-9 h-9 rounded-xl flex items-center justify-center mb-3" :class="p.iconBox">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" :d="p.icon" /></svg>
          </div>
          <h3 class="text-sm font-semibold">{{ p.name }}</h3>
          <p class="text-xs text-zinc-500 mt-1">{{ p.desc }}</p>
          <div class="mt-5"><span class="text-4xl font-semibold tracking-tight tabular-nums">{{ price(p.prices) }}</span> <span class="text-sm text-zinc-500">₽</span></div>
          <p class="text-xs text-zinc-400 mt-1">{{ note(p.prices) }}</p>
          <ul class="mt-5 space-y-2 text-sm text-zinc-600 flex-1">
            <li v-for="f in p.features" :key="f">{{ f }}</li>
          </ul>
          <UButton size="md" block :color="p.popular ? 'primary' : 'white'" class="mt-6 rounded-full" @click="$emit('signup', p.id)">Выбрать тариф (14 дней бесплатно)</UButton>
        </article>
      </div>
    </div>
  </section>
</template>
