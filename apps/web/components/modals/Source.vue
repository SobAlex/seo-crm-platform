<script setup lang="ts">
// Окно «Подключить источник» (registerModal('source') в assets/modals.js).
import type { SourceConnected } from '~/types/project'

type SourceType = SourceConnected['type']

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  connected: [source: SourceConnected]
}>()

const { can } = useRole()
const notify = useNotify()

const SOURCES: Record<SourceType, { name: string; idLabel: string; ph: string; hint: string; digits?: number[] }> = {
  metrika: { name: 'Яндекс.Метрика', idLabel: 'ID счётчика', ph: '94512367', hint: 'Метрика → Настройки → номер счётчика', digits: [6, 7, 8, 9] },
  webmaster: { name: 'Яндекс.Вебмастер', idLabel: 'Сайт в Вебмастере', ph: 'https:holod-shop.ru:443', hint: 'Как сайт записан в Вебмастере' },
  gsc: { name: 'Google Search Console', idLabel: 'Ресурс', ph: 'sc-domain:holod-shop.ru', hint: 'Доменный ресурс или URL-префикс' },
  callibri: { name: 'Callibri', idLabel: 'ID проекта Callibri', ph: '108422', hint: 'Callibri → Настройки проекта → ID', digits: [4, 5, 6, 7] }
}
const ACCOUNTS: { value: string; label: string; when: SourceType[] }[] = [
  { value: 'direct@romashka.ru', label: 'direct@romashka.ru (Яндекс)', when: ['metrika', 'webmaster'] },
  { value: 'seo@romashka.ru', label: 'seo@romashka.ru (Google)', when: ['gsc'] },
  { value: 'callibri-api', label: 'API-ключ компании Callibri', when: ['callibri'] }
]
const PULL: Record<'metrika' | 'search' | 'callibri', { label: string; checked: boolean }[]> = {
  metrika: [{ label: 'Визиты из поиска', checked: true }, { label: 'Конверсии по целям', checked: true }, { label: 'Отказы и глубина', checked: false }],
  search: [{ label: 'Позиции и показы запросов', checked: true }, { label: 'Индексация страниц', checked: true }, { label: 'Ошибки и предупреждения', checked: false }],
  callibri: [{ label: 'Звонки и заявки', checked: true }, { label: 'Источник обращения', checked: true }]
}
const typeOptions = (Object.keys(SOURCES) as SourceType[]).map(k => ({ value: k, label: SOURCES[k].name }))
const goalOptions = [
  { value: 'form', label: 'Отправка формы заявки' },
  { value: 'call', label: 'Клик по телефону' },
  { value: 'cart', label: 'Оформление заказа' }
]
const historyOptions = [
  { value: '3', label: 'За 3 месяца' },
  { value: '6', label: 'За 6 месяцев' },
  { value: '12', label: 'За 12 месяцев' }
]

const blank = () => ({
  stype: 'metrika' as SourceType,
  account: 'direct@romashka.ru',
  counter: '',
  pull: Object.fromEntries(Object.entries(PULL).map(([k, list]) => [k, list.map(i => i.checked)])) as Record<keyof typeof PULL, boolean[]>,
  goal: 'form',
  history: '6'
})
const form = ref(blank())

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
watch(open, v => { if (v) form.value = blank() })

const src = computed(() => SOURCES[form.value.stype])
const accountOptions = computed(() => ACCOUNTS.filter(a => a.when.includes(form.value.stype)).map(({ value, label }) => ({ value, label })))
const pullGroup = computed<keyof typeof PULL>(() => form.value.stype === 'metrika' ? 'metrika' : form.value.stype === 'callibri' ? 'callibri' : 'search')

watch(() => form.value.stype, () => {
  if (!accountOptions.value.some(o => o.value === form.value.account)) form.value.account = accountOptions.value[0]?.value ?? ''
})

function submit() {
  const s = src.value
  const id = form.value.counter.trim()
  if (s.digits && !new RegExp(`^(${s.digits.map(n => `\\d{${n}}`).join('|')})$`).test(id)) {
    notify('Проверьте выделенные поля')
    return
  }
  emit('connected', {
    type: form.value.stype,
    name: s.name,
    id,
    account: accountOptions.value.find(o => o.value === form.value.account)?.label ?? ''
  })
  open.value = false
  notify(`${s.name} подключён · ${s.idLabel.toLowerCase()} ${id}`)
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="Подключить источник"
    subtitle="Метрики подтянутся в проект, графики и отчёты"
    submit="Подключить"
    :submit-allowed="can('project.sources.link')"
    :submit-tip="TIP_SYSTEM"
    manual
    @submit="submit"
  >
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UiField label="Тип источника" req><USelect v-model="form.stype" :options="typeOptions" required /></UiField>
      <UiField label="Аккаунт" hint="Подключается один раз в Настройках → Интеграции"><USelect v-model="form.account" :options="accountOptions" /></UiField>
    </div>
    <UiField :label="src.idLabel" req :hint="src.hint">
      <UInput v-model="form.counter" required :placeholder="src.ph" :inputmode="src.digits ? 'numeric' : 'text'" />
    </UiField>
    <UiField label="Что подтягивать">
      <div class="rounded-2xl border border-zinc-200 p-4">
        <div class="space-y-2">
          <label v-for="(item, i) in PULL[pullGroup]" :key="pullGroup + i" class="flex items-start gap-2.5 text-sm cursor-pointer">
            <input v-model="form.pull[pullGroup][i]" type="checkbox" class="mt-0.5 w-4 h-4 rounded border-zinc-300 accent-accent">
            <span>{{ item.label }}</span>
          </label>
        </div>
      </div>
    </UiField>
    <UiField v-if="form.stype === 'metrika'" label="Цель «Лид»" hint="Конверсии по этой цели станут лидами в проекте">
      <USelect v-model="form.goal" :options="goalOptions" />
    </UiField>
    <UiField label="Загрузить историю"><USelect v-model="form.history" :options="historyOptions" /></UiField>
  </UiSheet>
</template>
