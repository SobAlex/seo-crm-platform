<script setup lang="ts">
// Окно «Бизнес-процесс · направление» (#workflow-modal): статусы направления по порядку, минимум два.
import { CONFIRM_ITEM, TIP_MANAGE, count, newId } from '~/types/templates'

const props = defineProps<{ modelValue: boolean; name: string; statuses: string[] }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  saved: [statuses: string[]]
}>()

const { can } = useRole()
const { confirm } = useConfirm()
const notify = useNotify()

const rows = ref<{ id: string; label: string }[]>([])
const fresh = ref('')

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
watch(open, v => {
  if (!v) return
  rows.value = props.statuses.map((label, i) => ({ id: `st-${i}`, label }))
  fresh.value = ''
})

function move(i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= rows.value.length) return
  const list = rows.value
  ;[list[i], list[j]] = [list[j]!, list[i]!]
}
async function remove(id: string) {
  if (await confirm(CONFIRM_ITEM)) rows.value = rows.value.filter(r => r.id !== id)
}
function add() {
  const label = fresh.value.trim()
  if (!label) return
  rows.value.push({ id: newId('st'), label })
  fresh.value = ''
}

function submit() {
  const statuses = rows.value.map(r => r.label)
  if (statuses.length < 2) {
    notify('В процессе нужно минимум два статуса')
    return
  }
  emit('saved', statuses)
  open.value = false
  notify(`Бизнес-процесс «${props.name}» сохранён · ${count(statuses.length, ['статус', 'статуса', 'статусов'])}`)
}
</script>

<template>
  <UiSheet
    v-model="open"
    :title="`Бизнес-процесс · ${name}`"
    :submit-allowed="can('workflows.manage')"
    :submit-tip="TIP_MANAGE"
    manual
    @submit="submit"
  >
    <p class="text-xs text-zinc-500">Статусы — шаги процесса. На общей доске задач они становятся колонками. Сотрудник колонки не меняет, он двигает задачи.</p>
    <ul class="rounded-xl border border-zinc-200 divide-y divide-zinc-100">
      <li v-for="(r, i) in rows" :key="r.id" class="flex items-center gap-2 px-3 py-2">
        <span class="text-sm flex-1 min-w-0 truncate">{{ r.label }}</span>
        <button type="button" class="text-xs text-zinc-500 hover:text-zinc-900 transition" @click="move(i, -1)">Вверх</button>
        <button type="button" class="text-xs text-zinc-500 hover:text-zinc-900 transition" @click="move(i, 1)">Вниз</button>
        <TemplatesAct :allowed="can('workflows.manage')" :tip="TIP_MANAGE" class="text-xs text-zinc-500 hover:text-red-600 transition" @click="remove(r.id)">Удалить</TemplatesAct>
      </li>
    </ul>
    <div class="flex gap-2">
      <UInput v-model="fresh" placeholder="Новый статус" aria-label="Новый статус" class="flex-1 min-w-0" @keydown.enter.prevent="add" />
      <UButton color="white" class="shrink-0" @click="add">Добавить</UButton>
    </div>
  </UiSheet>
</template>
