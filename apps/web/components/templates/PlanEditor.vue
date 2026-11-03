<script setup lang="ts">
// Редактор задач месячного плана ([data-plan-editor]): работы из дорожной карты типа и свободные задачи.
import { ROADMAP_WORKS, ROLE_OPTIONS, TASKS, count, findWork, hoursText, type PlanDraft, type WorkRole } from '~/types/templates'

const draft = defineModel<PlanDraft>('draft', { required: true })
const props = defineProps<{ typeOptions: { value: string; label: string }[] }>()

const notify = useNotify()
const panel = ref<'picker' | 'free' | null>(null)
const search = ref('')
const free = ref({ title: '', role: 'seo' as WorkRole, hours: '2' })
const searchBox = ref<{ input?: HTMLInputElement } | null>(null)
const freeBox = ref<{ input?: HTMLInputElement } | null>(null)

watch(() => draft.value, () => {
  panel.value = null
  search.value = ''
  free.value = { title: '', role: 'seo', hours: '2' }
  sortItems()
}, { immediate: true })

const typeName = computed(() => props.typeOptions.find(o => o.value === draft.value.type)?.label ?? '')
const total = computed(() => `${count(draft.value.items.length, TASKS)} · ${hoursText(draft.value.items.reduce((s, it) => s + (it.hours || 0), 0))} ч`)
const inPlan = computed(() => new Set(draft.value.items.filter(i => i.code).map(i => i.code!)))
const picked = computed(() => inPlan.value.size ? `В плане из карты: ${inPlan.value.size}` : 'Отметьте работы — они появятся в плане')

const tree = computed(() => {
  const q = search.value.trim().toLowerCase()
  return (ROADMAP_WORKS[draft.value.type] ?? []).map(([dir, works], d) => ({
    dir,
    num: d + 1,
    rows: works
      .map(([title, role], w) => ({ code: `${d + 1}.${w + 1}`, title, role }))
      .filter(r => !q || `${r.code} ${r.title} ${dir}`.toLowerCase().includes(q))
  })).filter(g => g.rows.length)
})

function sortItems() {
  draft.value.items.sort((a, b) => (a.code ? 0 : 1) - (b.code ? 0 : 1) || (a.code ?? '').localeCompare(b.code ?? '', 'ru', { numeric: true }))
}
function addByCode(code: string): boolean {
  if (inPlan.value.has(code)) return false
  const w = findWork(draft.value.type, code)
  if (!w) return false
  draft.value.items.push({ code: w.code, dir: w.dir, title: w.title, role: w.role, hours: w.hours })
  return true
}
function toggleCode(code: string, on: boolean) {
  if (on) addByCode(code)
  else draft.value.items = draft.value.items.filter(i => i.code !== code)
  sortItems()
}
function pickAll(num: number) {
  const g = tree.value.find(x => x.num === num)
  let added = 0
  g?.rows.forEach(r => { if (addByCode(r.code)) added++ })
  sortItems()
  if (added) notify(`В план добавлено: ${count(added, ['работа', 'работы', 'работ'])}`)
}
function removeAt(i: number) {
  draft.value.items.splice(i, 1)
}
function setHours(i: number, v: string | number) {
  draft.value.items[i]!.hours = parseFloat(String(v)) || 0
}

function toggle(which: 'picker' | 'free') {
  panel.value = panel.value === which ? null : which
  if (panel.value === 'picker') search.value = ''
  nextTick(() => (panel.value === 'picker' ? searchBox : freeBox).value?.input?.focus())
}
function addFree() {
  const title = free.value.title.trim()
  if (!title) {
    freeBox.value?.input?.focus()
    notify('Укажите название задачи')
    return
  }
  draft.value.items.push({ title, role: free.value.role, hours: parseFloat(free.value.hours) || 0 })
  free.value.title = ''
}

function onType(v: string) {
  const dropped = draft.value.items.filter(i => i.code).length
  draft.value.type = v
  draft.value.items = draft.value.items.filter(i => !i.code)
  if (dropped) notify('Другая дорожная карта: работы прежней карты убраны из плана')
}
</script>

