<script setup lang="ts">
// Окно «Создать событие» (#event-modal в calendar.html): напоминание или событие на дату.
const props = defineProps<{
  modelValue: boolean
  /** data-prefill-date дня календаря, 'YYYY-MM-DD'. */
  date?: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  created: [event: { kind: string; title: string; date: string; time: string; project: string }]
}>()

const notify = useNotify()

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const KINDS = [{ value: 'reminder', label: 'Напоминание' }, { value: 'event', label: 'Событие' }]
const PROJECT_OPTIONS = [{ value: '', label: '— Без проекта —' }, ...['Холод', 'Ремонт+', 'Стройтех', 'МедЛайф'].map(v => ({ value: v, label: v }))]
const REMIND_OPTIONS = ['За 15 минут', 'За 1 час', 'За 3 часа', 'За день']

const blank = () => ({ kind: 'reminder', title: '', date: props.date || '2025-06-15', time: '15:00', project: '', remind: 'За 1 час', text: '' })
const form = ref(blank())
watch(open, v => { if (v) form.value = blank() })

function submit() {
  const f = form.value
  const kind = KINDS.find(k => k.value === f.kind)?.label ?? 'Событие'
  const date = f.date.split('-').reverse().join('.')
  emit('created', { kind: f.kind, title: f.title.trim(), date: f.date, time: f.time, project: f.project })
  open.value = false
  notify(`${kind} «${f.title.trim()}» — ${date}`)
}
</script>

<template>
  <UiSheet v-model="open" title="Создать событие" submit="Создать" manual @submit="submit">
    <UiField label="Тип">
      <UiSegmented v-model="form.kind" :options="KINDS" size="md" aria-label="Тип" />
    </UiField>
    <UiField label="Название">
      <UInput v-model="form.title" required placeholder="Например: Проверить отчёт по МедЛайф" />
    </UiField>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UiField label="Дата"><UInput v-model="form.date" type="date" required /></UiField>
      <UiField label="Время"><UInput v-model="form.time" type="time" /></UiField>
    </div>
    <UiField label="Проект" opt="опционально">
      <USelect v-model="form.project" :options="PROJECT_OPTIONS" />
    </UiField>
    <UiField label="Напомнить заранее">
      <USelect v-model="form.remind" :options="REMIND_OPTIONS" />
    </UiField>
    <UiField label="Описание" opt="опционально">
      <UTextarea v-model="form.text" :rows="2" resize placeholder="Детали события" />
    </UiField>
  </UiSheet>
</template>
