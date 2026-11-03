<script setup lang="ts">
// Окно «Редактировать месячный план» (#month-edit-modal): задачи плана подгружаются из карточки.
import { TASKS, TIP_MANAGE, count, type PlanDraft } from '~/types/templates'

const props = defineProps<{
  modelValue: boolean
  typeOptions: { value: string; label: string }[]
  plan: PlanDraft | null
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [plan: PlanDraft]
}>()

const { can } = useRole()
const notify = useNotify()
const draft = ref<PlanDraft>({ type: 'ecommerce', name: '', desc: '', items: [] })

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
watch(open, v => {
  if (v && props.plan) draft.value = { ...props.plan, items: props.plan.items.map(i => ({ ...i })) }
})

function submit() {
  const d = draft.value
  if (!d.items.length) {
    notify('Добавьте в план хотя бы одну задачу')
    return
  }
  const name = d.name.trim() || 'Месячный план'
  const typeName = props.typeOptions.find(o => o.value === d.type)?.label ?? ''
  emit('saved', { ...d, name, items: d.items.map(i => ({ ...i })) })
  open.value = false
  notify(`План сохранён: ${name} · ${typeName} · ${count(d.items.length, TASKS)}`)
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="Редактировать месячный план"
    size="lg"
    :submit-allowed="can('templates.manage')"
    :submit-tip="TIP_MANAGE"
    manual
    @submit="submit"
  >
    <TemplatesPlanEditor v-model:draft="draft" :type-options="typeOptions" />
  </UiSheet>
</template>
