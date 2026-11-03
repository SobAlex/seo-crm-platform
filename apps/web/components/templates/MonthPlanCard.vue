<script setup lang="ts">
// Аккордеон месячного плана: задачи с направлением, исполнителем и часами; быстрое добавление задачи из карты.
import { CONFIRM_ITEM, CONFIRM_TEMPLATE, ROADMAP_WORKS, TASKS, TIP_DELETE, TIP_MANAGE, count, findWork, hoursText, newId, roadmapWorks, rowHours, type MonthPlan, type PlanRow } from '~/types/templates'

const props = defineProps<{ plan: MonthPlan; typeName: string }>()
const emit = defineEmits<{
  duplicate: []
  edit: []
  remove: []
  removeRow: [rowId: string]
  addRow: [row: PlanRow]
}>()

const { can } = useRole()
const { confirm } = useConfirm()
const notify = useNotify()

const total = computed(() => props.plan.rows.reduce((s, r) => s + r.hours, 0))

async function remove() {
  if (await confirm(CONFIRM_TEMPLATE)) emit('remove')
}
async function removeRow(id: string) {
  if (await confirm(CONFIRM_ITEM)) emit('removeRow', id)
}

// Быстрое добавление: направление карты → её работа, либо свободная задача.
const dirOptions = computed(() => [
  ...(ROADMAP_WORKS[props.plan.type] ?? []).map(([dir], d) => ({ value: String(d + 1), label: `${d + 1} · ${dir}` })),
  { value: 'free', label: '— Свободная задача —' }
])
const dir = ref(dirOptions.value[0]?.value ?? 'free')
const workOptions = computed(() => roadmapWorks(props.plan.type).filter(w => String(w.dirCode) === dir.value).map(w => ({ value: w.code, label: `${w.code} ${w.title}` })))
const work = ref(workOptions.value[0]?.value ?? '')
watch(dir, () => { work.value = workOptions.value[0]?.value ?? '' })
const freeTitle = ref('')
const hours = ref('')

function add() {
  const free = dir.value === 'free'
  const w = free ? undefined : findWork(props.plan.type, work.value)
  const title = free ? freeTitle.value.trim() : w?.title ?? ''
  if (!title) {
    notify('Укажите название задачи')
    return
  }
  emit('addRow', {
    id: newId('row'),
    label: w ? `${w.code} · ${w.dir}` : '— Не привязано —',
    title,
    role: w ? w.role : 'seo',
    hours: parseFloat(hours.value) || (w ? w.hours : 0)
  })
  freeTitle.value = ''
  hours.value = ''
  notify('Задача добавлена в план')
}
</script>

<template>
  <details :open="plan.open" class="bg-white rounded-2xl shadow-card overflow-hidden group" :class="plan.ring && 'ring-2 ring-accent/20'">
    <summary class="px-4 lg:px-6 py-4 flex items-center justify-between cursor-pointer list-none hover:bg-zinc-50/50 transition gap-3">
      <div class="flex items-center gap-3 lg:gap-4 min-w-0">
        <svg class="w-3 h-3 text-zinc-500 transition-transform group-open:rotate-90 shrink-0" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
        <span class="min-w-0 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
          <span class="text-sm font-medium truncate">{{ plan.name }}</span>
          <span class="self-start sm:self-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200/70 whitespace-nowrap shrink-0">Тип: {{ typeName }}<template v-if="plan.month"> · <span class="text-zinc-900 tabular-nums">Месяц {{ plan.month }}</span></template></span>
        </span>
      </div>
      <div class="text-xs text-zinc-500 tabular-nums shrink-0">{{ count(plan.rows.length, TASKS) }} · {{ hoursText(total) }} ч</div>
    </summary>

    <div v-if="plan.actions" class="px-4 lg:px-6 py-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-zinc-600">{{ plan.desc }}</p>
      <div class="flex items-center gap-3 text-xs shrink-0">
        <TemplatesAct :allowed="can('templates.manage')" :tip="TIP_MANAGE" class="text-zinc-500 hover:text-zinc-900 transition" @click="emit('duplicate')">Дублировать</TemplatesAct>
        <TemplatesAct :allowed="can('templates.manage')" :tip="TIP_MANAGE" class="text-zinc-500 hover:text-zinc-900 transition" @click="emit('edit')">Редактировать</TemplatesAct>
        <span class="text-zinc-300">·</span>
        <TemplatesAct :allowed="can('templates.manage')" :tip="TIP_DELETE" class="text-zinc-500 hover:text-red-600 transition" @click="remove">Удалить</TemplatesAct>
      </div>
    </div>
    <div v-else class="px-4 lg:px-6 py-3 border-t border-zinc-100">
      <p class="text-sm text-zinc-600">{{ plan.desc }}</p>
    </div>

    <ul class="border-t border-zinc-100 divide-y divide-zinc-50">
      <li v-for="r in plan.rows" :key="r.id" class="px-4 lg:px-6 py-2.5 flex items-center justify-between gap-3 text-sm">
        <div class="flex items-center gap-3 min-w-0">
          <span class="hidden sm:inline text-xs text-zinc-500 w-32 shrink-0">{{ r.label }}</span>
          <span class="truncate">{{ r.title }}</span>
          <TemplatesRoleTag :role="r.role" small />
        </div>
        <div class="flex items-center gap-3 shrink-0">
          <span class="text-xs text-zinc-500 tabular-nums">{{ rowHours(r.hours) }} ч</span>
          <TemplatesAct :allowed="can('templates.manage')" :tip="TIP_DELETE" class="text-xs text-zinc-500 hover:text-red-600 transition" @click="removeRow(r.id)">Удалить</TemplatesAct>
        </div>
      </li>
      <li v-if="plan.quickAdd" class="px-4 lg:px-6 py-4 bg-zinc-50/50">
        <div class="text-xs text-zinc-500 mb-3">Добавить задачу</div>
        <div class="flex flex-col lg:flex-row items-stretch gap-2">
          <USelect v-model="dir" :options="dirOptions" aria-label="Направление" class="lg:w-48" />
          <USelect v-if="dir !== 'free'" v-model="work" :options="workOptions" aria-label="Работа" class="flex-1" />
          <UInput v-else v-model="freeTitle" placeholder="Название свободной задачи" class="flex-1" @keydown.enter.prevent="add" />
          <UInput v-model="hours" type="number" step="0.25" min="0" placeholder="ч" aria-label="Часы" class="lg:w-20" input-class="tabular-nums" />
          <AccessGate :allowed="can('templates.manage')" :tip="TIP_MANAGE">
            <UButton :disabled="!can('templates.manage')" class="shrink-0" @click="add">+ Задача</UButton>
          </AccessGate>
        </div>
      </li>
    </ul>
  </details>
</template>