<template>
  <div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
      <UiField label="Тип проекта" req><USelect :model-value="draft.type" :options="typeOptions" required @update:model-value="onType" /></UiField>
      <UiField label="Название" req><UInput v-model="draft.name" required placeholder="Например: Месяц 1 · Старт и аудит" /></UiField>
    </div>
    <UiField label="Описание" opt="опционально" class="mb-5"><UTextarea v-model="draft.desc" :rows="2" resize placeholder="Короткое описание" /></UiField>

    <div class="flex items-baseline justify-between gap-3 mb-2">
      <span class="text-xs font-medium text-zinc-500">Задачи плана</span>
      <span class="text-xs text-zinc-500 tabular-nums">{{ total }}</span>
    </div>
    <ul v-if="draft.items.length" class="rounded-xl border border-zinc-200 divide-y divide-zinc-100">
      <li v-for="(it, i) in draft.items" :key="(it.code ?? 'free') + i + it.title" class="px-3 py-2.5 flex items-center gap-3 text-sm">
        <span v-if="it.code" class="w-9 shrink-0 text-xs font-medium tabular-nums text-zinc-500">{{ it.code }}</span>
        <span v-else class="w-9 shrink-0 text-[10px] font-medium text-zinc-400">своб.</span>
        <div class="flex-1 min-w-0">
          <div class="truncate">{{ it.title }}</div>
          <div class="text-xs text-zinc-500 truncate">{{ it.code ? it.dir : 'Не привязана к карте' }}</div>
        </div>
        <span class="hidden sm:inline-flex"><TemplatesRoleTag :role="it.role" /></span>
        <label class="flex items-center gap-1 shrink-0">
          <UInput :model-value="it.hours" type="number" step="0.5" min="0" size="2xs" aria-label="Часы" class="w-16" input-class="tabular-nums text-right" @update:model-value="setHours(i, $event)" />
          <span class="text-xs text-zinc-500">ч</span>
        </label>
        <button type="button" aria-label="Убрать из плана" class="w-7 h-7 rounded-full text-zinc-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center shrink-0 transition" @click="removeAt(i)">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </li>
    </ul>
    <div v-else class="rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center text-sm text-zinc-500">Пока пусто. Добавьте работы из дорожной карты или свободную задачу.</div>

    <div class="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
      <UButton color="white" block @click="toggle('picker')">+ Из дорожной карты</UButton>
      <UButton color="white" block @click="toggle('free')">+ Свободная задача</UButton>
    </div>

    <div v-if="panel === 'picker'" class="mt-3 rounded-xl border border-zinc-200 overflow-hidden">
      <div class="p-2 border-b border-zinc-100 bg-zinc-50 flex items-center gap-2">
        <UInput ref="searchBox" v-model="search" type="search" size="xs" placeholder="Найти работу или номер, например 2.1" aria-label="Поиск работы" class="flex-1 min-w-0" />
        <span class="hidden sm:inline text-xs text-zinc-500 whitespace-nowrap">Карта · {{ typeName }}</span>
      </div>
      <div class="max-h-72 overflow-y-auto divide-y divide-zinc-100">
        <div v-for="g in tree" :key="g.num" class="border-t border-zinc-100 first:border-t-0">
          <div class="px-3 py-2.5 bg-zinc-100 flex items-center justify-between sticky top-0">
            <span class="text-xs font-semibold text-zinc-800">{{ g.dir }}</span>
            <button type="button" class="text-[11px] text-zinc-500 hover:text-zinc-900 transition" @click="pickAll(g.num)">Выбрать все</button>
          </div>
          <label v-for="r in g.rows" :key="r.code" class="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-zinc-50" :class="inPlan.has(r.code) && 'bg-accent/5'">
            <input type="checkbox" :checked="inPlan.has(r.code)" class="w-4 h-4 rounded border-zinc-300 accent-accent" @change="toggleCode(r.code, ($event.target as HTMLInputElement).checked)">
            <span class="w-8 shrink-0 text-xs font-medium tabular-nums text-zinc-500">{{ r.code }}</span>
            <span class="flex-1 min-w-0 truncate">{{ r.title }}</span>
            <span v-if="inPlan.has(r.code)" class="text-[11px] shrink-0 text-accent">в плане</span>
            <TemplatesRoleTag v-else :role="r.role" />
          </label>
        </div>
        <div v-if="!tree.length" class="px-3 py-6 text-center text-sm text-zinc-500">Ничего не найдено. Можно добавить свободную задачу.</div>
      </div>
      <div class="px-3 py-2 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between gap-2">
        <span class="text-xs text-zinc-500 tabular-nums">{{ picked }}</span>
        <div class="flex items-center gap-2">
          <button type="button" class="px-3 py-1.5 rounded-full text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-black/5 transition" @click="panel = null">Отмена</button>
          <button type="button" class="px-3.5 py-1.5 rounded-full bg-accent text-white text-xs font-medium hover:bg-accent-hover transition" @click="panel = null">Готово</button>
        </div>
      </div>
    </div>

    <div v-if="panel === 'free'" class="mt-3 rounded-xl border border-zinc-200 p-3 space-y-2">
      <UInput ref="freeBox" v-model="free.title" placeholder="Название свободной задачи" aria-label="Название свободной задачи" @keydown.enter.prevent="addFree" />
      <div class="flex flex-col sm:flex-row gap-2">
        <USelect v-model="free.role" :options="ROLE_OPTIONS" aria-label="Исполнитель" class="flex-1" />
        <UInput v-model="free.hours" type="number" step="0.5" min="0" aria-label="Часы" class="sm:w-24" input-class="tabular-nums" />
        <UButton class="shrink-0" @click="addFree">Добавить</UButton>
      </div>
      <p class="text-xs text-zinc-500">Свободная задача не привязана к дорожной карте. В отчёте она попадёт в раздел «Прочие работы».</p>
    </div>
  </div>
</template>
