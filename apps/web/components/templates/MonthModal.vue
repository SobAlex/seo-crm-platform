<script setup lang="ts">
// Окно «Создать месячный план» (#month-modal): без задач план не сохраняется.
import { TASKS, TIP_MANAGE, count, type PlanDraft } from '~/types/templates'

const props = defineProps<{
  modelValue: boolean
  typeOptions: { value: string; label: string }[]
  /** Тип, выбранный на вкладке месячных планов. */
  type?: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: [plan: PlanDraft]
}>()

const { can } = useRole()
const notify = useNotify()
const draft = ref<PlanDraft>({ type: 'ecommerce', name: '', desc: '', items: [] })

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
watch(open, v => { if (v) draft.value = { type: props.type ?? 'ecommerce', name: '', desc: '', items: [] } })

function submit() {
  const d = draft.value
  if (!d.items.length) {
    notify('Добавьте в план хотя бы одну задачу')
    return
  }
  const name = d.name.trim() || 'Месячный план'
  const typeName = props.typeOptions.find(o => o.value === d.type)?.label ?? ''
  emit('created', { ...d, name, items: d.items.map(i => ({ ...i })) })
  open.value = false
  notify(`План создан: ${name} · ${typeName} · ${count(d.items.length, TASKS)}`)
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="Создать месячный план"
    size="lg"
    submit="Создать план"
    :submit-allowed="can('templates.manage')"
    :submit-tip="TIP_MANAGE"
    manual
    @submit="submit"
  >
    <TemplatesPlanEditor v-model:draft="draft" :type-options="typeOptions" />
  </UiSheet>
</template>
