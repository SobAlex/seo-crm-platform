<script setup lang="ts">
// Карточка интеграции ([data-integration] в settings.html): статус, аккаунт, действия по состоянию.
import { useCompanyIntegrations, type ServiceId } from '~/types/settings'

const props = defineProps<{
  id: ServiceId
  title: string
  sub: string
  logo: string
  tone: string
  auth: 'oauth' | 'key'
  allowed: boolean
  tip: string
}>()

const emit = defineEmits<{
  connect: [id: ServiceId, reconnect: boolean]
  disconnect: [id: ServiceId]
}>()

const integrations = useCompanyIntegrations()
const row = computed(() => integrations.value[props.id] ?? { status: 'off' as const, account: '', projects: 0 })

const STATE = {
  connected: { cls: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-600', label: 'Подключён' },
  expired: { cls: 'bg-amber-50 text-amber-800', dot: 'bg-amber-500', label: 'Токен истёк' },
  off: { cls: 'bg-zinc-100 text-zinc-600', dot: 'bg-zinc-400', label: 'Не подключён' }
} as const

const extra = computed(() => {
  const r = row.value
  if (props.id === 'callibri' || props.id === 'amocrm') return 'API · обновлено только что'
  if (r.just) return 'обновлено только что'
  const n = r.projects || 0
  return 'синхронизировано ' + n + ' ' + plural(n, ['проект', 'проекта', 'проектов'])
})

const offInfo = computed(() => {
  if (props.id === 'callibri') return 'Подключите API-ключ, чтобы звонки попадали в отчёты по проектам'
  if (props.id === 'amocrm') return 'Лиды из CRM подтягиваются в отчёты по проектам'
  return 'Не подключён — проекты работают в ручном режиме факта'
})

const BTN = 'rounded-full px-3.5'
</script>

<template>
  <section class="bg-white rounded-2xl shadow-card p-5 flex flex-col gap-4">
    <div class="flex items-start justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0">
        <span class="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold" :class="tone">{{ logo }}</span>
        <div class="min-w-0">
          <div class="text-sm font-medium">{{ title }}</div>
          <div class="text-xs text-zinc-500 mt-0.5">{{ sub }}</div>
        </div>
      </div>
      <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium shrink-0" :class="STATE[row.status].cls"><span class="w-1.5 h-1.5 rounded-full" :class="STATE[row.status].dot" />{{ STATE[row.status].label }}</span>
    </div>
    <p class="text-xs text-zinc-500">
      <template v-if="row.status === 'connected'">Аккаунт: <span class="text-zinc-900 font-medium">{{ row.account || '—' }}</span> · {{ extra }}</template>
      <template v-else-if="row.status === 'expired'">Аккаунт: <span class="text-zinc-900 font-medium">{{ row.account || '—' }}</span> · требуется переподключение</template>
      <template v-else>{{ offInfo }}</template>
    </p>
    <div class="mt-auto flex flex-wrap items-center gap-2">
      <AccessGate :allowed="allowed" :tip="tip">
        <UButton v-if="row.status === 'off'" :class="BTN" :disabled="!allowed" :data-deny-tip="tip" @click="emit('connect', id, false)">{{ auth === 'key' ? 'Подключить по API' : 'Подключить' }}</UButton>
        <UButton v-else-if="row.status === 'expired'" :class="BTN" :disabled="!allowed" :data-deny-tip="tip" @click="emit('connect', id, true)">Обновить токен</UButton>
        <UButton v-else color="white" :class="BTN" :disabled="!allowed" :data-deny-tip="tip" @click="emit('connect', id, true)">Переподключить</UButton>
      </AccessGate>
      <AccessGate v-if="row.status !== 'off'" :allowed="allowed" :tip="tip">
        <UButton color="gray" variant="ghost" :class="[BTN, 'text-zinc-500 hover:text-red-600 hover:bg-red-50']" :disabled="!allowed" :data-deny-tip="tip" @click="emit('disconnect', id)">Отключить</UButton>
      </AccessGate>
    </div>
  </section>
</template>
