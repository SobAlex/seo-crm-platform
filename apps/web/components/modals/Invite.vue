<script setup lang="ts">
// Окно «Пригласить пользователя» (registerModal('invite') в assets/modals.js).
// Роли, которые нельзя выдать (canGrant из @crm/access), остаются в списке с пометкой «— нет права».
import type { Role } from '@crm/access'
import { PROJECTS, ROLE_NAME } from '~/constants/directory'

const props = defineProps<{
  modelValue: boolean
  /** Роль, выбранная при открытии (например, seo_head из «места руководителя»). */
  prefillRole?: Role
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  invited: [user: { email: string; name: string; role: Role }]
}>()

const { can, canGrant, roles } = useRole()
const notify = useNotify()

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const roleOptions = computed(() => roles.map(r => {
  if (r === 'owner') return { value: r, label: `${ROLE_NAME[r]} — один на компанию`, disabled: true }
  const ok = canGrant(r)
  return { value: r, label: ROLE_NAME[r] + (ok ? '' : ' — нет права'), disabled: !ok }
}))
const projectOptions = PROJECTS.map(p => ({ value: p.id, label: p.name }))
const deptOptions = ['SEO', 'Менеджеры', 'Контент']

const STAFF_ROLES: Role[] = ['seo_head', 'mgr_head', 'account_manager', 'seo_specialist']

const blank = () => {
  const wanted = props.prefillRole ?? 'seo_specialist'
  const role: Role | '' = canGrant(wanted) ? wanted : (roles.find(r => canGrant(r)) ?? '')
  return {
    role, email: '', name: '', dept: 'SEO', week: '40', until: '', rate: '', clientProject: 'holod',
    allProjects: true, allTouched: false, projects: [] as string[], message: ''
  }
}
const form = ref(blank())
watch(open, v => { if (v) form.value = blank() })

const desc = computed(() => form.value.role ? DEMO_USERS[form.value.role].desc : '')
const isStaff = computed(() => !!form.value.role && STAFF_ROLES.includes(form.value.role))
const isContractor = computed(() => form.value.role === 'contractor')
const isClient = computed(() => form.value.role === 'client')

watch(() => form.value.role, r => {
  if (r === 'contractor' && form.value.allProjects && !form.value.allTouched) form.value.allProjects = false
})

function submit() {
  const f = form.value
  if (!f.role) return
  emit('invited', { email: f.email, name: f.name, role: f.role })
  open.value = false
  notify(`Приглашение отправлено: ${f.email} · ${ROLE_NAME[f.role]}`)
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="Пригласить пользователя"
    subtitle="Роль определяет, что человек увидит в SEO Control"
    submit="Отправить приглашение"
    :submit-allowed="can('users.invite')"
    :submit-tip="TIP_SYSTEM"
    manual
    @submit="submit"
  >
    <UiField label="Роль" req :hint="desc">
      <USelect v-model="form.role" :options="roleOptions" required />
    </UiField>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UiField label="Email" req><UInput v-model="form.email" type="email" required placeholder="name@romashka.ru" /></UiField>
      <UiField label="Имя и фамилия" opt="опционально"><UInput v-model="form.name" placeholder="Анна Белова" /></UiField>
    </div>
    <div v-if="isStaff" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UiField label="Отдел"><USelect v-model="form.dept" :options="deptOptions" /></UiField>
      <UiField label="Норма часов в неделю"><UInput v-model="form.week" type="number" min="1" max="60" /></UiField>
    </div>
    <div v-if="isContractor" class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UiField label="Доступ до" opt="опционально" hint="После даты доступ закроется сам"><UInput v-model="form.until" type="date" /></UiField>
      <UiField v-if="can('finance.cost.view')" label="Ставка подрядчика, ₽/ч"><UInput v-model="form.rate" type="number" min="0" step="100" placeholder="1 200" /></UiField>
    </div>
    <UiField v-if="isClient" label="Проект клиента" req hint="Клиент увидит только этот проект — в режиме просмотра">
      <USelect v-model="form.clientProject" :options="projectOptions" required />
    </UiField>
    <UiField v-if="isStaff || isContractor" label="Проекты">
      <div class="rounded-2xl border border-zinc-200 p-4 space-y-3">
        <label class="flex items-start gap-2.5 text-sm cursor-pointer">
          <input v-model="form.allProjects" type="checkbox" class="mt-0.5 w-4 h-4 rounded border-zinc-300 accent-accent" @change="form.allTouched = true">
          <span>Все проекты компании</span>
        </label>
        <div class="border-t border-zinc-100 pt-3 space-y-2">
          <label v-for="p in PROJECTS" :key="p.id" class="flex items-start gap-2.5 text-sm cursor-pointer" :class="form.allProjects && 'opacity-50'">
            <input v-model="form.projects" type="checkbox" :value="p.id" :disabled="form.allProjects" class="mt-0.5 w-4 h-4 rounded border-zinc-300 accent-accent">
            <span>{{ p.name }}</span>
          </label>
        </div>
      </div>
    </UiField>
    <UiField label="Сообщение" opt="опционально">
      <UTextarea v-model="form.message" :rows="2" resize placeholder="Добавьте пару слов к приглашению" />
    </UiField>
  </UiSheet>
</template>
