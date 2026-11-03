<script setup lang="ts">
// Sandbox-оплата подписки (registerModal('checkout') в assets/modals.js).
import { fmtRub, type BillingPaid } from '~/types/settings'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  paid: [detail: BillingPaid]
}>()

const { can } = useRole()
const notify = useNotify()

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const period = ref<'month' | 'year'>('month')
const pay = ref<'card' | 'invoice'>('card')
const periodOptions = [{ value: 'month', label: 'На 1 месяц · 9 900 ₽' }, { value: 'year', label: 'На 1 год · 95 040 ₽ (−20%)' }]
const payOptions = [{ value: 'card', label: 'Банковская карта' }, { value: 'invoice', label: 'Счёт на оплату' }]

const card = ref({ number: '4242 •••• •••• 4242', exp: '12/28', cvc: '123' })
const inn = ref('7701234567')
const org = ref('Ромашка Digital')
const busy = ref(false)

const amount = computed(() => period.value === 'year' ? 95040 : 9900)

watch(open, v => {
  if (!v) return
  period.value = 'month'
  pay.value = 'card'
  busy.value = false
})

function invoice() {
  notify('Счёт № СЧ-' + amount.value + ' для «' + (org.value.trim() || 'Ромашка Digital') + '» сформирован · PDF скачивается')
}

function payNow() {
  if (busy.value || !can('company.billing.manage')) return
  busy.value = true
  setTimeout(() => {
    busy.value = false
    const isYear = period.value === 'year'
    notify('Оплата успешно проведена! Тариф «Про» активен на ' + (isYear ? '365 дней' : '30 дней'))
    emit('paid', {
      amount: amount.value,
      period: period.value,
      method: 'card',
      purpose: isYear ? 'Подписка «Про» на 1 год' : 'Подписка «Про» на 1 месяц',
      until: '26.11.2026'
    })
    open.value = false
  }, 1000)
}
</script>

<template>
  <UiSheet v-model="open" title="Оплата подписки SEO Control" subtitle="Тариф «Про»" size="lg" :submit="false" cancel="Закрыть">
    <div class="space-y-4">
      <div>
        <div class="text-xs font-medium text-zinc-500 mb-2">Период</div>
        <UiSegmented v-model="period" :options="periodOptions" size="md" aria-label="Период" />
      </div>
      <div>
        <div class="text-xs font-medium text-zinc-500 mb-2">Способ оплаты</div>
        <UiSegmented v-model="pay" :options="payOptions" size="md" aria-label="Способ оплаты" />
      </div>
      <div v-if="pay === 'card'" class="space-y-3">
        <p class="text-xs text-zinc-500">Для физлиц и самозанятых · Sandbox Test</p>
        <UiField label="Номер карты"><UInput v-model="card.number" inputmode="numeric" placeholder="4242 •••• •••• 4242" input-class="tabular-nums" /></UiField>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UiField label="Срок"><UInput v-model="card.exp" inputmode="numeric" placeholder="MM/YY" input-class="tabular-nums" /></UiField>
          <UiField label="CVC"><UInput v-model="card.cvc" type="password" inputmode="numeric" placeholder="•••" maxlength="4" input-class="tabular-nums" /></UiField>
        </div>
      </div>
      <div v-else class="space-y-3">
        <p class="text-xs text-zinc-500">Для юрлиц и ИП · данные подставлены из профиля компании</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UiField label="ИНН"><UInput v-model="inn" input-class="tabular-nums" /></UiField>
          <UiField label="Организация"><UInput v-model="org" /></UiField>
        </div>
        <UButton color="white" size="md" block class="rounded-full text-sm" @click="invoice">Сформировать и скачать счёт на оплату (PDF)</UButton>
      </div>
      <AccessGate v-if="pay === 'card'" :allowed="can('company.billing.manage')" tip="Тариф и счета доступны только владельцу компании" block>
        <UButton size="lg" block class="rounded-full text-sm" :disabled="busy || !can('company.billing.manage')" @click="payNow">
          <span>{{ busy ? 'Обработка платежа…' : `Оплатить ${fmtRub(amount)} (Тестовый платеж)` }}</span>
          <svg v-if="busy" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
        </UButton>
      </AccessGate>
      <p class="text-[11px] text-zinc-400 text-center">Sandbox Checkout · деньги не списываются</p>
    </div>
  </UiSheet>
</template>
