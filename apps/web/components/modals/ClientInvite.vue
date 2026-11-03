<script setup lang="ts">
// Окно «Пригласить клиента в портал» (registerModal('client-invite') в assets/modals.js).
import { CLIENTS, PROJECTS } from '~/constants/directory'

const props = defineProps<{
  modelValue: boolean
  prefillClient?: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  invited: [detail: { client: string; email: string; contact: string; projects: string[] }]
}>()

const { can } = useRole()
const notify = useNotify()

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const clientOptions = CLIENTS.map(c => ({ value: c.id, label: c.name }))
const form = ref({ client: 'holod', email: '', contact: '', all: false, projects: [] as string[] })

const projectList = computed(() => {
  const own = PROJECTS.filter(p => p.client === form.value.client)
  return own.length ? own : PROJECTS
})

function paint() {
  const c = CLIENTS.find(x => x.id === form.value.client) ?? CLIENTS[0]!
  const list = projectList.value
  form.value.email = c.email
  form.value.contact = c.contact
  form.value.projects = list.filter((_, i) => i === 0 || list.length === 1).map(p => p.id)
  if (form.value.all) form.value.projects = list.map(p => p.id)
}

watch(open, v => {
  if (!v) return
  form.value = { client: props.prefillClient ?? 'holod', email: '', contact: '', all: false, projects: [] }
  paint()
})
watch(() => form.value.client, (_, prev) => { if (prev && open.value) paint() })
watch(() => form.value.all, all => { if (all) form.value.projects = projectList.value.map(p => p.id) })

function submit() {
  const { email, contact, projects } = form.value
  const n = projects.length
  emit('invited', { client: CLIENTS.find(c => c.id === form.value.client)?.name ?? '', email, contact, projects })
  open.value = false
  notify('Приглашение отправлено на ' + email + (n ? ` · ${n} проект${n === 1 ? '' : n < 5 ? 'а' : 'ов'}` : ''))
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="Пригласить клиента в портал"
    subtitle="Клиент получит ссылку для входа и доступ к просмотру результатов, дорожной карты и согласования задач"
    submit="Отправить приглашение"
    :submit-allowed="can('users.invite')"
    :submit-tip="TIP_SYSTEM"
    manual
    @submit="submit"
  >
    <UiField label="Клиент" req><USelect v-model="form.client" :options="clientOptions" required /></UiField>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UiField label="Email контакта" req><UInput v-model="form.email" type="email" required placeholder="name@company.ru" /></UiField>
      <UiField label="Имя контакта"><UInput v-model="form.contact" placeholder="Сергей Волков" /></UiField>
    </div>
    <UiField label="Проекты" hint="Клиент увидит только выбранные проекты — в режиме просмотра">
      <div class="rounded-2xl border border-zinc-200 p-4 space-y-3">
        <label class="flex items-start gap-2.5 text-sm cursor-pointer">
          <input v-model="form.all" type="checkbox" name="all_projects" class="mt-0.5 w-4 h-4 rounded border-zinc-300 accent-accent">
          <span>Все проекты клиента</span>
        </label>
        <div class="border-t border-zinc-100 pt-3 space-y-2">
          <label v-for="p in projectList" :key="p.id" class="flex items-start gap-2.5 text-sm cursor-pointer" :class="form.all && 'opacity-50'">
            <input v-model="form.projects" type="checkbox" name="projects" :value="p.id" :disabled="form.all" class="mt-0.5 w-4 h-4 rounded border-zinc-300 accent-accent">
            <span>{{ p.name }}</span>
          </label>
        </div>
      </div>
    </UiField>
    <div class="rounded-2xl bg-zinc-50 px-4 py-3 text-xs text-zinc-600 leading-relaxed">Роль «Клиент»: результаты, дорожная карта, принятые отчёты и задачи на согласовании. Внутренние часы и ставки скрыты.</div>
  </UiSheet>
</template>
