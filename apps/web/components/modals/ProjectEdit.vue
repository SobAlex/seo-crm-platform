<script setup lang="ts">
// Окно «Настройки проекта» (registerModal('project-edit') в assets/modals.js).
import { KPI_DEFAULT, KPI_OPTS, monthOptions } from '~/constants/directory'
import { readProjectKpis, writeProjectKpis, type MetricKey } from '~/types/project'

interface ProjectUpdated {
  title: string
  site: string
  client: string
  type: string
  roadmap: string
  kpis: MetricKey[]
}

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  updated: [project: ProjectUpdated]
}>()

const { can } = useRole()
const notify = useNotify()
const route = useRoute()
const pending = ref(false)
const clients = ref<{ id: string; name: string; contact: string; email: string; rate: number }[]>([])
const types = ref<{ id: string; name: string }[]>([])
const roadmaps = ref<{ id: string; name: string; type: string }[]>([])
const members = ref<{ id: string; name: string; role: string }[]>([])

const form = ref({
  title: 'Интернет-магазин «Холод»', site: 'holod-shop.ru', client: '', newClient: '', newInn: '', newContact: '',
  type: '', roadmap: '', start: '2025-05', budget: '240000', hours: '96', traffic: '', leads: '', pm: '', seo: '',
  kpis: [...KPI_DEFAULT] as string[]
})

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
watch(open, v => { if (v) void load() })

async function load() {
  form.value.kpis = readProjectKpis()
  try {
    const [clientRows, typeRows, mapRows, people, project] = await Promise.all([
      $fetch<Array<{ id: string; name: string; contactPerson: string; email: string; ratePerHour: number | null }>>('/api/clients', { credentials: 'include' }),
      $fetch<Array<{ id: string; name: string }>>('/api/templates/types', { credentials: 'include' }),
      $fetch<Array<{ id: string; name: string; type: string }>>('/api/templates/roadmaps', { credentials: 'include' }),
      $fetch<Array<{ id: string; name: string; role: string }>>('/api/members', { credentials: 'include' }),
      $fetch<{ name: string; domain: string | null; monthlyBudget: number | null; monthlyHoursLimit: number | null; client: { id: string } | null; projectType: { id: string } | null; plan: { targetTraffic: number; targetLeads: number } | null; startDate: string | null }>(`/api/projects/${route.params.id}`, { credentials: 'include' })
    ])
    clients.value = clientRows.map(row => ({ id: row.id, name: row.name, contact: row.contactPerson, email: row.email, rate: row.ratePerHour || 0 }))
    types.value = typeRows
    roadmaps.value = mapRows
    members.value = people
    const start = project.startDate ? project.startDate.slice(0, 7) : form.value.start
    form.value = {
      ...form.value,
      title: project.name,
      site: project.domain || '',
      client: project.client?.id || clients.value[0]?.id || '',
      type: project.projectType?.id || types.value[0]?.id || '',
      start,
      budget: project.monthlyBudget != null ? String(project.monthlyBudget) : '',
      hours: project.monthlyHoursLimit != null ? String(project.monthlyHoursLimit) : form.value.hours,
      traffic: project.plan ? String(project.plan.targetTraffic) : '',
      leads: project.plan ? String(project.plan.targetLeads) : '',
      pm: pmOptions.value[0]?.value ?? '',
      seo: seoOptions.value[0]?.value ?? '',
      roadmap: roadmaps.value.find(item => item.type === (project.projectType?.id || ''))?.id ?? ''
    }
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  }
}

const clientOptions = computed(() => clients.value.map(c => ({ value: c.id, label: c.name })))
const typeOptions = computed(() => types.value.map(t => ({ value: t.id, label: t.name })))
const roadmapOptions = computed(() => roadmaps.value.filter(r => r.type === form.value.type).map(r => ({ value: r.id, label: r.name })))
const startOptions = monthOptions(4, 11)
const pmOptions = computed(() => members.value.filter(p => p.role === 'pm' || p.role === 'mgr_head' || p.role === 'owner').map(p => ({ value: p.id, label: p.name })))
const seoOptions = computed(() => members.value.filter(p => p.role === 'employee' || p.role === 'seo_head').map(p => ({ value: p.id, label: p.name })))

