<script setup lang="ts">
// templates.html → Сетка 1 (Registry): библиотека шаблонов — типы проектов, дорожные карты, месячные планы, бизнес-процессы, бриф.
import {
  TIP_MANAGE,
  TYPE_LABEL,
  TYPE_MONTHS,
  WORKFLOW_DEFAULT,
  initialPlans,
  initialRoadmaps,
  initialTypes,
  initialWorkflows,
  itemsToRows,
  newId,
  planToItems,
  type MonthPlan,
  type PlanDraft,
  type ProjectType,
  type Roadmap,
  type RoadmapDirection,
  type TypeColor
} from '~/types/templates'

definePageMeta({ roles: ['owner', 'seo_head', 'mgr_head'] })
useHead({ title: 'Шаблоны — SEO Control' })

const { can } = useRole()
const notify = useNotify()

const tab = ref('types')
const TABS = [
  { value: 'types', label: 'Типы проектов' },
  { value: 'roadmap', label: 'Дорожные карты' },
  { value: 'month', label: 'Месячные планы' },
  { value: 'workflows', label: 'Бизнес-процессы' },
  { value: 'brief', label: 'Бриф' }
]

const types = ref<ProjectType[]>(initialTypes())
const roadmaps = ref<Roadmap[]>(initialRoadmaps(types.value))
const plans = ref<MonthPlan[]>(initialPlans())
const workflows = ref<Record<string, string[]>>(initialWorkflows())
const flash = ref('')

const typeOptions = computed(() => types.value.map(t => ({ value: t.id, label: t.name })))
const typeOf = (id: string) => types.value.find(t => t.id === id)
const typeName = (id: string) => typeOf(id)?.name ?? ''
const counts = computed(() => Object.fromEntries(types.value.map(t => [t.id, {
  maps: roadmaps.value.filter(r => r.type === t.id).length,
  plans: plans.value.filter(p => p.type === t.id).length
}])))
// ---------- Типы проектов ----------
const typeOpen = ref(false)
const typeEditOpen = ref(false)
const editType = ref<ProjectType | null>(null)
function onTypeCreated(t: { name: string; desc: string; color: TypeColor }) {
  types.value.push({ id: newId('type'), ...t })
}
function openTypeEdit(t: ProjectType) {
  editType.value = t
  typeEditOpen.value = true
}
function onTypeSaved(t: ProjectType) {
  const i = types.value.findIndex(x => x.id === t.id)
  if (i !== -1) types.value[i] = t
}
function removeType(id: string) {
  types.value = types.value.filter(t => t.id !== id)
}

// ---------- Дорожные карты ----------
const roadmapOpen = ref(false)
const roadmapEditOpen = ref(false)
const directionOpen = ref(false)
const workOpen = ref(false)
const target = ref<{ roadmap: Roadmap; dirId?: string } | null>(null)

function duplicateRoadmap(rm: Roadmap) {
  const copy: Roadmap = {
    ...rm,
    id: newId('rm'),
    name: `${rm.name} (копия)`,
    open: true,
    ring: true,
    directions: rm.directions.map(d => ({ ...d, id: newId('dir'), works: d.works.map(w => ({ ...w, id: newId('work') })) }))
  }
  roadmaps.value.splice(roadmaps.value.indexOf(rm) + 1, 0, copy)
  notify(`Создана копия: ${copy.name}`)
}
function openRoadmapEdit(rm: Roadmap) {
  target.value = { roadmap: rm }
  roadmapEditOpen.value = true
}
function onRoadmapSaved(patch: { type: string; name: string; desc: string }) {
  if (target.value) Object.assign(target.value.roadmap, patch)
}
function removeRoadmap(rm: Roadmap) {
  roadmaps.value = roadmaps.value.filter(r => r.id !== rm.id)
}
function removeDirection(rm: Roadmap, dirId: string) {
  rm.directions = rm.directions.filter(d => d.id !== dirId)
}
function removeWork(rm: Roadmap, dirId: string, workId: string) {
  const d = rm.directions.find(x => x.id === dirId)
  if (d) d.works = d.works.filter(w => w.id !== workId)
}
function openDirection(rm: Roadmap) {
  target.value = { roadmap: rm }
  directionOpen.value = true
}
function onDirectionAdded(name: string) {
  target.value?.roadmap.directions.push({ id: newId('dir'), name, works: [] })
}
function openWork(rm: Roadmap, dir: RoadmapDirection) {
  target.value = { roadmap: rm, dirId: dir.id }
  workOpen.value = true
}
function onWorkAdded(dirId: string, title: string) {
  target.value?.roadmap.directions.find(d => d.id === dirId)?.works.push({ id: newId('work'), title, role: 'seo', hours: 0 })
}
function onRoadmapCreated(rm: { type: string; name: string; desc: string; directions: RoadmapDirection[] }) {
  roadmaps.value.unshift({ id: newId('rm'), ...rm, open: true, ring: true, codes: true })
}

