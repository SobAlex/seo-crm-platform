<script setup lang="ts">
// Окно «Добавить в команду» (registerModal('team-add') в assets/modals.js).
import { ROLE_NAME, TEAM } from '~/constants/directory'
import { PROJECT_ROLES, type ProjectRole, type TeamPerson } from '~/types/project'

const props = withDefaults(defineProps<{ modelValue: boolean; project?: string }>(), { project: 'Интернет-магазин «Холод»' })
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  added: [payload: { person: TeamPerson; role: ProjectRole; hours: string; until: string }]
}>()

const { can } = useRole()
const notify = useNotify()

const memberOptions = TEAM.filter(p => ['dronov', 'vetrova', 'smirnov', 'kim'].includes(p.id)).map(p => ({ value: p.id, label: `${p.name} · ${ROLE_NAME[p.role]} · ${p.load} ч` }))
const roleOptions = PROJECT_ROLES.map(r => ({ value: r.id, label: r.name }))

const blank = () => ({ member: '', as: 'employee', hours: '20', until: '2025-09-30' })
const form = ref(blank())

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
watch(open, v => { if (v) form.value = blank() })

function submit() {
  const p = TEAM.find(x => x.id === form.value.member)!
  const role = PROJECT_ROLES.find(r => r.id === form.value.as) ?? PROJECT_ROLES[2]
  emit('added', { person: { id: p.id, name: p.name }, role, hours: form.value.hours, until: form.value.until })
  open.value = false
  notify(`${p.name} добавлен(а) в команду · ${role.name}`)
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="Добавить в команду"
    :subtitle="project"
    submit="Добавить"
    :submit-allowed="can('project.update')"
    :submit-tip="TIP_TEAM"
    manual
    @submit="submit"
  >
    <UiField label="Сотрудник" req><USelect v-model="form.member" :options="memberOptions" placeholder="Выберите" required /></UiField>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UiField label="Роль в проекте" req><USelect v-model="form.as" :options="roleOptions" required /></UiField>
      <UiField label="Лимит часов в месяц"><UInput v-model="form.hours" type="number" min="1" /></UiField>
    </div>
    <UiField v-if="form.as === 'contractor'" label="Доступ до" hint="Подрядчик увидит только назначенные задачи проекта">
      <UInput v-model="form.until" type="date" />
    </UiField>
  </UiSheet>
</template>
