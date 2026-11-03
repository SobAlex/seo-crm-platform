<script setup lang="ts">
// Окно «Создать отчёт за месяц» (#report-create-modal в reports.html): черновик открывается на странице отчёта.
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const { can } = useRole()

const PROJECT_OPTIONS = [
  { value: 'holod', label: 'Холод' },
  { value: 'remont', label: 'Ремонт+' },
  { value: 'medlife', label: 'МедЛайф' },
  { value: 'stroytech', label: 'Стройтех' }
]
const MONTH_OPTIONS = [
  { value: '2025-06', label: 'Июнь 2025' },
  { value: '2025-05', label: 'Май 2025' },
  { value: '2025-04', label: 'Апрель 2025' }
]
const INCLUDE = [
  { id: 'metrics', label: 'Метрики из Метрики, Вебмастера и GSC' },
  { id: 'works', label: 'Принятые задачи и комментарии с отметкой «В отчёте»' },
  { id: 'plan', label: 'План на следующий период' }
]

const blank = () => ({ project: 'holod', month: '2025-06', include: INCLUDE.map(i => i.id) })
const form = ref(blank())

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
watch(open, v => { if (v) form.value = blank() })

function submit() {
  open.value = false
  navigateTo(`/reports/${form.value.month}`)
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="Создать отчёт за месяц"
    submit="Создать черновик"
    :submit-allowed="can('report.draft')"
    submit-tip="Составлять отчёты может сотрудник компании"
    manual
    @submit="submit"
  >
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <UiField label="Проект"><USelect v-model="form.project" :options="PROJECT_OPTIONS" /></UiField>
      <UiField label="Отчётный месяц"><USelect v-model="form.month" :options="MONTH_OPTIONS" /></UiField>
    </div>
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
