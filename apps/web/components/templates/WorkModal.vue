<script setup lang="ts">
// Окно «Добавить работу» (#work-modal): работа добавляется в выбранное направление карты.
import { ROLE_OPTIONS, TIP_MANAGE, type RoadmapDirection, type WorkRole } from '~/types/templates'

const props = defineProps<{
  modelValue: boolean
  roadmapName: string
  directions: RoadmapDirection[]
  /** Направление, из которого открыто окно. */
  directionId?: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  added: [dirId: string, work: { title: string; role: WorkRole; hours: number }]
}>()

const { can } = useRole()
const form = ref({ dir: '', title: '', role: 'seo' as WorkRole, hours: '0' })
const dirOptions = computed(() => props.directions.map(d => ({ value: d.id, label: d.name })))

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
watch(open, v => { if (v) form.value = { dir: props.directionId ?? props.directions[0]?.id ?? '', title: '', role: 'seo', hours: '0' } })
</script>

<template>
  <UiSheet
    v-model="open"
    title="Добавить работу"
    submit="Добавить"
    submit-toast="Работа добавлена в направление"
    :submit-allowed="can('templates.manage')"
    :submit-tip="TIP_MANAGE"
    @submit="emit('added', form.dir, { title: form.title.trim(), role: form.role, hours: Number(form.hours) || 0 })"
  >
    <UiField label="Карта"><UInput :model-value="roadmapName" disabled /></UiField>
    <UiField label="Направление"><USelect v-model="form.dir" :options="dirOptions" required /></UiField>
    <UiField label="Название работы"><UInput v-model="form.title" required placeholder="Например: Проверка хлебных крошек" /></UiField>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UiField label="Роль"><USelect v-model="form.role" :options="ROLE_OPTIONS" /></UiField>
      <UiField label="Оценка, ч"><UInput v-model="form.hours" type="number" min="0" step="0.5" /></UiField>
    </div>
    <div class="rounded-xl border border-black/5 p-3 bg-zinc-50">
      <p class="text-xs text-zinc-500">Работа появится в выбранном направлении и станет доступна для задач в планах месяца.</p>
    </div>
  </UiSheet>
</template>
