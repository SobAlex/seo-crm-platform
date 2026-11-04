<script setup lang="ts">
// Конструктор «Создать дорожную карту» (#roadmap-modal): направления N и работы N.M нумеруются автоматически.
import { CONFIRM_DIRECTION, CONFIRM_WORK, DIRECTIONS, ROLE_OPTIONS, TIP_DELETE, TIP_MANAGE, WORKS, count, hoursText, newId, type RoadmapDirection, type WorkRole } from '~/types/templates'

const props = defineProps<{
  modelValue: boolean
  typeOptions: { value: string; label: string }[]
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: [roadmap: { type: string; name: string; desc: string; directions: RoadmapDirection[] }]
}>()

const { can } = useRole()
const { confirm } = useConfirm()
const notify = useNotify()

interface DraftWork { id: string; title: string; role: WorkRole; hours: string }
interface DraftDir { id: string; name: string; works: DraftWork[] }

const type = ref('ecommerce')
const name = ref('')
const desc = ref('')
const dirs = ref<DraftDir[]>([])
const placeholder = ref('Например: Интернет-магазин · 6 месяцев')
const bad = ref<string | null>(null)
const list = ref<HTMLElement | null>(null)

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
watch(open, v => {
  if (!v) return
  type.value = props.typeOptions[0]?.value ?? 'ecommerce'
  name.value = ''
  desc.value = ''
  dirs.value = []
  bad.value = null
})
watch(type, t => {
  if (!name.value) placeholder.value = `${props.typeOptions.find(o => o.value === t)?.label ?? ''} · 6 месяцев`
})

const total = computed(() => {
  const works = dirs.value.reduce((n, d) => n + d.works.length, 0)
  const hours = dirs.value.reduce((s, d) => s + d.works.reduce((h, w) => h + (parseFloat(w.hours) || 0), 0), 0)
  return `${count(dirs.value.length, DIRECTIONS)} · ${count(works, WORKS)} · ${hoursText(hours)} ч`
})

function focusLast(selector: string) {
  nextTick(() => {
    const all = list.value?.querySelectorAll<HTMLInputElement>(selector)
    all?.[all.length - 1]?.focus()
  })
}
function addDir() {
  dirs.value.push({ id: newId('d'), name: '', works: [] })
  focusLast('input[data-rm-dir-name]')
}
function addWork(d: DraftDir) {
  d.works.push({ id: newId('w'), title: '', role: 'seo', hours: '' })
  nextTick(() => {
    const box = list.value?.querySelector(`[data-rm-dir="${d.id}"]`)
    const all = box?.querySelectorAll<HTMLInputElement>('input[data-rm-work]')
    all?.[all.length - 1]?.focus()
  })
}
function move(i: number, dir: -1 | 1) {
  const j = i + dir
  if (j < 0 || j >= dirs.value.length) return
  const l = dirs.value
  ;[l[i], l[j]] = [l[j]!, l[i]!]
}
async function removeDir(id: string) {
  if (await confirm(CONFIRM_DIRECTION)) dirs.value = dirs.value.filter(d => d.id !== id)
}
async function removeWork(d: DraftDir, id: string) {
  if (await confirm(CONFIRM_WORK)) d.works = d.works.filter(w => w.id !== id)
}

