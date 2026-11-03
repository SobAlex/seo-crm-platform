<script setup lang="ts">
// Окно «Создать тип проекта» (#type-modal).
import { TIP_MANAGE, type TypeColor } from '~/types/templates'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: [type: { name: string; desc: string; color: TypeColor }]
}>()

const { can } = useRole()
const blank = () => ({ name: '', desc: '', color: 'violet' as TypeColor })
const form = ref(blank())

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
watch(open, v => { if (v) form.value = blank() })
</script>

<template>
  <UiSheet
    v-model="open"
    title="Создать тип проекта"
    submit="Создать тип"
    :submit-toast="`Тип проекта «${form.name.trim()}» создан`"
    :submit-allowed="can('templates.manage')"
    :submit-tip="TIP_MANAGE"
    @submit="emit('created', { ...form, name: form.name.trim() })"
  >
    <UiField label="Название"><UInput v-model="form.name" required placeholder="Например: Маркетплейс" /></UiField>
    <UiField label="Описание" opt="опционально"><UTextarea v-model="form.desc" :rows="2" resize placeholder="Чем этот тип отличается от других" /></UiField>
    <UiField label="Цвет маркера"><TemplatesColorPicker v-model="form.color" /></UiField>
    <div class="rounded-xl border border-black/5 p-3 bg-zinc-50">
      <p class="text-xs text-zinc-500">После создания тип появится в списке и станет доступен в формах создания карт и планов.</p>
    </div>
  </UiSheet>
</template>