const clientInfo = computed(() => {
  const c = clients.value.find(x => x.id === form.value.client)
  return c ? `${c.contact} · ${c.email} · ставка ${c.rate.toLocaleString('ru-RU')} ₽/ч` : 'Ставка и контакты подтянутся из карточки клиента'
})
const roadmapInfo = computed(() => 'Смена карты не удаляет уже созданные задачи')

watch(() => form.value.type, () => {
  if (!roadmapOptions.value.some(o => o.value === form.value.roadmap)) form.value.roadmap = roadmapOptions.value[0]?.value ?? ''
})

async function submit() {
  const f = form.value
  if (!f.kpis.length) {
    notify('Отметьте хотя бы одну метрику проекта', 'error')
    return
  }
  pending.value = true
  try {
    await $fetch(`/api/projects/${route.params.id}`, {
      method: 'PUT',
      credentials: 'include',
      body: {
        name: f.title.trim(),
        siteUrl: f.site.trim(),
        clientId: f.client || undefined,
        projectTypeId: f.type || undefined,
        budgetMonthly: f.budget ? Number(f.budget) : undefined,
        hoursLimit: f.hours ? Number(f.hours) : undefined,
        targetTraffic: f.traffic ? Number(f.traffic) : 0,
        targetLeads: f.leads ? Number(f.leads) : 0,
        startMonth: f.start,
        kpis: writeProjectKpis(f.kpis)
      }
    })
    emit('updated', {
      title: f.title,
      site: f.site,
      client: clientOptions.value.find(o => o.value === f.client)?.label ?? '',
      type: typeOptions.value.find(o => o.value === f.type)?.label ?? '',
      roadmap: roadmapOptions.value.find(o => o.value === f.roadmap)?.label ?? '',
      kpis: writeProjectKpis(f.kpis)
    })
    open.value = false
    notify('Настройки проекта сохранены', 'success')
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="Настройки проекта"
    subtitle="Интернет-магазин «Холод» · holod-shop.ru"
    size="lg"
    :submit="pending ? 'Сохранение…' : 'Сохранить'"
    :submit-allowed="can('project.update') && !pending"
    :submit-tip="TIP_TEAM"
    manual
    @submit="submit"
  >
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UiField label="Название проекта" req><UInput v-model="form.title" required /></UiField>
      <UiField label="Сайт" req><UInput v-model="form.site" required inputmode="url" /></UiField>
    </div>
    <UiField label="Клиент" req :hint="clientInfo">
      <USelect v-model="form.client" :options="clientOptions" required />
    </UiField>
    <div v-if="form.client === '__new'" class="rounded-2xl border border-zinc-200 p-4 space-y-3">
      <div class="text-xs font-medium text-zinc-900">Новый клиент</div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UiField label="Компания" req><UInput v-model="form.newClient" required placeholder="ООО «Бета»" /></UiField>
        <UiField label="ИНН" req><UInput v-model="form.newInn" required inputmode="numeric" placeholder="10 или 12 цифр" /></UiField>
      </div>
      <UiField label="Контактное лицо" opt="можно позже"><UInput v-model="form.newContact" placeholder="Имя и фамилия" /></UiField>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UiField label="Тип проекта" req><USelect v-model="form.type" :options="typeOptions" required /></UiField>
      <UiField label="Дорожная карта" req :hint="roadmapInfo">
        <USelect v-model="form.roadmap" :options="roadmapOptions" placeholder="Без смены карты" />
      </UiField>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <UiField label="Старт работ"><USelect v-model="form.start" :options="startOptions" /></UiField>
      <UiField v-if="can('finance.fee.view')" label="Чек в месяц, ₽"><UInput v-model="form.budget" type="number" min="0" step="1000" /></UiField>
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
