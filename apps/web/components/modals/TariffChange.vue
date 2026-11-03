<script setup lang="ts">
// Окно «Сменить тариф» (registerModal('tariff-change') и алиас 'tariff' в assets/modals.js).
import { RUB_PLANS, YEAR_FACTOR, fmtRub, type PlanId } from '~/types/settings'

const props = withDefaults(defineProps<{
  modelValue: boolean
  /** data-prefill-plan. */
  plan?: PlanId
}>(), { plan: 'pro' })

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  /** Выбран текущий «Про» — родитель открывает Checkout. */
  checkout: []
  changed: [plan: PlanId]
}>()

const { can } = useRole()
const notify = useNotify()

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const picked = ref<PlanId>(props.plan)
const period = ref<'month' | 'year'>('month')
const periodOptions = [{ value: 'month', label: 'Помесячно' }, { value: 'year', label: 'За год — скидка 20%' }]

watch(open, v => {
  if (!v) return
  picked.value = props.plan
  period.value = 'month'
})

const current = computed(() => RUB_PLANS.find(p => p.id === picked.value) ?? RUB_PLANS[1]!)
const monthly = computed(() => Math.round(current.value.price * (period.value === 'year' ? YEAR_FACTOR : 1)))

function submit() {
  const p = current.value
  open.value = false
  if (p.id === 'pro') {
    notify('Тариф «Про» сохранён — оформите оплату в окне Checkout')
    setTimeout(() => emit('checkout'), 280)
    return
  }
  emit('changed', p.id)
  notify('Заявка на смену тарифа на «' + p.name + '» отправлена · менеджер свяжется в течение дня')
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="Сменить тариф"
    subtitle="Сейчас: Тариф Про (Агентство) · пробный период"
    size="lg"
    submit="Перейти на тариф"
    :submit-allowed="can('company.billing.manage')"
    submit-tip="Тариф и счета доступны только владельцу компании"
    manual
    @submit="submit"
  >
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <label
        v-for="p in RUB_PLANS"
        :key="p.id"
        class="relative rounded-2xl border border-zinc-200 p-4 cursor-pointer hover:bg-zinc-50 has-[:checked]:border-accent has-[:checked]:ring-4 has-[:checked]:ring-accent/15 transition"
      >
        <input v-model="picked" type="radio" name="plan" :value="p.id" class="sr-only">
        <div class="text-sm font-semibold">{{ p.name }}</div>
        <div class="text-xl font-semibold tracking-tight mt-1 tabular-nums">{{ fmtRub(p.price) }}<span class="text-xs font-normal text-zinc-500">/мес</span></div>
        <div class="text-xs text-zinc-500 mt-2">{{ p.note }}</div>
        <div class="text-xs text-zinc-400 mt-1">{{ p.projects ? `До ${p.projects} проектов` : 'Без лимита проектов' }}{{ p.seats ? ` · до ${p.seats} сотрудников` : '' }}</div>
      </label>
    </div>
    <UiField label="Период оплаты"><USelect v-model="period" :options="periodOptions" /></UiField>
    <div class="rounded-2xl bg-zinc-50 px-4 py-3 text-sm">
      Итого: <span class="font-semibold tabular-nums">{{ fmtRub(monthly) }}/мес</span>
      <template v-if="period === 'year'"> · <span class="tabular-nums">{{ fmtRub(monthly * 12) }}</span> за год</template>
      <div v-if="current.id === 'start'" class="text-xs text-amber-700 mt-1">На «Старте» лимит 5 проектов — лишние придётся архивировать</div>
    </div>
  </UiSheet>
</template>
