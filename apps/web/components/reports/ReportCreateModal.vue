<script setup lang="ts">
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; created: [month: string] }>()

const { can } = useRole()
const notify = useNotify()

interface ProjectOption { id: string; name: string }

const FALLBACK: ProjectOption[] = [
  { id: 'prj_holod', name: 'Интернет-магазин «Холод»' },
  { id: 'prj_remont', name: 'Сайт услуг «Ремонт+»' },
  { id: 'prj_medlife', name: 'Клиника «МедЛайф»' },
  { id: 'prj_stroy', name: 'B2B портал «Стройтех»' }
]
const INCLUDE = [
  { id: 'metrics', label: 'Метрики из Метрики, Вебмастера и GSC' },
  { id: 'works', label: 'Принятые задачи и комментарии с отметкой «В отчёте»' },
  { id: 'plan', label: 'План на следующий период' }
]

const projects = ref<ProjectOption[]>(FALLBACK)
const pending = ref(false)

function monthOptions() {
  const out: { value: string; label: string }[] = []
  const start = Date.UTC(2025, 2, 1)
  const now = new Date()
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  while (cursor.getTime() >= start) {
    const value = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, '0')}`
    out.push({ value, label: `${MONTHS[cursor.getUTCMonth()]} ${cursor.getUTCFullYear()}` })
    cursor.setUTCMonth(cursor.getUTCMonth() - 1)
  }
  return out
}

const MONTH_OPTIONS = monthOptions()
const projectOptions = computed(() => projects.value.map(project => ({ value: project.id, label: project.name })))

const blank = () => ({
  project: projects.value[0]?.id || 'prj_holod',
  month: MONTH_OPTIONS.some(option => option.value === '2025-05') ? '2025-05' : (MONTH_OPTIONS[0]?.value || '2025-05'),
  summary: '',
  include: INCLUDE.map(item => item.id)
})
const form = ref(blank())

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

watch(open, async (value) => {
  if (!value) return
  form.value = blank()
  try {
    const list = await $fetch<ProjectOption[]>('/api/projects', { credentials: 'include' })
    if (list.length) {
      projects.value = list
      if (!list.some(project => project.id === form.value.project)) form.value.project = list[0]!.id
    }
  } catch {
    projects.value = FALLBACK
  }
})

async function submit() {
  if (pending.value) return
  pending.value = true
  try {
    await $fetch('/api/reports/generate', {
      method: 'POST',
      credentials: 'include',
      body: {
        projectId: form.value.project,
        month: form.value.month,
        summaryText: form.value.summary
      }
    })
    notify('Отчёт собран', 'success')
    window.dispatchEvent(new Event('notifications:refresh'))
    const month = form.value.month
    open.value = false
    emit('created', month)
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
    title="Создать отчёт за месяц"
    submit="Создать черновик"
    :submit-allowed="can('report.draft') && !pending"
    submit-tip="Составлять отчёты может сотрудник компании"
    manual
    :submit-toast="false"
    @submit="submit"
  >
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <UiField label="Проект"><USelect v-model="form.project" :options="projectOptions" /></UiField>
      <UiField label="Отчётный месяц"><USelect v-model="form.month" :options="MONTH_OPTIONS" /></UiField>
    </div>
    <UiField label="Резюме руководителя">
      <UTextarea v-model="form.summary" :rows="4" resize placeholder="Что важно сказать клиенту за этот месяц" />
    </UiField>
    <div>
      <label class="block text-xs font-medium text-zinc-500 mb-2">Что включить</label>
      <div class="rounded-xl border border-zinc-200 divide-y divide-zinc-100">
        <label v-for="i in INCLUDE" :key="i.id" class="flex items-center gap-3 px-3.5 py-2.5 text-sm cursor-pointer">
          <input v-model="form.include" type="checkbox" :value="i.id" class="w-4 h-4 rounded border-zinc-300 accent-accent">{{ i.label }}
        </label>
      </div>
    </div>
    <div class="rounded-xl bg-zinc-50 p-3">
      <p class="text-xs text-zinc-500">Черновик соберётся автоматически. Перед отправкой клиенту его проверит менеджер проекта.</p>
    </div>
  </UiSheet>
</template>