function submit() {
  const draft = dirs.value.map(d => ({
    id: newId('dir'),
    name: d.name.trim(),
    works: d.works.filter(w => w.title.trim()).map(w => ({ id: newId('work'), title: w.title.trim(), role: w.role, hours: parseFloat(w.hours) || 0 }))
  }))
  if (draft.length) {
    const i = draft.findIndex(d => !d.name || !d.works.length)
    if (i !== -1) {
      bad.value = dirs.value[i]!.id
      setTimeout(() => { bad.value = null }, 1600)
      notify(`У направления ${i + 1} нужно название и хотя бы одна работа`)
      return
    }
  }
  const raw = name.value.trim()
  if (!raw) {
    notify('Укажите название дорожной карты')
    return
  }
  const full = raw.startsWith('Дорожная карта') ? raw : `Дорожная карта · ${raw}`
  const works = draft.reduce((n, d) => n + d.works.length, 0)
  emit('created', { type: type.value, name: full, desc: desc.value.trim() || 'Направления и работы добавляются в эту карту.', directions: draft })
  open.value = false
  notify(draft.length ? `Дорожная карта «${full}» создана · ${count(works, WORKS)}` : `Дорожная карта «${full}» создана пустой`)
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="Создать дорожную карту"
    subtitle="Направления и работы нумеруются автоматически: 1.1, 1.2, 2.1…"
    size="lg"
    submit="Создать карту"
    :submit-allowed="can('templates.manage')"
    :submit-tip="TIP_MANAGE"
    manual
    @submit="submit"
  >
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UiField label="Тип проекта" req><USelect v-model="type" :options="typeOptions" required /></UiField>
      <UiField label="Название" req><UInput v-model="name" required :placeholder="placeholder" /></UiField>
    </div>
    <UiField label="Описание" opt="опционально"><UTextarea v-model="desc" :rows="2" resize placeholder="Для каких проектов эта карта" /></UiField>
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <span class="text-xs font-medium text-zinc-500">Направления и работы</span>
      <span class="text-xs text-zinc-500 tabular-nums whitespace-nowrap">{{ total }}</span>
    </div>
    <div ref="list" class="space-y-3">
      <div
        v-for="(d, i) in dirs"
        :key="d.id"
        :data-rm-dir="d.id"
        class="rounded-2xl border border-zinc-200 overflow-hidden transition"
        :class="bad === d.id && 'ring-4 ring-red-100 !border-red-300'"
      >
        <div class="px-3 py-2 bg-zinc-50 flex items-center gap-2">
          <span class="w-9 shrink-0 text-sm font-semibold tabular-nums">{{ i + 1 }}.</span>
          <UInput v-model="d.name" data-rm-dir-name size="xs" placeholder="Направление, например «Аудит»" aria-label="Название направления" class="flex-1 min-w-0" input-class="font-medium" />
          <button type="button" aria-label="Выше" :disabled="i === 0" class="w-7 h-7 shrink-0 rounded-full text-zinc-500 hover:bg-white transition disabled:opacity-30" @click="move(i, -1)">↑</button>
          <button type="button" aria-label="Ниже" :disabled="i === dirs.length - 1" class="w-7 h-7 shrink-0 rounded-full text-zinc-500 hover:bg-white transition disabled:opacity-30" @click="move(i, 1)">↓</button>
          <TemplatesAct :allowed="can('templates.manage')" :tip="TIP_DELETE" class="px-2 text-xs text-zinc-500 hover:text-red-600 transition" @click="removeDir(d.id)">Удалить</TemplatesAct>
        </div>
        <ul class="divide-y divide-zinc-100">
          <li v-for="(w, j) in d.works" :key="w.id" class="flex flex-wrap sm:flex-nowrap items-center gap-2 px-3 py-2">
            <span class="w-9 shrink-0 text-xs font-medium tabular-nums text-zinc-500">{{ i + 1 }}.{{ j + 1 }}</span>
            <UInput v-model="w.title" data-rm-work size="xs" placeholder="Название работы" aria-label="Название работы" class="flex-1 min-w-[10rem]" />
            <USelect v-model="w.role" :options="ROLE_OPTIONS" size="xs" aria-label="Исполнитель" class="w-40" />
            <UInput v-model="w.hours" type="number" min="0" step="0.5" size="xs" placeholder="ч" aria-label="Часы" class="w-16" input-class="tabular-nums" />
            <button type="button" aria-label="Удалить работу" class="w-7 h-7 shrink-0 rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-50 transition" @click="removeWork(d, w.id)">×</button>
          </li>
        </ul>
        <div class="px-3 py-2 border-t border-zinc-100">
          <button type="button" class="text-xs font-medium text-accent hover:underline" @click="addWork(d)">+ Добавить работу</button>
        </div>
      </div>
    </div>
    <button type="button" class="w-full px-4 py-2.5 rounded-2xl border border-dashed border-zinc-300 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition" @click="addDir">+ Добавить направление</button>
  </UiSheet>
</template>
