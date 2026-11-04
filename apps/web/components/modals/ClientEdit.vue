<script setup lang="ts">
// Окно «Редактировать клиента» (registerModal('client-edit') в assets/modals.js). reset: false — правки сохраняются между открытиями.
import type { ClientForm, ClientUpdated } from '~/types/clients'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  updated: [client: ClientUpdated]
}>()

const { can } = useRole()
const notify = useNotify()

const blank = (): ClientForm => ({
  name: '', inn: '', city: '', rate: '', contact: '', post: '', email: '', phone: '', website: '', brief: 'base', logo: ''
})
const form = ref<ClientForm>(blank())
const status = ref('ACTIVE')
const fields = ref<{ check: () => boolean } | null>(null)

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
watch(open, v => { if (v) void load() })

const route = useRoute()
const pending = ref(false)

async function load() {
  try {
    const row = await $fetch<{
      name: string
      inn: string | null
      city: string | null
      website: string | null
      ratePerHour: number | null
      contactPerson: string
      contactPosition: string
      email: string
      phone: string
      status: string
    }>(`/api/clients/${route.params.id}`, { credentials: 'include' })
    status.value = row.status || 'ACTIVE'
    form.value = {
      name: row.name,
      inn: row.inn || '',
      city: row.city || '',
      rate: row.ratePerHour != null ? String(row.ratePerHour) : '',
      contact: row.contactPerson || '',
      post: row.contactPosition || '',
      email: row.email || '',
      phone: row.phone || '',
      website: row.website || '',
      brief: 'base',
      logo: ''
    }
  } catch (error) {
    notify(apiErrorMessage(error), 'error')
  }
}

async function submit() {
  if (fields.value && !fields.value.check()) return
  const f = form.value
  pending.value = true
  try {
    await $fetch(`/api/clients/${route.params.id}`, {
      method: 'PUT',
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
        status: status.value
      }
    })
    const { brief: _brief, ...rest } = f
    emit('updated', { ...rest })
    open.value = false
    notify('Карточка клиента сохранена', 'success')
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
    title="Редактировать клиента"
    :subtitle="form.name || 'Карточка клиента'"
    size="lg"
    :submit="pending ? 'Сохранение…' : 'Сохранить'"
    :submit-allowed="can('client.manage') && !pending"
    submit-tip="Управление клиентами доступно менеджерам и руководству"
    manual
    @submit="submit"
  >
    <ClientsFields ref="fields" v-model="form" :logo-id="String(route.params.id || '')" />
  </UiSheet>
</template>