// ---------- Бизнес-процессы ----------
const workflowOpen = ref(false)
const workflowName = ref('Семантика')
function openWorkflow(name: string) {
  workflowName.value = name
  workflowOpen.value = true
}
function onWorkflowSaved(statuses: string[]) {
  workflows.value[workflowName.value] = statuses
  flash.value = workflowName.value
}

// ---------- Месячные планы ----------
const monthType = ref('ecommerce')
const monthOptions = computed(() => typeOptions.value)
const monthPlans = computed(() => plans.value.filter(p => p.type === monthType.value))
const planLink = computed(() => `Тип проекта: ${typeName(monthType.value) || 'Интернет-магазин'} · Карта: ${TYPE_MONTHS[monthType.value] ?? '6 месяцев'}`)

const monthOpen = ref(false)
const monthEditOpen = ref(false)
const editPlan = ref<{ id: string; draft: PlanDraft } | null>(null)

function duplicatePlan(p: MonthPlan) {
  const copy: MonthPlan = { ...p, id: newId('plan'), name: `${p.name} (копия)`, open: true, ring: true, rows: p.rows.map(r => ({ ...r, id: newId('row') })) }
  plans.value.splice(plans.value.indexOf(p) + 1, 0, copy)
  notify(`Создана копия: ${copy.name}`)
}
function openPlanEdit(p: MonthPlan) {
  editPlan.value = { id: p.id, draft: { type: p.type, name: p.name, desc: p.desc, items: planToItems(p) } }
  monthEditOpen.value = true
}
function onPlanSaved(d: PlanDraft) {
  const p = plans.value.find(x => x.id === editPlan.value?.id)
  if (!p) return
  Object.assign(p, { type: d.type, name: d.name, desc: d.desc, rows: itemsToRows(d.items, newId('row')) })
}
function onPlanCreated(d: PlanDraft) {
  plans.value.unshift({
    id: newId('plan'), type: d.type, name: d.name, desc: d.desc || 'Новый месячный план',
    open: true, actions: true, quickAdd: false, rows: itemsToRows(d.items, newId('row'))
  })
  monthType.value = d.type
}
function removePlan(p: MonthPlan) {
  plans.value = plans.value.filter(x => x.id !== p.id)
}
function removeRow(p: MonthPlan, rowId: string) {
  p.rows = p.rows.filter(r => r.id !== rowId)
}
</script>

