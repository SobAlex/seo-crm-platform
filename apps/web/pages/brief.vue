<script setup lang="ts">
// brief.html → Сетка 3 (Form): ответы клиента на бриф. ?client= — чей бриф и куда ведёт «Назад».
import { CLIENTS, PROJECTS } from '~/constants/directory'

definePageMeta({ roles: ['owner', 'seo_head', 'mgr_head', 'pm', 'employee', 'client'] })
useHead({ title: 'Ответы на бриф — SEO Control' })

const { role } = useRole()
const route = useRoute()

const clientId = computed(() => {
  const id = String(route.query.client || 'holod')
  return CLIENTS.some(c => c.id === id) ? id : 'holod'
})
const client = computed(() => CLIENTS.find(c => c.id === clientId.value)!)
const site = computed(() => PROJECTS.find(p => p.client === clientId.value)?.site ?? 'holod-shop.ru')
const back = computed(() => role.value === 'client'
  ? { to: '/portal', label: 'Мой проект' }
  : { to: `/clients/${clientId.value}`, label: 'Назад' })

const CHECK = 'M5 13l4 4L19 7'
const ACCESS = [
  { label: 'Яндекс Метрика', on: true },
  { label: 'Google Search Console', on: false },
  { label: 'Админка сайта', on: true }
]

function print() {
  window.print()
}
</script>

<template>
  <PageForm title="Ответы на бриф" :back="back">
    <template #actions>
      <UButton color="white" class="rounded-full text-zinc-700" @click="print">Печать / Экспорт PDF</UButton>
    </template>

    <div class="bg-white rounded-2xl shadow-card p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
      <p class="text-zinc-600 min-w-0">
        <span class="text-zinc-900 font-medium">Клиент:</span> {{ client.name }}
        <span class="text-zinc-300 mx-1.5">·</span>
        <span class="text-zinc-900 font-medium">Сайт:</span> {{ site }}
        <span class="text-zinc-300 mx-1.5">·</span>
        <span class="text-zinc-900 font-medium">Заполнил:</span> {{ client.contact }} ({{ client.email }})
      </p>
      <p class="text-zinc-500 tabular-nums shrink-0">Дата заполнения: 03.05.2025 в 14:20</p>
    </div>

    <section class="bg-white rounded-2xl shadow-card p-5 sm:p-6 space-y-3">
      <h2 class="text-sm font-semibold tracking-tight text-ink">Какая главная цель на ближайшие 3 месяца?</h2>
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-sm font-medium"><svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" :d="CHECK" /></svg>Рост органического трафика</div>
    </section>

    <section class="bg-white rounded-2xl shadow-card p-5 sm:p-6 space-y-3">
      <h2 class="text-sm font-semibold tracking-tight text-ink">Какие доступы уже есть у команды?</h2>
      <ul class="space-y-2 text-sm">
        <template v-for="a in ACCESS" :key="a.label">
          <li v-if="a.on" class="flex items-center gap-2 text-emerald-800 font-medium"><svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.2" :d="CHECK" /></svg>{{ a.label }}</li>
          <li v-else class="flex items-center gap-2 text-zinc-400">— {{ a.label }}</li>
        </template>
      </ul>
    </section>

    <section class="bg-white rounded-2xl shadow-card p-5 sm:p-6 space-y-3">
      <h2 class="text-sm font-semibold tracking-tight text-ink">Что важно учесть по ассортименту и сезонности?</h2>
      <div class="p-4 rounded-xl bg-zinc-50 border border-zinc-100 text-sm text-zinc-800 leading-relaxed">Пик продаж холодильного оборудования приходится на май–июль. Важно сделать упор на категорию промышленных чиллеров и морозильных ларей к началу сезона.</div>
    </section>
  </PageForm>
</template>
