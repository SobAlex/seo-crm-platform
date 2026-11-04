<script setup lang="ts">
// Вкладка «Типы проектов»: список типов с маркером, числом карт и планов; создать, редактировать, удалить.
import { CONFIRM_TEMPLATE, TIP_DELETE, count, TIP_MANAGE, type ProjectType } from '~/types/templates'

const props = defineProps<{
  types: ProjectType[]
  /** Число карт и месячных планов по id типа. */
  counts: Record<string, { maps: number; plans: number }>
}>()
const emit = defineEmits<{
  create: []
  edit: [type: ProjectType]
  remove: [id: string]
}>()

const { can } = useRole()
const { confirm } = useConfirm()

function meta(id: string) {
  const c = props.counts[id] ?? { maps: 0, plans: 0 }
  return `${count(c.maps, ['карта', 'карты', 'карт'])} · ${count(c.plans, ['месячный план', 'месячных плана', 'месячных планов'])}`
}

async function remove(t: ProjectType) {
  if (await confirm(CONFIRM_TEMPLATE)) emit('remove', t.id)
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div class="bg-white rounded-2xl shadow-card overflow-hidden">
      <p v-if="!types.length" class="px-4 lg:px-6 py-8 text-sm text-zinc-500">Нет созданных типов проектов</p>
      <ul v-else class="divide-y divide-zinc-100">
        <li v-for="t in types" :key="t.id" class="px-4 lg:px-6 py-4 flex items-center justify-between gap-3">
          <div class="flex items-center gap-3 lg:gap-4 min-w-0">
            <TemplatesTypeDot :color="t.color" class="w-2.5 h-2.5" />
            <div class="min-w-0">
              <div class="text-sm font-medium truncate">{{ t.name }}</div>
              <div class="text-xs text-zinc-500 mt-0.5">{{ meta(t.id) }}</div>
            </div>
          </div>
          <div class="flex items-center gap-3 text-xs shrink-0">
            <TemplatesAct :allowed="can('templates.manage')" :tip="TIP_MANAGE" class="text-zinc-500 hover:text-zinc-900 transition" @click="emit('edit', t)">Редактировать</TemplatesAct>
            <span class="text-zinc-300">·</span>
            <TemplatesAct :allowed="can('templates.manage')" :tip="TIP_DELETE" class="text-zinc-500 hover:text-red-600 transition" @click="remove(t)">Удалить</TemplatesAct>
          </div>
        </li>
      </ul>
    </div>

    <TemplatesAct :allowed="can('templates.manage')" :tip="TIP_MANAGE" block class="w-full px-4 py-3 rounded-2xl border border-dashed border-zinc-300 text-sm text-zinc-500 hover:text-zinc-900 hover:border-zinc-400 transition" @click="emit('create')">+ Создать тип проекта</TemplatesAct>
  </div>
</template>
