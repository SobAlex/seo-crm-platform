<script setup lang="ts">
// templates.html → Сетка 1 (Registry): библиотека шаблонов — типы проектов, дорожные карты, месячные планы, бизнес-процессы, бриф.
import {
  TIP_MANAGE,
  TYPE_LABEL,
  TYPE_MONTHS,
  WORKFLOW_DEFAULT,
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

const types = ref<ProjectType[]>([])
const roadmaps = ref<Roadmap[]>([])
const plans = ref<MonthPlan[]>([])
const monthType = ref('')
const libraryLoaded = ref(false)
const workflows = ref<Record<string, string[]>>(initialWorkflows())
const flash = ref('')

const typeOptions = computed(() => types.value.map(t => ({ value: t.id, label: t.name })))
const typeOf = (id: string) => types.value.find(t => t.id === id)
const typeName = (id: string) => typeOf(id)?.name ?? ''
const counts = computed(() => Object.fromEntries(types.value.map(t => [t.id, {
  maps: roadmaps.value.filter(r => r.type === t.id).length,
  plans: plans.value.filter(p => p.type === t.id).length
}])))

interface ApiType { id: string; name: string; description: string; color: TypeColor }
interface ApiWork { id: string; title: string; hours: number; role: string }
interface ApiRoadmap { id: string; type: string; name: string; directions: { id: string; name: string; works: ApiWork[] }[] }

function asRole(role: string): 'seo' | 'pm' | 'contractor' {
  return role === 'pm' || role === 'contractor' ? role : 'seo'
}
function mapRoadmap(row: ApiRoadmap, index: number): Roadmap {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    desc: '',
    open: index === 0,
    directions: row.directions.map(direction => ({
      id: direction.id,
      name: direction.name,
      works: direction.works.map(work => ({ id: work.id, title: work.title, role: asRole(work.role), hours: work.hours }))
    }))
  }
}

onMounted(async () => {
  try {
    const [typeRows, mapRows] = await Promise.all([
      $fetch<ApiType[]>('/api/templates/types', { credentials: 'include' }),
      $fetch<ApiRoadmap[]>('/api/templates/roadmaps', { credentials: 'include' })
    ])
    types.value = typeRows.map(row => ({ id: row.id, name: row.name, color: row.color, desc: row.description }))
    roadmaps.value = mapRows.map(mapRoadmap)
    if (!types.value.some(type => type.id === monthType.value)) monthType.value = types.value[0]?.id ?? ''
  } catch (error) {
    types.value = []
    roadmaps.value = []
    notify(apiErrorMessage(error), 'error')
  } finally {
    libraryLoaded.value = true
  }
})
// ---------- Типы проектов ----------
const typeOpen = ref(false)
const typeEditOpen = ref(false)
const editType = ref<ProjectType | null>(null)
async function onTypeCreated(t: { name: string; desc: string; color: TypeColor }) {
  try {
    const saved = await $fetch<ApiType>('/api/templates/types', {
      method: 'POST', credentials: 'include', body: { name: t.name, description: t.desc, color: t.color }
    })
    types.value.push({ id: saved.id, name: saved.name, color: saved.color || t.color, desc: saved.description })
    notify(`Тип проекта «${saved.name}» создан`, 'success')
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  }
}
function openTypeEdit(t: ProjectType) {
  editType.value = t
  typeEditOpen.value = true
}
async function onTypeSaved(t: ProjectType) {
  try {
    await $fetch(`/api/templates/types/${t.id}`, {
      method: 'PUT', credentials: 'include', body: { name: t.name, description: t.desc, color: t.color }
    })
    const i = types.value.findIndex(x => x.id === t.id)
    if (i !== -1) types.value[i] = t
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  }
}
async function removeType(id: string) {
  try {
    await $fetch(`/api/templates/types/${id}`, { method: 'DELETE', credentials: 'include' })
    types.value = types.value.filter(t => t.id !== id)
    roadmaps.value = roadmaps.value.filter(r => r.type !== id)
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  }
}

// ---------- Дорожные карты ----------
const roadmapOpen = ref(false)
const roadmapEditOpen = ref(false)
const directionOpen = ref(false)
const workOpen = ref(false)
const target = ref<{ roadmap: Roadmap; dirId?: string } | null>(null)

