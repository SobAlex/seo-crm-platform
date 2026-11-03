<script setup lang="ts">
// Окно «Добавить работу» (#work-modal): работа добавляется в выбранное направление карты.
import { TIP_MANAGE, type RoadmapDirection } from '~/types/templates'

const props = defineProps<{
  modelValue: boolean
  roadmapName: string
  directions: RoadmapDirection[]
  /** Направление, из которого открыто окно. */
  directionId?: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  added: [dirId: string, title: string]
}>()

const { can } = useRole()
const form = ref({ dir: '', title: '' })
const dirOptions = computed(() => props.directions.map(d => ({ value: d.id, label: d.name })))

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
watch(open, v => { if (v) form.value = { dir: props.directionId ?? props.directions[0]?.id ?? '', title: '' } })
</script>

<template>
  <UiSheet
    v-model="open"
    title="Добавить работу"
    submit="Добавить"
    submit-toast="Работа добавлена в направление"
    :submit-allowed="can('templates.manage')"
    :submit-tip="TIP_MANAGE"
    @submit="emit('added', form.dir, form.title.trim())"
  >
    <UiField label="Карта"><UInput :model-value="roadmapName" disabled /></UiField>
    <UiField label="Направление"><USelect v-model="form.dir" :options="dirOptions" required /></UiField>
    <UiField label="Название работы"><UInput v-model="form.title" required placeholder="Например: Проверка хлебных крошек" /></UiField>
    <div class="rounded-xl border border-black/5 p-3 bg-zinc-50">
      <p class="text-xs text-zinc-500">Работа появится в выбранном направлении и станет доступна для задач в планах месяца.</p>
    </div>
  </UiSheet>
</template>
