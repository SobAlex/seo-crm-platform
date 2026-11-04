<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  report: { id: string; title: string; client: string; clientEmail: string } | null
}>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; sent: [] }>()

const notify = useNotify()
const pending = ref(false)
const email = ref('')

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value)
})

watch(open, (value) => {
  if (value) email.value = props.report?.clientEmail || ''
})

async function submit() {
  if (!props.report || pending.value) return
  pending.value = true
  try {
    await $fetch(`/api/reports/${props.report.id}/send`, {
      method: 'POST',
      credentials: 'include',
      body: { email: email.value.trim() }
    })
    notify('Отчёт отправлен клиенту', 'success')
    open.value = false
    emit('sent')
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
    title="Отправить клиенту"
    subtitle="Ссылка на веб-версию уйдёт на почту"
    submit="Отправить"
    :submit-allowed="!pending"
    manual
    :submit-toast="false"
    @submit="submit"
  >
    <p v-if="report" class="text-sm text-zinc-700">{{ report.title }}<span v-if="report.client" class="text-zinc-400"> · {{ report.client }}</span></p>
    <UiField label="Email клиента">
      <UInput v-model="email" type="email" required placeholder="client@company.ru" />
    </UiField>
  </UiSheet>
</template>
