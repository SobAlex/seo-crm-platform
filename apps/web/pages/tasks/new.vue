<script setup lang="ts">
// task-form.html → Сетка 3 (Form): основное, участники, сроки и оценка.
import { WORKS } from '~/types/tasks'

definePageMeta({ roles: ['owner', 'seo_head', 'mgr_head', 'pm', 'employee'] })
useHead({ title: 'Создать задачу — SEO Control' })

const { can, user } = useRole()
const notify = useNotify()
const route = useRoute()

const ROADMAP: { group: string; items: { value: string; label: string }[] }[] = [
  { group: 'Аудит', items: ['audit-tech', 'audit-behavior', 'audit-commercial'].map(v => ({ value: v, label: WORKS[v]! })) },
  { group: 'Семантика', items: ['sem-collect', 'sem-cluster', 'sem-pages'].map(v => ({ value: v, label: WORKS[v]! })) },
  { group: 'Внутренняя оптимизация', items: ['in-meta', 'in-content', 'in-microdata'].map(v => ({ value: v, label: WORKS[v]! })) },
  { group: 'Внешняя оптимизация', items: ['out-links', 'out-crowd'].map(v => ({ value: v, label: WORKS[v]! })) }
]

const ROLE_OPTIONS = [
  { value: 'seo-lead', label: 'Руководитель SEO' },
  { value: 'pm', label: 'Менеджер проекта' },
  { value: 'employee', label: 'SEO-специалист' },
  { value: 'contractor', label: 'Подрядчик' }
]
const CO = ['А. Петров', 'И. Дронов', 'П. Лебедев', 'М. Ким']

const projects = ref<{ value: string; label: string }[]>([])
const members = ref<{ value: string; label: string }[]>([])
const saving = ref(false)

const qWork = typeof route.query.work === 'string' && route.query.work in WORKS ? route.query.work : ''
const form = reactive({
  project: '',
  month: 'Июнь 2025',
  roadmap: qWork,
  parent: '',
  title: '',
  description: '',
  role: 'employee',
  executor: '',
  co: [] as string[],
  acceptor: 'Постановщик — вы',
  priority: 'Средний',
  payout: 'Фиксированная сумма за задачу',
  amount: '',
  estimate: '',
  due: '2025-06-18',
  status: 'Запланирована'
})

onMounted(async () => {
  try {
    const [projectRows, people] = await Promise.all([
      $fetch<Array<{ id: string; name: string }>>('/api/projects', { credentials: 'include' }),
      $fetch<Array<{ id: string; name: string; role: string }>>('/api/members', { credentials: 'include' })
    ])
    projects.value = projectRows.map(row => ({ value: row.id, label: row.name }))
    members.value = people.map(row => ({ value: row.id, label: `${row.name}` }))
    form.project = projects.value[0]?.value ?? ''
    form.executor = members.value[0]?.value ?? ''
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  }
})

const executors = computed(() => members.value)
const showPayout = computed(() => can('finance.fee.view') && form.role === 'contractor')

