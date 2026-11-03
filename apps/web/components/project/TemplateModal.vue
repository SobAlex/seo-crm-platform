<script setup lang="ts">
// Окно «Загрузить шаблон месяца» (#template-modal в project.html): превью задач выбранного шаблона.
const open = defineModel<boolean>({ required: true })

const { can } = useRole()
const notify = useNotify()

const TEMPLATES: Record<string, { label: string; items: { direction: string; work: string; hours: number }[] }> = {
  m1: { label: 'Месяц 1 · Запуск магазина', items: [
    { direction: 'Аудит', work: 'Аудит технический', hours: 8 },
    { direction: 'Семантика', work: 'Сбор семантики', hours: 10 },
    { direction: 'Внутренняя', work: 'Перелинковка', hours: 4 },
    { direction: '— Не привязано —', work: 'Настроить доступы к GSC и Метрике', hours: 4 }
  ] },
  m2: { label: 'Месяц 2 · Структура и текст', items: [
    { direction: 'Внутренняя', work: 'Оптимизация метаданных', hours: 8 },
    { direction: 'Внутренняя', work: 'Оптимизация текстов', hours: 14 },
    { direction: 'Внутренняя', work: 'Перелинковка', hours: 4 },
    { direction: 'Семантика', work: 'Распределение по страницам', hours: 6 }
  ] },
  reg: { label: 'Регулярный месяц', items: [
    { direction: 'Внешняя', work: 'Аутрич и размещения', hours: 10 },
    { direction: 'Внутренняя', work: 'Обновление контента', hours: 8 },
    { direction: 'Аудит', work: 'Мониторинг технических ошибок', hours: 3 },
    { direction: '— Не привязано —', work: 'Отчёт и корректировка стратегии', hours: 4 }
  ] }
}
const templateOptions = Object.entries(TEMPLATES).map(([value, t]) => ({ value, label: t.label }))
const monthOptions = ['Июнь 2025', 'Июль 2025', 'Август 2025']

const tpl = ref('m1')
const month = ref('Июнь 2025')
const current = computed(() => TEMPLATES[tpl.value]!)
const summary = computed(() => `${current.value.items.length} задач · ${current.value.items.reduce((h, i) => h + i.hours, 0)} ч`)

function submit() {
  open.value = false
  notify(`Шаблон «${current.value.label}» развёрнут на ${month.value.toLowerCase()} · ${summary.value}`)
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="Загрузить шаблон месяца"
    subtitle="Развернёт задачи из готового набора"
    size="lg"
    submit="Загрузить"
  >
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
      <UiField label="Шаблон"><USelect v-model="tpl" :options="templateOptions" /></UiField>
      <UiField label="На какой месяц"><USelect v-model="month" :options="monthOptions" /></UiField>
    </div>
    <div class="border border-black/5 rounded-xl overflow-hidden mb-4">
      <div class="px-4 py-3 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
        <span class="text-xs font-medium text-zinc-700">Содержимое шаблона</span>
        <span class="text-xs text-zinc-500 tabular-nums">{{ summary }}</span>
      </div>
      <ul class="divide-y divide-zinc-100 text-sm">
        <li v-for="i in current.items" :key="i.work" class="px-4 py-3 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <span class="w-4 h-4 rounded-full border-2 border-blue-600 shrink-0" />
            <div class="min-w-0">
              <div class="text-sm font-medium truncate">{{ i.work }}</div>
              <div class="text-xs text-zinc-500 mt-0.5">{{ i.direction }}</div>
            </div>
          </div>
          <div class="text-sm text-zinc-500 tabular-nums shrink-0">{{ i.hours }} ч</div>
        </li>
      </ul>
    </div>

    <template #footer>
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 w-full">
        <AccessGate :allowed="can('templates.manage')" :tip="TIP_SYSTEM">
          <NuxtLink
            to="/templates"
            class="text-xs text-zinc-500 hover:text-zinc-900 transition text-center sm:text-left"
            :class="!can('templates.manage') && 'opacity-50'"
            :aria-disabled="!can('templates.manage') || undefined"
            :tabindex="can('templates.manage') ? undefined : -1"
          >Управлять шаблонами →</NuxtLink>
        </AccessGate>
        <div class="flex gap-2">
          <UButton color="white" class="flex-1 sm:flex-none justify-center" @click="open = false">Отмена</UButton>
          <UButton class="flex-1 sm:flex-none justify-center" @click="submit">Загрузить</UButton>
        </div>
      </div>
    </template>
  </UiSheet>
</template>
