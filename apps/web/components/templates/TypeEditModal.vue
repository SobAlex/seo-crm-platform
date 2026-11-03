<script setup lang="ts">
// Окно «Редактировать тип проекта» (#type-edit-modal): поля заполнены из выбранного типа.
import { TIP_MANAGE, type ProjectType } from '~/types/templates'

const props = defineProps<{ modelValue: boolean; type: ProjectType | null }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [type: ProjectType]
}>()

const { can } = useRole()
const form = ref<ProjectType>({ id: '', name: '', desc: '', color: 'violet' })

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
watch(open, v => { if (v && props.type) form.value = { ...props.type } })
</script>

<template>
  <UiSheet
    v-model="open"
    title="Редактировать тип проекта"
    :submit-toast="`Тип проекта «${form.name.trim()}» сохранён`"
    :submit-allowed="can('templates.manage')"
    :submit-tip="TIP_MANAGE"
    @submit="emit('saved', { ...form, name: form.name.trim() })"
  >
    <UiField label="Название"><UInput v-model="form.name" required /></UiField>
    <UiField label="Описание"><UTextarea v-model="form.desc" :rows="2" resize /></UiField>
    <UiField label="Цвет маркера"><TemplatesColorPicker v-model="form.color" /></UiField>
    <div class="rounded-xl border border-black/5 p-3 bg-zinc-50">
      <p class="text-xs text-zinc-500">Изменения применяются ко всем картам и планам этого типа.</p>
    </div>
  </UiSheet>
</template>