async function duplicateRoadmap(rm: Roadmap) {
  try {
    const copy = await $fetch<ApiRoadmap>(`/api/templates/roadmaps/${rm.id}/duplicate`, { method: 'POST', credentials: 'include' })
    const mapped = { ...mapRoadmap(copy, 0), open: true, ring: true }
    roadmaps.value.splice(roadmaps.value.indexOf(rm) + 1, 0, mapped)
    notify(`Создана копия: ${mapped.name}`, 'success')
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  }
}
function openRoadmapEdit(rm: Roadmap) {
  target.value = { roadmap: rm }
  roadmapEditOpen.value = true
}
async function onRoadmapSaved(patch: { type: string; name: string; desc: string }) {
  if (!target.value) return
  try {
    await $fetch(`/api/templates/roadmaps/${target.value.roadmap.id}`, {
      method: 'PUT', credentials: 'include', body: { projectTypeId: patch.type, name: patch.name }
    })
    Object.assign(target.value.roadmap, patch)
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  }
}
async function removeRoadmap(rm: Roadmap) {
  try {
    await $fetch(`/api/templates/roadmaps/${rm.id}`, { method: 'DELETE', credentials: 'include' })
    roadmaps.value = roadmaps.value.filter(r => r.id !== rm.id)
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  }
}
async function removeDirection(rm: Roadmap, dirId: string) {
  try {
    await $fetch(`/api/templates/stages/${dirId}`, { method: 'DELETE', credentials: 'include' })
    rm.directions = rm.directions.filter(d => d.id !== dirId)
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  }
}
async function removeWork(rm: Roadmap, dirId: string, workId: string) {
  try {
    await $fetch(`/api/templates/works/${workId}`, { method: 'DELETE', credentials: 'include' })
    const d = rm.directions.find(x => x.id === dirId)
    if (d) d.works = d.works.filter(w => w.id !== workId)
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  }
}
function openDirection(rm: Roadmap) {
  target.value = { roadmap: rm }
  directionOpen.value = true
}
async function onDirectionAdded(name: string) {
  const roadmap = target.value?.roadmap
  if (!roadmap || !name) return
  try {
    const saved = await $fetch<{ id: string; name: string }>(`/api/templates/roadmaps/${roadmap.id}/stages`, {
      method: 'POST', credentials: 'include', body: { title: name }
    })
    roadmap.directions.push({ id: saved.id, name: saved.name, works: [] })
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  }
}
function openWork(rm: Roadmap, dir: RoadmapDirection) {
  target.value = { roadmap: rm, dirId: dir.id }
  workOpen.value = true
}
async function onWorkAdded(dirId: string, work: { title: string; role: 'seo' | 'pm' | 'contractor'; hours: number }) {
  if (!work.title) return
  try {
    const saved = await $fetch<{ id: string; title: string; role: string; hours: number }>(`/api/templates/stages/${dirId}/works`, {
      method: 'POST', credentials: 'include', body: work
    })
    target.value?.roadmap.directions.find(d => d.id === dirId)?.works.push({
      id: saved.id, title: saved.title, role: asRole(saved.role), hours: saved.hours
    })
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  }
}
async function onRoadmapCreated(rm: { type: string; name: string; desc: string; directions: RoadmapDirection[] }) {
  try {
    const saved = await $fetch<{ id: string }>('/api/templates/roadmaps', {
      method: 'POST', credentials: 'include', body: { projectTypeId: rm.type, name: rm.name }
    })
    const directions: RoadmapDirection[] = []
    for (const direction of rm.directions) {
      const stage = await $fetch<{ id: string }>(`/api/templates/roadmaps/${saved.id}/stages`, {
        method: 'POST', credentials: 'include', body: { title: direction.name }
      })
      const works = []
      for (const work of direction.works) {
        const created = await $fetch<{ id: string; title: string; role: string; hours: number }>(`/api/templates/stages/${stage.id}/works`, {
          method: 'POST', credentials: 'include', body: { title: work.title, role: work.role, hours: work.hours }
        })
        works.push({ id: created.id, title: created.title, role: asRole(created.role), hours: created.hours })
      }
      directions.push({ id: stage.id, name: direction.name, works })
    }
    roadmaps.value.unshift({ id: saved.id, type: rm.type, name: rm.name, desc: rm.desc, open: true, ring: true, codes: true, directions })
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  }
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
const monthOptions = computed(() => typeOptions.value)
const monthPlans = computed(() => plans.value.filter(p => p.type === monthType.value))
const planLink = computed(() => `Тип проекта: ${typeName(monthType.value) || 'не выбран'} · Карта: ${TYPE_MONTHS[monthType.value] ?? '—'}`)

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
        <p v-if="libraryLoaded && !roadmaps.length" class="px-4 py-8 rounded-2xl bg-white shadow-card text-sm text-zinc-500">Нет дорожных карт</p>
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
        <p v-if="libraryLoaded && !monthPlans.length" class="px-4 py-8 rounded-2xl bg-white shadow-card text-sm text-zinc-500">Нет месячных планов</p>
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
