<script setup lang="ts">
// Окно «Оформить отпуск» (registerModal('vacation') в assets/modals.js): проекты и приёмка переходят заместителю.
import { PROJECTS, ROLE_NAME, TEAM, shortName } from '~/constants/directory'

type Member = (typeof TEAM)[number]

const props = defineProps<{
  modelValue: boolean
  /** data-prefill-employee / -from / -to / -substitute. */
  prefill?: { employee?: string; from?: string; to?: string; substitute?: string }
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [detail: { employee: Member; substitute: Member; from: string; to: string; projects: string[] }]
}>()

const { user, hasRole } = useRole()
const notify = useNotify()

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const person = (id: string) => TEAM.find(p => p.id === id)
const employeeOptions = TEAM.filter(p => p.role !== 'owner').map(p => ({ value: p.id, label: `${p.name} · ${ROLE_NAME[p.role]}` }))

// Сотрудник и подрядчик оформляют отпуск только себе.
const self = computed(() => hasRole(['seo_specialist', 'contractor']))

const blank = () => ({
  employee: self.value ? user.value.id : (props.prefill?.employee ?? 'petrov'),
  from: props.prefill?.from ?? '2025-07-14',
  to: props.prefill?.to ?? '2025-07-28',
  substitute: props.prefill?.substitute ?? 'morozov',
  projects: [] as string[],
  back: true
})
const form = ref(blank())

const substituteOptions = computed(() => TEAM
  .filter(p => p.role !== 'client' && p.role !== 'contractor' && p.id !== form.value.employee)
  .map(p => ({ value: p.id, label: `${p.name} · ${ROLE_NAME[p.role]} · ${p.load} ч` })))
const empProjects = computed(() => (person(form.value.employee)?.projects ?? []).map(id => ({ id, name: PROJECTS.find(x => x.id === id)?.name ?? id })))

watch(() => form.value.employee, emp => {
  if (form.value.substitute === emp) form.value.substitute = ''
  form.value.projects = empProjects.value.map(p => p.id)
})
watch(open, v => {
  if (!v) return
  form.value = blank()
  if (form.value.substitute === form.value.employee) form.value.substitute = ''
  form.value.projects = empProjects.value.map(p => p.id)
})

const span = computed(() => {
  const { from: a, to: b } = form.value
  if (!a || !b) return 0
  return Math.round((Date.parse(b) - Date.parse(a)) / 864e5) + 1
})
const daysHint = computed(() => span.value > 0
  ? `${span.value} ${plural(span.value, ['день', 'дня', 'дней'])}`
  : (form.value.from && form.value.to ? 'Дата окончания раньше начала' : ''))

const dm = (s: string) => s.split('-').reverse().slice(0, 2).join('.')

function submit() {
  const emp = person(form.value.employee)
  const sub = person(form.value.substitute)
  if (!emp || !sub) return
  if (span.value <= 0) {
    notify('Проверьте выделенные поля')
    return
  }
  const from = dm(form.value.from)
  const to = dm(form.value.to)
  emit('saved', { employee: emp, substitute: sub, from, to, projects: [...form.value.projects] })
  open.value = false
  notify(`Отпуск оформлен: ${shortName(emp.name)}, ${from}–${to} · замещает ${shortName(sub.name)}`)
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="Оформить отпуск"
    subtitle="Проекты и приёмка на время отпуска переходят заместителю"
    submit="Оформить отпуск"
    manual
    @submit="submit"
  >
    <UiField label="Сотрудник" req>
      <USelect v-model="form.employee" :options="employeeOptions" required :disabled="self" />
    </UiField>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UiField label="С" req><UInput v-model="form.from" type="date" required /></UiField>
      <UiField label="По" req :hint="daysHint || undefined"><UInput v-model="form.to" type="date" required :min="form.from || undefined" /></UiField>
    </div>
    <UiField label="Кому передать проекты" req hint="Заместитель получит задачи в работе и приёмку">
      <USelect v-model="form.substitute" :options="substituteOptions" placeholder="Выберите заместителя" required />
    </UiField>
    <UiField label="Проекты на время отпуска">
      <div class="rounded-2xl border border-zinc-200 p-3 space-y-2">
        <label v-for="p in empProjects" :key="p.id" class="flex items-start gap-2.5 text-sm cursor-pointer">
          <input v-model="form.projects" type="checkbox" :value="p.id" class="mt-0.5 w-4 h-4 rounded border-zinc-300 accent-accent">
          <span>{{ p.name }}</span>
        </label>
        <div v-if="!empProjects.length" class="text-xs text-zinc-500">У сотрудника нет проектов — передавать нечего</div>
      </div>
    </UiField>
    <label class="flex items-start gap-2.5 text-sm cursor-pointer">
      <input v-model="form.back" type="checkbox" class="mt-0.5 w-4 h-4 rounded border-zinc-300 accent-accent">
      <span>Вернуть проекты после отпуска автоматически</span>
    </label>
  </UiSheet>
</template>
