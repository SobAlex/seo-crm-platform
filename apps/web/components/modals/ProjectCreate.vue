<script setup lang="ts">
// Окно «Новый проект» (registerModal('project-create') в assets/modals.js).
import { KPI_DEFAULT, KPI_OPTS, monthOptions } from '~/constants/directory'

interface ProjectCreated {
  id: string
  title: string
  site: string
  client: string
  budget: string
  taskCount: number
}

const props = defineProps<{
  modelValue: boolean
  /** Клиент зафиксирован (открыто из карточки клиента, data-prefill-client). */
  prefillClient?: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: [project: ProjectCreated]
}>()

const { can } = useRole()
const notify = useNotify()
const limitHint = ref('')
const pending = ref(false)
const clients = ref<{ id: string; name: string; contact: string; email: string; rate: number }[]>([])
const types = ref<{ id: string; name: string }[]>([])
const roadmaps = ref<{ id: string; name: string; type: string }[]>([])
const members = ref<{ id: string; name: string; role: string }[]>([])

const blank = () => ({
  title: '', site: '', client: props.prefillClient ?? '', newClient: '', newInn: '', newContact: '', newEmail: '',
  type: '', roadmap: '', start: '2025-07', budget: '', hours: '60', traffic: '', leads: '', pm: '', seo: '', kpis: [...KPI_DEFAULT]
})
const form = ref(blank())

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
watch(open, v => { if (v) { form.value = blank(); void loadCatalog() } })

async function loadCatalog() {
  try {
    const [clientRows, typeRows, mapRows, people] = await Promise.all([
      $fetch<Array<{ id: string; slug: string; name: string; contactPerson: string; email: string; ratePerHour: number | null }>>('/api/clients', { credentials: 'include' }),
      $fetch<Array<{ id: string; name: string }>>('/api/templates/types', { credentials: 'include' }),
      $fetch<Array<{ id: string; name: string; type: string }>>('/api/templates/roadmaps', { credentials: 'include' }),
      $fetch<Array<{ id: string; name: string; role: string }>>('/api/members', { credentials: 'include' })
    ])
    clients.value = clientRows.map(row => ({ id: row.id, name: row.name, contact: row.contactPerson, email: row.email, rate: row.ratePerHour || 0 }))
    types.value = typeRows
    roadmaps.value = mapRows
    members.value = people
    if (!form.value.type && types.value[0]) form.value.type = types.value[0].id
    if (!form.value.client && props.prefillClient) form.value.client = props.prefillClient
    if (!form.value.client && clients.value[0]) form.value.client = clients.value[0].id
    form.value.roadmap = roadmapOptions.value[0]?.value ?? ''
    form.value.pm = pmOptions.value[0]?.value ?? ''
    form.value.seo = seoOptions.value[0]?.value ?? ''
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  }
}

const clientOptions = computed(() => [...clients.value.map(c => ({ value: c.id, label: c.name })), { value: '__new', label: '+ Новый клиент...' }])
const typeOptions = computed(() => types.value.map(t => ({ value: t.id, label: t.name })))
const roadmapOptions = computed(() => roadmaps.value.filter(r => r.type === form.value.type).map(r => ({ value: r.id, label: r.name })))
const startOptions = monthOptions(6, 11)
const pmOptions = computed(() => members.value.filter(p => p.role === 'pm' || p.role === 'mgr_head' || p.role === 'owner').map(p => ({ value: p.id, label: p.name })))
const seoOptions = computed(() => members.value.filter(p => p.role === 'employee' || p.role === 'seo_head').map(p => ({ value: p.id, label: p.name })))

const clientInfo = computed(() => {
  const c = clients.value.find(x => x.id === form.value.client)
  return c ? `${c.contact} · ${c.email} · ставка ${c.rate.toLocaleString('ru-RU')} ₽/ч` : 'Ставка и контакты подтянутся из карточки клиента'
})
const roadmapInfo = computed(() => form.value.roadmap ? 'В первый месяц проекта будут созданы задачи выбранной дорожной карты' : 'Показаны шаблоны выбранного типа')

watch(() => form.value.type, () => {
  if (!roadmapOptions.value.some(o => o.value === form.value.roadmap)) form.value.roadmap = roadmapOptions.value[0]?.value ?? ''
})

