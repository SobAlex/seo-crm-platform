<script setup lang="ts">
// Окно «Редактировать клиента» (registerModal('client-edit') в assets/modals.js). reset: false — правки сохраняются между открытиями.
import { CLIENTS } from '~/constants/directory'
import type { ClientForm, ClientUpdated } from '~/types/clients'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  updated: [client: ClientUpdated]
}>()

const { can } = useRole()
const notify = useNotify()

const c = CLIENTS[0]!
const form = ref<ClientForm>({
  name: c.name, inn: c.inn, city: c.city, rate: String(c.rate), contact: c.contact, post: c.post,
  email: c.email, phone: c.phone, brief: c.brief || 'base', logo: ''
})
const fields = ref<{ check: () => boolean } | null>(null)

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

function submit() {
  if (fields.value && !fields.value.check()) return
  const { brief: _brief, ...rest } = form.value
  emit('updated', { ...rest })
  open.value = false
  notify('Карточка клиента сохранена')
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="Редактировать клиента"
    subtitle="ООО «Холод Групп»"
    size="lg"
    submit="Сохранить"
    :submit-allowed="can('client.manage')"
    submit-tip="Управление клиентами доступно менеджерам и руководству"
    manual
    @submit="submit"
  >
    <ClientsFields ref="fields" v-model="form" logo-id="holod" />
  </UiSheet>
</template>
