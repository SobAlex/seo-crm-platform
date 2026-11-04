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

const blank = (): ClientForm => ({ name: '', inn: '', city: '', rate: '', contact: '', post: '', email: '', phone: '', website: '', brief: 'base', logo: '' })
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

const pending = ref(false)

async function submit() {
  if (fields.value && !fields.value.check()) return
  const f = form.value
  if (!f.name.trim() || !f.contact.trim() || !f.email.trim()) {
    notify('Заполните название компании, контактное лицо и email', 'error')
    return
  }
  pending.value = true
  try {
    const saved = await $fetch<{
      id: string
      slug: string
      name: string
      inn: string | null
      city: string | null
      ratePerHour: number | null
      contactPerson: string
      contactPosition: string
      email: string
      phone: string
    }>('/api/clients', {
      method: 'POST',
      credentials: 'include',
      body: {
        name: f.name.trim(),
        contactPerson: f.contact.trim(),
        email: f.email.trim(),
        phone: f.phone.trim(),
        inn: f.inn.trim(),
        city: f.city.trim(),
        contactPosition: f.post.trim(),
        ratePerHour: f.rate.trim(),
        website: f.website.trim(),
        status: 'LEAD'
      }
    })
    const c = {
      id: saved.slug || saved.id,
      name: saved.name,
      inn: saved.inn || '',
      city: saved.city || '',
      rate: saved.ratePerHour || 0,
      contact: saved.contactPerson,
      post: saved.contactPosition || '',
      email: saved.email,
      phone: saved.phone || '',
      brief: f.brief
    } as DirectoryClient
    if (f.logo) {
      try { localStorage.setItem(`seo_client_logo_${c.id}`, f.logo) } catch { /* ignore */ }
    }
    emit('created', c)
    open.value = false
    if (!sendBrief.value) {
      notify(`Клиент ${c.name} создан`, 'success')
      return
    }
    created.value = c
    setTimeout(() => {
      briefOpen.value = true
      notify('Клиент создан — отправьте ему бриф', 'success')
    }, 50)
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="Новый клиент"
    subtitle="Реквизиты, контакт и бриф для старта"
    size="lg"
    :submit="pending ? 'Создание…' : 'Создать клиента'"
    :submit-allowed="can('client.manage') && !pending"
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