async function submit() {
  const f = form.value
  if (!f.title.trim() || !f.site.trim()) {
    notify('Укажите название и сайт проекта', 'error')
    return
  }
  if (!f.kpis.length) {
    notify('Отметьте хотя бы одну метрику проекта', 'error')
    return
  }
  limitHint.value = ''
  pending.value = true
  try {
    let clientId = f.client
    let clientName = clients.value.find(c => c.id === f.client)?.name ?? ''
    if (f.client === '__new') {
      if (!f.newClient.trim() || !f.newContact.trim() || !f.newEmail.trim()) {
        notify('Для нового клиента укажите компанию, контакт и email', 'error')
        pending.value = false
        return
      }
      const created = await $fetch<{ id: string; name: string }>('/api/clients', {
        method: 'POST',
        credentials: 'include',
        body: { name: f.newClient.trim(), contactPerson: f.newContact.trim(), email: f.newEmail.trim(), inn: f.newInn.trim(), status: 'LEAD' }
      })
      clientId = created.id
      clientName = created.name
    }
    const saved = await $fetch<{ id: string; taskCount: number }>('/api/projects', {
      method: 'POST',
      credentials: 'include',
      body: {
        name: f.title.trim(),
        siteUrl: f.site.trim(),
        clientId: clientId && clientId !== '__new' ? clientId : undefined,
        projectTypeId: f.type || undefined,
        roadmapTemplateId: f.roadmap || undefined,
        budgetMonthly: f.budget ? Number(f.budget) : undefined,
        hoursLimit: f.hours ? Number(f.hours) : undefined,
        targetTraffic: f.traffic ? Number(f.traffic) : 0,
        targetLeads: f.leads ? Number(f.leads) : 0,
        startMonth: f.start,
        kpis: f.kpis,
        pmId: f.pm || undefined,
        seoId: f.seo || undefined
      }
    })
    emit('created', { id: saved.id, title: f.title, site: f.site, client: clientName, budget: f.budget, taskCount: saved.taskCount })
    open.value = false
    notify(`Проект «${f.title}» создан · задач первого месяца: ${saved.taskCount}`, 'success')
  } catch (err: unknown) {
    const message = apiErrorMessage(err)
    const status = err && typeof err === 'object' && 'statusCode' in err ? Number((err as { statusCode?: number }).statusCode) : 0
    if (status === 403 || message.includes('Лимит')) limitHint.value = message
    notify(message, 'error')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="Новый проект"
    subtitle="Клиент, тип и дорожная карта связаны: карта подбирается по типу проекта"
    size="lg"
    :submit="pending ? 'Создание…' : 'Создать проект'"
    :submit-allowed="can('project.create') && !pending"
    :submit-tip="TIP_TEAM"
    manual
    @submit="submit"
  >
    <p v-if="limitHint" class="text-sm text-red-600">
      {{ limitHint }}
      <NuxtLink to="/settings#billing" class="text-accent hover:underline" @click="open = false">Открыть биллинг</NuxtLink>
    </p>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UiField label="Название проекта" req><UInput v-model="form.title" required placeholder="Интернет-магазин «Альфа»" /></UiField>
      <UiField label="Сайт" req><UInput v-model="form.site" required placeholder="alfa-shop.ru" inputmode="url" /></UiField>
    </div>
    <UiField label="Клиент" req :hint="clientInfo">
      <USelect
        v-model="form.client"
        :options="clientOptions"
        placeholder="Выберите клиента"
        required
        :disabled="!!prefillClient"
        :aria-readonly="prefillClient ? 'true' : undefined"
      />
    </UiField>
    <div v-if="form.client === '__new'" class="rounded-2xl border border-zinc-200 p-4 space-y-3">
      <div class="text-xs font-medium text-zinc-900">Новый клиент</div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UiField label="Компания" req><UInput v-model="form.newClient" required placeholder="ООО «Бета»" /></UiField>
        <UiField label="ИНН" req><UInput v-model="form.newInn" required inputmode="numeric" placeholder="10 или 12 цифр" /></UiField>
      </div>
      <UiField label="Контактное лицо" req><UInput v-model="form.newContact" required placeholder="Имя и фамилия" /></UiField>
      <UiField label="Email" req><UInput v-model="form.newEmail" required type="email" placeholder="name@company.ru" /></UiField>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UiField label="Тип проекта" req><USelect v-model="form.type" :options="typeOptions" placeholder="Выберите тип" required /></UiField>
      <UiField label="Дорожная карта" req :hint="roadmapInfo">
        <USelect v-model="form.roadmap" :options="roadmapOptions" :placeholder="form.type ? 'Без карты' : 'Сначала выберите тип'" />
      </UiField>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <UiField label="Старт работ"><USelect v-model="form.start" :options="startOptions" /></UiField>
      <UiField v-if="can('finance.fee.view')" label="Чек в месяц, ₽"><UInput v-model="form.budget" type="number" min="0" step="1000" placeholder="120 000" /></UiField>
      <UiField label="Целевой трафик"><UInput v-model="form.traffic" type="number" min="0" step="100" placeholder="12000" /></UiField>
      <UiField label="Целевые лиды"><UInput v-model="form.leads" type="number" min="0" step="1" placeholder="70" /></UiField>
      <UiField label="Лимит часов"><UInput v-model="form.hours" type="number" min="1" /></UiField>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UiField label="Менеджер проекта" req><USelect v-model="form.pm" :options="pmOptions" placeholder="Выберите" required /></UiField>
      <UiField label="SEO-специалист" req><USelect v-model="form.seo" :options="seoOptions" placeholder="Выберите" required /></UiField>
    </div>
    <div class="mb-4">
      <label class="block text-xs font-medium text-zinc-500 mb-2">Метрики проекта для клиента и отчётов</label>
      <div class="space-y-2 bg-zinc-50 p-3 rounded-xl border border-zinc-200/80">
        <label v-for="k in KPI_OPTS" :key="k.id" class="flex items-center gap-2.5 text-xs text-zinc-700 cursor-pointer">
          <input v-model="form.kpis" type="checkbox" :value="k.id" class="w-4 h-4 rounded border-zinc-300 text-accent focus:ring-accent accent-accent">
          <span class="font-medium">{{ k.label }}</span>
        </label>
      </div>
      <p class="text-[11px] text-zinc-400 mt-1">Отмеченные показатели выводятся в портале клиента и попадают в ежемесячные отчёты.</p>
    </div>
  </UiSheet>
</template>
