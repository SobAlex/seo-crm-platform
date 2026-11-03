<script setup lang="ts">
// Аккордеон дорожной карты: направления → работы, кнопки «Процесс», «+ Добавить работу», «+ Добавить направление».
import { CONFIRM_TEMPLATE, CONFIRM_WORK, DIRECTIONS, TIP_DELETE, TIP_MANAGE, WORKS, count, type Roadmap, type RoadmapDirection, type TypeColor } from '~/types/templates'

const props = defineProps<{
  roadmap: Roadmap
  /** Цвет маркера типа проекта и подпись бейджа. */
  color: TypeColor
  label: string
}>()

const BADGE: Record<TypeColor, string> = {
  violet: 'bg-violet-50 text-violet-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  blue: 'bg-blue-50 text-blue-700',
  amber: 'bg-amber-50 text-amber-700',
  cyan: 'bg-cyan-50 text-cyan-700',
  rose: 'bg-rose-50 text-rose-700'
}
const emit = defineEmits<{
  duplicate: []
  edit: []
  remove: []
  removeDirection: [dirId: string]
  removeWork: [dirId: string, workId: string]
  addWork: [dir: RoadmapDirection]
  addDirection: []
  workflow: [name: string]
}>()

const { can } = useRole()
const { confirm } = useConfirm()

const works = computed(() => props.roadmap.directions.reduce((n, d) => n + d.works.length, 0))

async function remove() {
  if (await confirm(CONFIRM_TEMPLATE)) emit('remove')
}
async function removeDirection(d: RoadmapDirection) {
  if (await confirm(CONFIRM_TEMPLATE)) emit('removeDirection', d.id)
}
async function removeWork(d: RoadmapDirection, workId: string) {
  if (await confirm(CONFIRM_WORK)) emit('removeWork', d.id, workId)
}
</script>

<template>
  <details :open="roadmap.open" class="bg-white rounded-2xl shadow-card overflow-hidden group" :class="roadmap.ring && 'ring-2 ring-accent/20'">
    <summary class="px-4 lg:px-6 py-4 flex items-center justify-between cursor-pointer list-none hover:bg-zinc-50/50 transition gap-3">
      <div class="flex items-center gap-3 lg:gap-4 min-w-0">
        <svg class="w-3 h-3 text-zinc-500 transition-transform group-open:rotate-90 shrink-0" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg>
        <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
          <span class="text-sm font-medium truncate">{{ roadmap.name }}</span>
          <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium w-fit shrink-0" :class="BADGE[color]">
            <TemplatesTypeDot :color="color" class="w-1.5 h-1.5" />{{ label }}
          </span>
        </div>
      </div>
      <div class="text-xs text-zinc-500 tabular-nums shrink-0">{{ count(roadmap.directions.length, DIRECTIONS) }} · {{ count(works, WORKS) }}</div>
    </summary>

    <div class="px-4 lg:px-6 py-3 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
      <p class="text-sm text-zinc-600">{{ roadmap.desc }}</p>
      <div class="flex items-center gap-3 text-xs shrink-0">
        <TemplatesAct :allowed="can('templates.manage')" :tip="TIP_MANAGE" class="text-zinc-500 hover:text-zinc-900 transition" @click="emit('duplicate')">Дублировать</TemplatesAct>
        <TemplatesAct :allowed="can('templates.manage')" :tip="TIP_MANAGE" class="text-zinc-500 hover:text-zinc-900 transition" @click="emit('edit')">Редактировать</TemplatesAct>
        <span class="text-zinc-300">·</span>
        <TemplatesAct :allowed="can('templates.manage')" :tip="TIP_DELETE" class="text-zinc-500 hover:text-red-600 transition" @click="remove">Удалить</TemplatesAct>
      </div>
    </div>

    <div class="px-4 lg:px-6 pb-4 space-y-3 border-t border-zinc-100 pt-4">
      <div v-for="(d, i) in roadmap.directions" :key="d.id" class="rounded-xl border border-black/5 overflow-hidden">
        <div class="px-3 lg:px-4 py-2.5 bg-zinc-50 flex items-center justify-between">
          <span class="text-sm font-medium">{{ d.name }}</span>
          <div class="flex items-center gap-3 text-xs">
            <TemplatesAct :allowed="can('workflows.manage')" :tip="TIP_MANAGE" class="text-zinc-500 hover:text-zinc-900 transition" @click="emit('workflow', d.name)">Процесс</TemplatesAct>
            <span class="text-zinc-500 tabular-nums">{{ count(d.works.length, WORKS) }}</span>
            <TemplatesAct :allowed="can('templates.manage')" :tip="TIP_DELETE" class="text-zinc-500 hover:text-red-600 transition" @click="removeDirection(d)">Удалить</TemplatesAct>
          </div>
        </div>
        <ul class="text-sm">
          <li v-for="(w, j) in d.works" :key="w.id" class="grid grid-cols-12 gap-4 items-center px-4 py-3 hover:bg-zinc-50/60 transition border-b border-zinc-100 last:border-b-0 text-sm">
            <div class="col-span-7 lg:col-span-8 min-w-0 font-normal text-zinc-900 truncate"><span v-if="roadmap.codes" class="text-xs text-zinc-500 tabular-nums mr-2">{{ i + 1 }}.{{ j + 1 }}</span>{{ w.title }}</div>
            <div class="col-span-3 lg:col-span-2 flex items-center justify-start"><TemplatesRoleTag :role="w.role" /></div>
            <div class="col-span-2 flex items-center justify-end text-xs text-zinc-400">
              <TemplatesAct :allowed="can('templates.manage')" :tip="TIP_DELETE" class="hover:text-red-600 transition" @click="removeWork(d, w.id)">Удалить</TemplatesAct>
            </div>
          </li>
          <li class="px-3 lg:px-4 py-2 bg-zinc-50/50">
            <TemplatesAct :allowed="can('templates.manage')" :tip="TIP_MANAGE" block class="w-full px-3 py-1.5 rounded-full bg-white border border-zinc-200 text-xs font-medium hover:bg-zinc-50 transition" @click="emit('addWork', d)">+ Добавить работу</TemplatesAct>
          </li>
        </ul>
      </div>

      <TemplatesAct :allowed="can('templates.manage')" :tip="TIP_MANAGE" block class="w-full px-4 py-2.5 rounded-xl border border-dashed border-zinc-300 text-sm text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 transition" @click="emit('addDirection')">+ Добавить направление</TemplatesAct>
    </div>
  </details>
</template>