async function submit() {
  if (!form.title.trim()) {
    notify('Заполните название задачи', 'error')
    return
  }
  if (!form.project) {
    notify('Выберите проект', 'error')
    return
  }
  saving.value = true
  try {
    const saved = await $fetch<{ id: string }>('/api/tasks', {
      method: 'POST',
      credentials: 'include',
      body: {
        title: form.title.trim(),
        description: form.description.trim(),
        projectId: form.project,
        assigneeId: form.executor || undefined,
        deadline: form.due || undefined,
        estimatedHours: form.estimate ? Number(form.estimate) : undefined,
        isInReport: false
      }
    })
    notify('Задача создана и назначена исполнителю', 'success')
    await navigateTo(`/tasks/${saved.id}`)
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <PageForm :back="{ to: '/tasks', label: 'Задачи' }" :crumbs="[{ label: 'Главная', to: '/' }, { label: 'Задачи', to: '/tasks' }, { label: 'Новая задача' }]">
    <template #actions>
      <UButton type="submit" form="task-form">Создать</UButton>
    </template>

    <div>
      <div class="mb-6 lg:mb-8">
        <h2 class="text-2xl lg:text-3xl font-semibold tracking-tight">Создать задачу</h2>
      </div>

      <form id="task-form" class="flex flex-col gap-4 lg:gap-6" @submit.prevent="submit">
        <section class="bg-white rounded-2xl shadow-card p-4 lg:p-6">
          <h3 class="text-sm font-semibold tracking-tight mb-5">Основное</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
            <UiField label="Проект" class="md:col-span-2">
              <USelect v-model="form.project" :options="projects" placeholder="Выберите проект" />
            </UiField>

            <UiField label="Месяц" class="md:col-span-2">
              <USelect v-model="form.month" :options="['Июнь 2025', 'Июль 2025', 'Август 2025']" />
            </UiField>

            <UiField label="Пункт дорожной карты" opt="опционально" class="md:col-span-2">
              <select v-model="form.roadmap" name="roadmap_item" :class="FIELD">
                <option value="">— Внеплановая (свободная задача) —</option>
                <optgroup v-for="g in ROADMAP" :key="g.group" :label="g.group">
                  <option v-for="o in g.items" :key="o.value" :value="o.value">{{ o.label }}</option>
                </optgroup>
              </select>
              <template #hint>
                <p class="text-[11px] text-zinc-400">Привязка задачи автоматически двигает прогресс выполнения этапа в дорожной карте проекта.</p>
              </template>
            </UiField>

            <UiField label="Родительская задача" opt="если это подзадача" class="md:col-span-2">
              <USelect v-model="form.parent" :options="[{ value: '', label: '— Это самостоятельная задача —' }, 'Аудит технический', 'Сбор семантики', 'Перелинковка']" />
            </UiField>

            <UiField label="Название задачи" class="md:col-span-2">
              <UInput v-model="form.title" name="title" required placeholder="Кратко и по делу" />
            </UiField>

            <UiField label="Описание задачи" hint="Опишите результат и критерии приёмки в одном тексте — исполнитель увидит их в карточке задачи." class="md:col-span-2">
              <UTextarea v-model="form.description" :rows="5" resize placeholder="Что нужно сделать и когда задача считается готовой" />
            </UiField>
          </div>
        </section>

        <section class="bg-white rounded-2xl shadow-card p-4 lg:p-6">
          <h3 class="text-sm font-semibold tracking-tight mb-5">Участники</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
            <UiField label="Роль">
              <USelect v-model="form.role" :options="ROLE_OPTIONS" />
            </UiField>
            <UiField label="Исполнитель">
              <USelect v-model="form.executor" :options="executors" placeholder="Выберите сотрудника" />
            </UiField>
            <UiField label="Соисполнители" opt="необязательно" class="md:col-span-2">
              <div class="flex flex-wrap gap-2">
                <label v-for="n in CO" :key="n" class="cursor-pointer"><input v-model="form.co" type="checkbox" :value="n" class="peer sr-only"><span class="inline-flex items-center px-3 py-1.5 rounded-full border border-zinc-200 bg-white text-sm text-zinc-700 transition peer-checked:bg-white peer-checked:text-zinc-900 peer-checked:shadow-sm peer-checked:border-zinc-300 peer-focus-visible:ring-4 peer-focus-visible:ring-accent/15">{{ n }}</span></label>
              </div>
            </UiField>
            <UiField label="Принимает работу">
              <USelect v-model="form.acceptor" :options="['Постановщик — вы', 'Руководитель SEO — И. Сидоров']" />
            </UiField>
            <UiField label="Постановщик">
              <div class="w-full h-9 px-3.5 flex items-center rounded-xl border border-black/10 bg-zinc-50 text-xs text-zinc-700">{{ user.name || 'Вы' }}</div>
            </UiField>
            <UiField label="Приоритет">
              <USelect v-model="form.priority" :options="['Высокий', 'Средний', 'Низкий']" />
            </UiField>
            <div v-if="showPayout" class="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-5">
              <UiField label="Оплата подрядчику">
                <USelect v-model="form.payout" :options="['Фиксированная сумма за задачу', 'Почасовая ставка']" />
              </UiField>
              <UiField label="Сумма, ₽" hint="Виден сотрудникам компании. Попадает в расчёт маржи проекта.">
                <UInput v-model="form.amount" type="number" placeholder="3500" input-class="tabular-nums" />
              </UiField>
            </div>
            <div class="md:col-span-2 rounded-xl border border-black/5 bg-zinc-50 p-3">
              <p class="text-xs text-zinc-500">
                <strong class="text-zinc-900">Подрядчик</strong> видит только назначенные ему задачи и не создаёт их сам.
                Клиент внутренние задачи не видит.
              </p>
            </div>
          </div>
        </section>

        <section class="bg-white rounded-2xl shadow-card p-4 lg:p-6">
          <h3 class="text-sm font-semibold tracking-tight mb-5">Сроки и оценка</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 lg:gap-5">
            <UiField label="Оценка, ч">
              <UInput v-model="form.estimate" type="number" step="0.25" min="0" placeholder="4,0" input-class="tabular-nums" />
            </UiField>
            <UiField label="Срок">
              <UInput v-model="form.due" type="date" />
            </UiField>
            <UiField label="Статус" class="sm:col-span-2 md:col-span-1">
              <USelect v-model="form.status" :options="['Запланирована', 'В работе', 'Ждёт клиента']" />
            </UiField>
          </div>
        </section>

        <div class="flex flex-col sm:flex-row gap-3">
          <UButton type="submit" :loading="saving" :disabled="saving">{{ saving ? 'Создание…' : 'Создать' }}</UButton>
          <UButton color="white" to="/tasks" class="justify-center">Отмена</UButton>
        </div>
      </form>
    </div>
  </PageForm>
</template>
