<script setup lang="ts">
// Окно «Новый проект» (registerModal('project-create') в assets/modals.js).
import { CLIENTS, KPI_DEFAULT, KPI_OPTS, ROADMAPS, ROLE_NAME, TEAM, TYPES, monthOptions } from '~/constants/directory'

interface ProjectCreated {
  title: string
  site: string
  client: string
  budget: string
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

const blank = () => ({
  title: '', site: '', client: props.prefillClient ?? '', newClient: '', newInn: '', newContact: '',
  type: '', roadmap: '', start: '2025-07', budget: '', hours: '60', pm: '', seo: '', kpis: [...KPI_DEFAULT]
})
const form = ref(blank())

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
watch(open, v => { if (v) form.value = blank() })

const clientOptions = [...CLIENTS.map(c => ({ value: c.id, label: c.name })), { value: '__new', label: '+ Новый клиент...' }]
const typeOptions = TYPES.map(t => ({ value: t.id, label: t.name }))
const roadmapOptions = computed(() => ROADMAPS.filter(r => r.type === form.value.type).map(r => ({ value: r.id, label: r.name })))
const startOptions = monthOptions(6, 11)
const pmOptions = TEAM.filter(p => p.role === 'account_manager' || p.role === 'mgr_head').map(p => ({ value: p.id, label: `${p.name} · ${ROLE_NAME[p.role]}` }))
const seoOptions = TEAM.filter(p => p.role === 'seo_specialist' || p.role === 'seo_head').map(p => ({ value: p.id, label: `${p.name} · ${ROLE_NAME[p.role]} · ${p.load} ч` }))

const clientInfo = computed(() => {
  const c = CLIENTS.find(x => x.id === form.value.client)
  return c ? `${c.contact} · ${c.email} · ставка ${c.rate.toLocaleString('ru-RU')} ₽/ч` : 'Ставка и контакты подтянутся из карточки клиента'
})
const roadmapInfo = computed(() => form.value.roadmap ? 'В проект будут скопированы дорожная карта и все месячные планы шаблона' : 'Показаны шаблоны выбранного типа')

watch(() => form.value.client, id => {
  const c = CLIENTS.find(x => x.id === id)
  if (c && !form.value.type && TYPES.some(t => t.id === c.brief)) form.value.type = c.brief
})
watch(() => form.value.type, () => {
  if (!roadmapOptions.value.some(o => o.value === form.value.roadmap)) form.value.roadmap = roadmapOptions.value[0]?.value ?? ''
})

function submit() {
  const f = form.value
  if (!f.kpis.length) {
    notify('Отметьте хотя бы одну метрику проекта', 'error')
    return
  }
  const client = f.client === '__new' ? f.newClient : CLIENTS.find(c => c.id === f.client)?.name ?? ''
  emit('created', { title: f.title, site: f.site, client, budget: f.budget })
  open.value = false
  notify(`Проект «${f.title}» создан · ${client} · дорожная карта и все месячные планы скопированы`)
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="Новый проект"
    subtitle="Клиент, тип и дорожная карта связаны: карта подбирается по типу проекта"
    size="lg"
    submit="Создать проект"
    :submit-allowed="can('project.create')"
    :submit-tip="TIP_TEAM"
    manual
    @submit="submit"
  >
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
      <UiField label="Контактное лицо" opt="можно позже"><UInput v-model="form.newContact" placeholder="Имя и фамилия" /></UiField>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UiField label="Тип проекта" req><USelect v-model="form.type" :options="typeOptions" placeholder="Выберите тип" required /></UiField>
      <UiField label="Дорожная карта" req :hint="roadmapInfo">
        <USelect v-model="form.roadmap" :options="roadmapOptions" :placeholder="form.type ? undefined : 'Сначала выберите тип'" required />
      </UiField>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <UiField label="Старт работ"><USelect v-model="form.start" :options="startOptions" /></UiField>
      <UiField v-if="can('finance.fee.view')" label="Чек в месяц, ₽"><UInput v-model="form.budget" type="number" min="0" step="1000" placeholder="120 000" /></UiField>
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
