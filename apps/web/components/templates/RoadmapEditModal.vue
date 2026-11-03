<script setup lang="ts">
// Окно «Редактировать дорожную карту» (#roadmap-edit-modal): тип, название, описание.
import { TIP_MANAGE, type Roadmap } from '~/types/templates'

const props = defineProps<{
  modelValue: boolean
  roadmap: Roadmap | null
  typeOptions: { value: string; label: string }[]
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [patch: { type: string; name: string; desc: string }]
}>()

const { can } = useRole()
const form = ref({ type: 'ecommerce', name: '', desc: '' })

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
watch(open, v => {
  if (v && props.roadmap) form.value = { type: props.roadmap.type, name: props.roadmap.name, desc: props.roadmap.desc }
})
</script>

<template>
  <UiSheet
    v-model="open"
    title="Редактировать дорожную карту"
    submit-toast="Дорожная карта сохранена"
    :submit-allowed="can('templates.manage')"
    :submit-tip="TIP_MANAGE"
    @submit="emit('saved', { ...form, name: form.name.trim(), desc: form.desc.trim() })"
  >
    <UiField label="Тип проекта"><USelect v-model="form.type" :options="typeOptions" /></UiField>
    <UiField label="Название"><UInput v-model="form.name" required /></UiField>
    <UiField label="Описание"><UTextarea v-model="form.desc" :rows="2" resize /></UiField>
    <div class="rounded-xl border border-black/5 p-3 bg-zinc-50">
      <p class="text-xs text-zinc-500">Направления и работы редактируются прямо в карточке карты.</p>
    </div>
  </UiSheet>
</template>
