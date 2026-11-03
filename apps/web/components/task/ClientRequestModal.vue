<script setup lang="ts">
// Окно «Запросить у клиента» (#client-request-modal в task.html).
const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const NEEDS = ['Доступ к сервису', 'Согласование правок', 'Материалы и контент', 'Ответ на вопрос']
const blank = () => ({ need: NEEDS[0]!, message: '', until: '' })
const form = ref(blank())
watch(open, v => { if (v) form.value = blank() })
</script>

<template>
  <UiSheet
    v-model="open"
    title="Запросить у клиента"
    submit="Отправить запрос"
    submit-toast="Запрос отправлен клиенту"
  >
    <UiField label="Что нужно от клиента">
      <USelect v-model="form.need" :options="NEEDS" />
    </UiField>
    <UiField label="Сообщение клиенту">
      <UTextarea v-model="form.message" :rows="3" placeholder="Что именно нужно и зачем" />
    </UiField>
    <UiField label="Ответить до">
      <UInput v-model="form.until" type="date" />
    </UiField>
    <div class="rounded-xl bg-zinc-50 p-3">
      <p class="text-xs text-zinc-500">Задача получит статус «Ждёт клиента», запрос появится в клиентском портале и в письме менеджеру проекта. Срок задачи остановится до ответа.</p>
    </div>
  </UiSheet>
</template>
