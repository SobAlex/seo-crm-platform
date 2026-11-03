<script setup lang="ts">
// Окно «Новый клиент» (registerModal('client-create') в assets/modals.js).
// «Отправить бриф контакту сразу» открывает окно «Отправить бриф» с новым клиентом.
import type { BriefSent, ClientForm, DirectoryClient } from '~/types/clients'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: [client: DirectoryClient]
  'brief-sent': [detail: BriefSent]
}>()

const { can } = useRole()
const notify = useNotify()

const blank = (): ClientForm => ({ name: '', inn: '', city: '', rate: '', contact: '', post: '', email: '', phone: '', brief: 'base', logo: '' })
const form = ref(blank())
const sendBrief = ref(true)
const fields = ref<{ check: () => boolean } | null>(null)

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
watch(open, v => {
  if (!v) return
  form.value = blank()
  sendBrief.value = true
})

const briefOpen = ref(false)
const created = ref<DirectoryClient | null>(null)

function submit() {
  if (fields.value && !fields.value.check()) return
  const f = form.value
  const c: DirectoryClient = {
    id: 'c' + Date.now(), name: f.name.trim(), inn: f.inn.trim(), city: f.city.trim(), rate: +f.rate || 0,
    contact: f.contact.trim(), post: f.post.trim(), email: f.email.trim(), phone: f.phone.trim(), brief: f.brief
  }
  if (f.logo) {
    try { localStorage.setItem(`seo_client_logo_${c.id}`, f.logo) } catch { /* ignore */ }
  }
  emit('created', c)
  open.value = false
  if (!sendBrief.value) {
    notify(`Клиент ${c.name} создан`)
    return
  }
  created.value = c
  setTimeout(() => {
    briefOpen.value = true
    notify('Клиент создан — отправьте ему бриф')
  }, 50)
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="Новый клиент"
    subtitle="Реквизиты, контакт и бриф для старта"
    size="lg"
    submit="Создать клиента"
    :submit-allowed="can('client.manage')"
    submit-tip="Управление клиентами доступно менеджерам и руководству"
    manual
    @submit="submit"
  >
    <ClientsFields ref="fields" v-model="form" logo-id="new" />
    <label class="flex items-start gap-2.5 text-sm cursor-pointer">
      <input v-model="sendBrief" type="checkbox" name="send_brief" class="mt-0.5 w-4 h-4 rounded border-zinc-300 accent-accent">
      <span>Отправить бриф контакту сразу после создания</span>
    </label>
  </UiSheet>
  <ModalsBriefSend
    v-model="briefOpen"
    :prefill-client="created?.id"
    :prefill-brief="created?.brief"
    :extra-clients="created ? [created] : []"
    @sent="emit('brief-sent', $event)"
  />
</template>
