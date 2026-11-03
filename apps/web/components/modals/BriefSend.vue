<script setup lang="ts">
// Окно «Отправить бриф» (registerModal('brief-send') в assets/modals.js): публичная ссылка на опросник.
import { BRIEFS, CLIENTS } from '~/constants/directory'
import type { BriefSent, DirectoryClient } from '~/types/clients'

const props = defineProps<{
  modelValue: boolean
  /** data-prefill-client: клиент выбран заранее. */
  prefillClient?: string
  /** Шаблон брифа сразу после создания клиента. */
  prefillBrief?: string
  /** Клиенты, созданные на странице и ещё не попавшие в справочник. */
  extraClients?: DirectoryClient[]
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  sent: [detail: BriefSent]
}>()

const { can } = useRole()
const notify = useNotify()
const origin = useRequestURL().origin

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const clients = computed(() => [...CLIENTS, ...(props.extraClients ?? [])])
const find = (id: string) => clients.value.find(c => c.id === id)
const clientOptions = computed(() => clients.value.map(c => ({ value: c.id, label: c.name })))
const briefOptions = BRIEFS.map(b => ({ value: b.id, label: b.name }))
const ttlOptions = [
  { value: '7', label: '7 дней' },
  { value: '14', label: '14 дней' },
  { value: '30', label: '30 дней' },
  { value: '0', label: 'Без срока' }
]

const form = ref({ client: 'holod', brief: 'ecommerce', ttl: '14' })

watch(open, v => {
  if (!v) return
  const client = props.prefillClient ?? 'holod'
  form.value = { client, brief: props.prefillBrief || find(client)?.brief || 'ecommerce', ttl: '14' }
})
watch(() => form.value.client, (id, prev) => {
  if (!prev || !open.value) return
  const c = find(id)
  if (c?.brief) form.value.brief = c.brief
})

const path = computed(() => {
  const c = find(form.value.client) ?? CLIENTS[0]!
  const q = new URLSearchParams({ client: c.id, brief: form.value.brief, t: (c.inn || '').slice(-4) + 'k9' })
  if (form.value.ttl && form.value.ttl !== '0') q.set('ttl', form.value.ttl)
  return `/brief-form?${q.toString()}`
})
const link = computed(() => origin + path.value)

async function copy() {
  try { await navigator.clipboard?.writeText(link.value) } catch { /* ignore */ }
  notify('Ссылка на бриф скопирована')
}

function submit() {
  emit('sent', { client: form.value.client, label: find(form.value.client)?.name ?? '', mode: 'link' })
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="Отправить бриф"
    subtitle="Защищённая публичная ссылка на форму — без учётной записи"
    submit="Готово"
    submit-toast="Ссылка на бриф сохранена в карточке клиента"
    :submit-allowed="can('client.manage')"
    submit-tip="Управление клиентами доступно менеджерам и руководству"
    @submit="submit"
  >
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UiField label="Клиент" req><USelect v-model="form.client" :options="clientOptions" required /></UiField>
      <UiField label="Шаблон брифа"><USelect v-model="form.brief" :options="briefOptions" /></UiField>
    </div>
    <UiField label="Ссылка на бриф" hint="Клиент заполнит бриф без регистрации. Ответы появятся в карточке клиента.">
      <div class="flex gap-2">
        <UInput :model-value="link" name="link" readonly class="flex-1 min-w-0" input-class="bg-zinc-50 text-zinc-600 font-mono text-xs" />
        <UButton color="black" class="rounded-full px-4 text-sm" @click="copy">Скопировать ссылку</UButton>
      </div>
    </UiField>
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <UiField label="Ссылка действует"><USelect v-model="form.ttl" :options="ttlOptions" /></UiField>
      <div class="flex items-end">
        <UButton :to="path" target="_blank" rel="noopener" color="white" block class="rounded-full text-sm">Открыть форму брифа ↗</UButton>
      </div>
    </div>
  </UiSheet>
</template>
