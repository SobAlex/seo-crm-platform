<script setup lang="ts">
// Окно «Передать проект» (registerModal('transfer') в assets/modals.js).
import { ROLE_NAME, TEAM } from '~/constants/directory'
import type { TeamPerson } from '~/types/project'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  transferred: [payload: { person: TeamPerson; role: string }]
}>()

const { can } = useRole()
const notify = useNotify()

const assigneeOptions = TEAM
  .filter(p => ['seo_head', 'seo_specialist', 'account_manager', 'mgr_head'].includes(p.role) && p.id !== 'petrov')
  .map(p => ({ value: p.id, label: `${p.name} · ${ROLE_NAME[p.role]} · ${p.load} ч` }))
const asOptions = [{ value: 'lead', label: 'Ответственный SEO' }, { value: 'pm', label: 'Менеджер проекта' }]
const WHAT = [
  { value: 'tasks', label: 'Открытые задачи', hint: '6 задач в работе и 2 на приёмке' },
  { value: 'report', label: 'Подготовку отчёта за июнь' },
  { value: 'access', label: 'Доступы к счётчикам и Вебмастеру' }
]

const blank = () => ({ assignee: '', from: '2025-06-16', as: 'lead', what: ['tasks', 'report', 'access'], comment: '', notify: false })
const form = ref(blank())

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
watch(open, v => { if (v) form.value = blank() })

const assigneeInfo = computed(() => {
  const p = TEAM.find(x => x.id === form.value.assignee)
  if (!p) return 'Рядом — загрузка на текущей неделе'
  const [n, cap] = p.load.split('/').map(Number) as [number, number]
  return `Загрузка ${p.load} ч` + (n >= cap ? ' — сотрудник уже перегружен' : ` · после передачи ≈ ${Math.min(n + 9, 99)}/${cap} ч`)
})

function submit() {
  const p = TEAM.find(x => x.id === form.value.assignee)!
  emit('transferred', { person: { id: p.id, name: p.name }, role: ROLE_NAME[p.role] })
  open.value = false
  notify(`Проект передан: ${p.name}`)
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="Передать проект"
    subtitle="Интернет-магазин «Холод» · сейчас ведёт Алексей Петров"
    submit="Передать проект"
    :submit-allowed="can('project.assign_team')"
    :submit-tip="TIP_TEAM"
    manual
    @submit="submit"
  >
    <UiField label="Новый ответственный" req :hint="assigneeInfo">
      <USelect v-model="form.assignee" :options="assigneeOptions" placeholder="Выберите сотрудника" required />
    </UiField>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UiField label="Передать с" req><UInput v-model="form.from" type="date" required /></UiField>
      <UiField label="Роль в проекте"><USelect v-model="form.as" :options="asOptions" /></UiField>
    </div>
    <UiField label="Что передать">
      <div class="rounded-2xl border border-zinc-200 p-4 space-y-3">
        <label v-for="w in WHAT" :key="w.value" class="flex items-start gap-2.5 text-sm cursor-pointer">
          <input v-model="form.what" type="checkbox" :value="w.value" class="mt-0.5 w-4 h-4 rounded border-zinc-300 accent-accent">
          <span>{{ w.label }}<span v-if="w.hint" class="block text-xs text-zinc-500 mt-0.5">{{ w.hint }}</span></span>
        </label>
      </div>
    </UiField>
    <UiField label="Комментарий для нового ответственного" opt="опционально">
      <UTextarea v-model="form.comment" :rows="2" resize placeholder="Что важно знать по проекту" />
    </UiField>
    <label class="flex items-start gap-2.5 text-sm cursor-pointer">
      <input v-model="form.notify" type="checkbox" class="mt-0.5 w-4 h-4 rounded border-zinc-300 accent-accent">
      <span>Уведомить клиента о смене специалиста<span class="block text-xs text-zinc-500 mt-0.5">Письмо уйдёт контакту ООО «Холод Групп»</span></span>
    </label>
  </UiSheet>
</template>
