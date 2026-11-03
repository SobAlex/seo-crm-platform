<script setup lang="ts">
// Окно «Добавить направление» (#direction-modal): направление встаёт в конец выбранной карты.
import { TIP_MANAGE } from '~/types/templates'

const props = defineProps<{ modelValue: boolean; roadmapName: string }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  added: [name: string]
}>()

const { can } = useRole()
const name = ref('')

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
watch(open, v => { if (v) name.value = '' })
</script>

<template>
  <UiSheet
    v-model="open"
    title="Добавить направление"
    submit="Добавить"
    submit-toast="Направление добавлено в карту"
    :submit-allowed="can('templates.manage')"
    :submit-tip="TIP_MANAGE"
    @submit="emit('added', name.trim())"
  >
    <UiField label="Карта"><UInput :model-value="roadmapName" disabled /></UiField>
    <UiField label="Название направления"><UInput v-model="name" required placeholder="Например: Аналитика" /></UiField>
    <div class="rounded-xl border border-black/5 p-3 bg-zinc-50">
      <p class="text-xs text-zinc-500">Направление появится в конце списка. Внутри можно будет добавить работы.</p>
    </div>
  </UiSheet>
</template>
