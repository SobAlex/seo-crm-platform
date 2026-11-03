<script setup lang="ts">
// brief-form.html → Сетка 3 (Form): опросник, который заполняет клиент.
definePageMeta({ roles: ['owner', 'seo_head', 'mgr_head', 'pm', 'employee', 'client'] })
useHead({ title: 'Бриф — SEO Control' })

const { role } = useRole()
const notify = useNotify()

const isClient = computed(() => role.value === 'client')
const back = computed(() => isClient.value
  ? { to: '/portal', label: 'Мой проект' }
  : { to: '/projects/holod', label: 'Проект «Холод»' })

const GOALS = [
  { value: 'traffic', label: 'Рост органического трафика' },
  { value: 'leads', label: 'Заявки из поиска' },
  { value: 'top', label: 'Выход в топ по категориям' }
]
const ACCESS = [
  { value: 'metrica', label: 'Яндекс Метрика' },
  { value: 'gsc', label: 'Google Search Console' },
  { value: 'cms', label: 'Админка сайта' }
]

const goal = ref('traffic')
const access = ref(['metrica', 'cms'])
const season = ref('Пик продаж холодильного оборудования приходится на май–июль. Важно сделать упор на категорию промышленных чиллеров и морозильных ларей к началу сезона.')

function submitBrief() {
  notify('Бриф успешно отправлен в команду агентства', 'success')
  setTimeout(() => navigateTo(back.value.to), 700)
}

const OPTION = 'flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-zinc-200 hover:bg-zinc-50 cursor-pointer transition'
</script>

<template>
  <PageForm title="Бриф" :back="back">
    <template #actions>
      <UButton type="submit" form="brief-form">Отправить бриф</UButton>
    </template>

    <div>
      <h2 class="text-2xl lg:text-3xl font-semibold tracking-tight">Бриф проекта</h2>
      <p class="text-sm text-zinc-500 mt-1">Интернет-магазин «Холод» · ответы нужны команде, чтобы начать работу</p>
    </div>

    <form id="brief-form" class="flex flex-col gap-4 lg:gap-6" @submit.prevent="submitBrief">
      <section class="bg-white rounded-2xl shadow-card p-6 space-y-4">
        <h3 class="text-sm font-semibold tracking-tight">1. Какая главная цель на ближайшие 3 месяца?</h3>
        <div class="space-y-2" role="radiogroup" aria-label="Главная цель">
          <label v-for="g in GOALS" :key="g.value" :class="OPTION">
            <input v-model="goal" type="radio" name="goal" :value="g.value" class="accent-[var(--accent,#0071e3)]">
            <span class="text-sm text-zinc-800">{{ g.label }}</span>
          </label>
        </div>
      </section>

      <section class="bg-white rounded-2xl shadow-card p-6 space-y-4">
        <h3 class="text-sm font-semibold tracking-tight">2. Какие доступы уже есть у команды?</h3>
        <p class="text-xs text-zinc-500">Можно выбрать несколько</p>
        <div class="space-y-2">
          <label v-for="a in ACCESS" :key="a.value" :class="OPTION">
            <input v-model="access" type="checkbox" name="access" :value="a.value" class="accent-[var(--accent,#0071e3)]">
            <span class="text-sm text-zinc-800">{{ a.label }}</span>
          </label>
        </div>
      </section>

      <section class="bg-white rounded-2xl shadow-card p-6 space-y-4">
        <h3 class="text-sm font-semibold tracking-tight">3. Что важно учесть по ассортименту и сезонности?</h3>
        <label class="block text-xs font-medium text-zinc-500 mb-2" for="season">Ваш комментарий</label>
        <UTextarea id="season" v-model="season" name="season" :rows="4" resize size="md" placeholder="Например: пик продаж, приоритетные категории, ограничения" textarea-class="bg-white" />
      </section>

      <div class="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <UButton :to="back.to" color="white" class="rounded-full justify-center">Отмена</UButton>
        <UButton type="submit" class="justify-center">Отправить бриф</UButton>
      </div>
    </form>
  </PageForm>
</template>
