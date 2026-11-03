<script setup lang="ts">
// Окно «Роль в проекте» (registerModal('team-role') в assets/modals.js). Участник и текущая роль — из строки команды.
import { PROJECT_ROLES, type ProjectRole } from '~/types/project'

const props = defineProps<{
  modelValue: boolean
  /** Имя участника из строки команды. */
  name?: string
  /** Текущая подпись бейджа роли («Рук. SEO», «Менеджер» …). */
  current?: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [role: ProjectRole]
}>()

const { can } = useRole()
const notify = useNotify()

const roleOptions = PROJECT_ROLES.map(r => ({ value: r.id, label: r.name }))
const as = ref<string>('employee')

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
watch(open, v => {
  if (!v) return
  const match = PROJECT_ROLES.find(r => r.short === props.current || r.name === props.current)
  as.value = match ? match.id : 'employee'
})

function submit() {
  const role = PROJECT_ROLES.find(r => r.id === as.value) ?? PROJECT_ROLES[2]
  emit('saved', role)
  open.value = false
  notify(`Роль обновлена: ${role.name}`)
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="Роль в проекте"
    subtitle="Изменить роль участника команды"
    submit="Сохранить"
    :submit-allowed="can('project.update')"
    :submit-tip="TIP_TEAM"
    manual
    @submit="submit"
  >
    <UiField label="Сотрудник">
      <div class="px-3.5 py-2 rounded-xl border border-zinc-200 bg-zinc-50 text-sm text-zinc-700">{{ name || '—' }}</div>
    </UiField>
    <UiField label="Роль в проекте" req hint="Роль определяет доступ к задачам, отчётам и финансам проекта">
      <USelect v-model="as" :options="roleOptions" required />
    </UiField>
  </UiSheet>
</template>
