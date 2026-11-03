<script setup lang="ts">
// Окно «Внести факт за месяц» (registerModal('fact') в assets/modals.js).
// План и уже внесённые значения страница передаёт в metrics (SEOApp.metrics прототипа).
import { PROJECTS, monthOptions } from '~/constants/directory'
import type { FactSaved, MetricKey, ProjectMetrics } from '~/types/project'

const props = defineProps<{
  modelValue: boolean
  metrics?: ProjectMetrics
  project?: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [fact: FactSaved]
}>()

const { can } = useRole()
const notify = useNotify()

const KEYS: MetricKey[] = ['traffic', 'leads', 'top10']
const projectOptions = PROJECTS.map(p => ({ value: p.id, label: p.name }))
const monthOpts = monthOptions(0, 5)
const sourceOptions = [
  { value: 'manual', label: 'Ручной ввод данных' },
  { value: 'metrika', label: 'Сверка с Яндекс.Метрикой' },
  { value: 'crm', label: 'Данные клиента из CRM' }
]

const form = ref({
  project: props.project ?? 'holod', month: '2025-06', traffic: '', leads: '', top10: '',
  source: 'manual', comment: '', toReport: true
})
const index = computed(() => Math.max(0, monthOpts.findIndex(o => o.value === form.value.month)))

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

function fill() {
  const s = props.metrics?.series
  KEYS.forEach(k => {
    const v = s?.[k]?.fact[index.value]
    form.value[k] = v != null ? String(v) : ''
  })
}
const hints = computed(() => {
  const s = props.metrics?.series
  const i = index.value
  return Object.fromEntries(KEYS.map(k => {
    const m = s?.[k]
    if (!m) return [k, '']
    const fact = m.fact[i]
    return [k, `План: ${fmtNum(m.plan![i]!, m.suffix)}${fact != null ? ` · сейчас ${fmtNum(fact, m.suffix)}` : ''}`]
  })) as Record<MetricKey, string>
})

watch(open, v => {
  if (!v) return
  form.value.source = 'manual'
  if (props.project) form.value.project = props.project
  fill()
})
watch(() => [form.value.month, form.value.project], fill)

function submit() {
  const values = { traffic: +form.value.traffic, leads: +form.value.leads, top10: +form.value.top10 }
  if (KEYS.some(k => values[k] < 0) || values.top10 > 100) {
    notify('Проверьте выделенные поля')
    return
  }
  const month = monthOpts[index.value]!.label
  emit('saved', { index: index.value, values, month })
  open.value = false
  notify(`Факт за ${month.toLowerCase()} сохранён · трафик ${values.traffic.toLocaleString('ru-RU')}, лиды ${values.leads}, ТОП-10 ${fmtNum(values.top10, '%')}`)
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="Внести факт за месяц"
    subtitle="Ручные значения перекрывают данные счётчиков в отчёте"
    submit="Сохранить факт"
    :submit-allowed="can('project.update')"
    :submit-tip="TIP_TEAM"
    manual
    @submit="submit"
  >
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UiField label="Проект">
        <USelect v-model="form.project" :options="projectOptions" :disabled="!!metrics" :class="metrics && 'bg-zinc-50'" />
      </UiField>
      <UiField label="Месяц" req><USelect v-model="form.month" :options="monthOpts" required /></UiField>
    </div>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <UiField label="Трафик, визиты" req :hint="hints.traffic"><UInput v-model="form.traffic" type="number" min="0" step="1" required /></UiField>
      <UiField label="Лиды" req :hint="hints.leads"><UInput v-model="form.leads" type="number" min="0" step="1" required /></UiField>
      <UiField label="% в ТОП-10" req :hint="hints.top10"><UInput v-model="form.top10" type="number" min="0" max="100" step="0.1" required /></UiField>
    </div>
    <UiField label="Источник цифр"><USelect v-model="form.source" :options="sourceOptions" /></UiField>
    <UiField label="Комментарий" opt="опционально">
      <UTextarea v-model="form.comment" :rows="2" resize placeholder="Например: часть лидов пришла по телефону, учтено вручную" />
    </UiField>
    <label class="flex items-start gap-2.5 text-sm cursor-pointer">
      <input v-model="form.toReport" type="checkbox" class="mt-0.5 w-4 h-4 rounded border-zinc-300 accent-accent">
      <span>Показать в отчёте клиенту за этот месяц</span>
    </label>
  </UiSheet>
</template>