<template>
  <PageRegistry title="Шаблоны">
    <template #focus>
      <UiSegmented v-model="tab" :options="TABS" :hash="true" aria-label="Библиотека шаблонов" />
    </template>

    <!-- ============ ТИПЫ ПРОЕКТОВ ============ -->
    <div v-show="tab === 'types'">
      <TemplatesTypesPanel :types="types" :counts="counts" @create="typeOpen = true" @edit="openTypeEdit" @remove="removeType" />
    </div>

    <!-- ============ ДОРОЖНЫЕ КАРТЫ ============ -->
    <div v-show="tab === 'roadmap'">
      <div class="flex flex-col gap-4">
        <TemplatesRoadmapCard
          v-for="rm in roadmaps"
          :key="rm.id"
          :roadmap="rm"
          :color="typeOf(rm.type)?.color ?? 'violet'"
          :label="TYPE_LABEL[rm.type] ?? typeName(rm.type)"
          @duplicate="duplicateRoadmap(rm)"
          @edit="openRoadmapEdit(rm)"
          @remove="removeRoadmap(rm)"
          @remove-direction="removeDirection(rm, $event)"
          @remove-work="(dirId, workId) => removeWork(rm, dirId, workId)"
          @add-work="openWork(rm, $event)"
          @add-direction="openDirection(rm)"
          @workflow="openWorkflow"
        />
        <TemplatesAct :allowed="can('templates.manage')" :tip="TIP_MANAGE" block class="w-full px-4 py-3 rounded-2xl border border-dashed border-zinc-300 text-sm text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 transition" @click="roadmapOpen = true">+ Создать дорожную карту</TemplatesAct>
      </div>
    </div>

    <!-- ============ МЕСЯЧНЫЕ ПЛАНЫ ============ -->
    <div v-show="tab === 'month'">
      <div class="mb-6">
        <div class="text-xs font-medium text-zinc-500 mb-3">Тип проекта</div>
        <div class="overflow-x-auto">
          <UiSegmented v-model="monthType" :options="monthOptions" size="md" aria-label="Тип проекта" />
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 text-xs font-medium text-zinc-600">{{ planLink }}</span>
          <span class="text-xs text-zinc-500">План собирается из работ карты. У задачи указан участник, который её выполняет.</span>
        </div>
      </div>

      <div class="flex flex-col gap-4">
        <TemplatesMonthPlanCard
          v-for="p in monthPlans"
          :key="p.id"
          :plan="p"
          :type-name="typeName(p.type)"
          @duplicate="duplicatePlan(p)"
          @edit="openPlanEdit(p)"
          @remove="removePlan(p)"
          @remove-row="removeRow(p, $event)"
          @add-row="p.rows.push($event)"
        />
      </div>
      <TemplatesAct :allowed="can('templates.manage')" :tip="TIP_MANAGE" block class="w-full mt-4 px-4 py-3 rounded-2xl border border-dashed border-zinc-300 text-sm text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 transition" @click="monthOpen = true">+ Создать месячный план</TemplatesAct>
    </div>

    <!-- ============ БИЗНЕС-ПРОЦЕССЫ ============ -->
    <div v-show="tab === 'workflows'">
      <TemplatesWorkflowsPanel :workflows="workflows" :flash="flash" @configure="openWorkflow" />
    </div>

    <!-- ============ БРИФ ============ -->
    <div v-show="tab === 'brief'">
      <TemplatesBriefPanel />
    </div>

    <TemplatesTypeModal v-model="typeOpen" @created="onTypeCreated" />
    <TemplatesTypeEditModal v-model="typeEditOpen" :type="editType" @saved="onTypeSaved" />
    <TemplatesRoadmapModal v-model="roadmapOpen" :type-options="typeOptions" @created="onRoadmapCreated" />
    <TemplatesRoadmapEditModal v-model="roadmapEditOpen" :roadmap="target?.roadmap ?? null" :type-options="typeOptions" @saved="onRoadmapSaved" />
    <TemplatesDirectionModal v-model="directionOpen" :roadmap-name="target?.roadmap.name ?? ''" @added="onDirectionAdded" />
    <TemplatesWorkModal
      v-model="workOpen"
      :roadmap-name="target?.roadmap.name ?? ''"
      :directions="target?.roadmap.directions ?? []"
      :direction-id="target?.dirId"
      @added="onWorkAdded"
    />
    <TemplatesMonthModal v-model="monthOpen" :type-options="typeOptions" :type="monthType" @created="onPlanCreated" />
    <TemplatesMonthEditModal v-model="monthEditOpen" :type-options="typeOptions" :plan="editPlan?.draft ?? null" @saved="onPlanSaved" />
    <TemplatesWorkflowModal v-model="workflowOpen" :name="workflowName" :statuses="workflows[workflowName] ?? WORKFLOW_DEFAULT" @saved="onWorkflowSaved" />
  </PageRegistry>
</template>
