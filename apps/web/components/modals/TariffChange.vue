<script setup lang="ts">
// Окно «Сменить тариф»: три карточки и эмуляция оплаты через POST /api/billing/change-plan.
import type { PlanId } from '~/types/settings'

const BILLING_PLANS = [
  { id: 'START' as const, legacy: 'start' as PlanId, name: 'Старт', price: 1900, note: 'До 3 проектов и 3 сотрудников', hit: false },
  { id: 'PRO' as const, legacy: 'pro' as PlanId, name: 'Про', price: 4900, note: 'До 15 проектов, 10 сотрудников, автоматический съём позиций', hit: true },
  { id: 'AGENCY' as const, legacy: 'ent' as PlanId, name: 'Агентство', price: 9900, note: 'Безлимит проектов и команды, приоритетная поддержка', hit: false }
]

const props = withDefaults(defineProps<{
  modelValue: boolean
  plan?: PlanId
}>(), { plan: 'pro' })

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  checkout: []
  changed: [plan: PlanId]
}>()

const { can } = useRole()
const notify = useNotify()

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const picked = ref<(typeof BILLING_PLANS)[number]['id']>('PRO')
const period = ref<'month' | 'year'>('month')
const periodOptions = [{ value: 'month', label: '1 месяц' }, { value: 'year', label: '12 месяцев' }]
const pending = ref(false)

watch(open, v => {
  if (!v) return
  picked.value = BILLING_PLANS.find(p => p.legacy === props.plan)?.id ?? 'PRO'
  period.value = 'month'
})

const current = computed(() => BILLING_PLANS.find(p => p.id === picked.value) ?? BILLING_PLANS[1]!)
const periodMonths = computed(() => period.value === 'year' ? 12 : 1)
const total = computed(() => current.value.price * periodMonths.value)
const fmt = (n: number) => n.toLocaleString('ru-RU') + ' ₽'

async function submit() {
  if (pending.value) return
  pending.value = true
  try {
    await $fetch('/api/billing/change-plan', {
      method: 'POST',
      credentials: 'include',
      body: { plan: picked.value, periodMonths: periodMonths.value }
    })
    notify('Тариф обновлён')
    emit('changed', current.value.legacy)
    open.value = false
  } catch (err: unknown) {
    notify(apiErrorMessage(err), 'error')
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <UiSheet
    v-model="open"
    title="Сменить тариф"
    subtitle="Оплата проходит сразу, чек появится в истории"
    size="lg"
    submit="Выбрать и оплатить"
    :submit-allowed="can('company.billing.manage') && !pending"
    submit-tip="Тариф и счета доступны только владельцу компании"
    :submit-toast="false"
    manual
    @submit="submit"
  >
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <label
        v-for="p in BILLING_PLANS"
        :key="p.id"
        class="relative rounded-2xl border border-zinc-200 p-4 cursor-pointer hover:bg-zinc-50 has-[:checked]:border-accent has-[:checked]:ring-4 has-[:checked]:ring-accent/15 transition"
      >
        <input v-model="picked" type="radio" name="plan" :value="p.id" class="sr-only">
        <span v-if="p.hit" class="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-zinc-900 text-white text-[11px] font-medium">Хит</span>
        <div class="text-sm font-semibold">{{ p.name }}</div>
        <div class="text-xl font-semibold tracking-tight mt-1 tabular-nums">{{ fmt(p.price) }}<span class="text-xs font-normal text-zinc-500">/мес</span></div>
        <div class="text-xs text-zinc-500 mt-2">{{ p.note }}</div>
      </label>
    </div>
    <UiField label="Период оплаты"><USelect v-model="period" :options="periodOptions" /></UiField>
    <div class="rounded-2xl bg-zinc-50 px-4 py-3 text-sm">
      К оплате: <span class="font-semibold tabular-nums">{{ fmt(total) }}</span>
    </div>
  </UiSheet>
</template>
