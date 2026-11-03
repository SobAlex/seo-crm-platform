<script setup lang="ts">
// Окно «14 дней бесплатно» (#signup-modal прототипа): компания, имя, рабочий email и тариф на триал.
const props = defineProps<{
  modelValue: boolean
  /** Тариф с кнопки, которой открыли окно (data-plan). */
  plan?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>()

const notify = useNotify()

const PLANS = [
  { value: 'start', label: 'Старт' },
  { value: 'pro', label: 'Про / Агентство' },
  { value: 'ent', label: 'Enterprise' }
]

const blank = () => ({ company: '', name: '', email: '', plan: 'pro' })
const form = ref(blank())

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})
watch(open, v => { if (v && props.plan) form.value.plan = props.plan })

function submit() {
  const f = form.value
  const plan = PLANS.find(p => p.value === f.plan)?.label ?? ''
  const email = f.email.trim()
  open.value = false
  form.value = blank()
  notify(`Триал «${plan}» на 14 дней открыт. Письмо ушло на ${email}`, 'success')
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="14 дней бесплатно"
    subtitle="Карта не нужна. Кабинет откроется на рабочей почте."
    submit="Открыть триал"
    manual
    @submit="submit"
  >
    <UiField label="Компания"><UInput v-model="form.company" name="company" required placeholder="Ромашка Digital" /></UiField>
    <UiField label="Ваше имя"><UInput v-model="form.name" name="name" required placeholder="Александр Смирнов" /></UiField>
    <UiField label="Рабочий email"><UInput v-model="form.email" name="email" type="email" required placeholder="a@romashka.ru" /></UiField>
    <UiField label="Тариф на триал"><USelect v-model="form.plan" name="plan" :options="PLANS" /></UiField>
  </UiSheet>
</template>
