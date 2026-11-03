<script setup lang="ts">
// Окно симуляции OAuth / API-разрешений (registerModal('integration-oauth') в assets/modals.js).
import { SERVICES, useCompanyIntegrations, type IntegrationConnected, type ServiceId } from '~/types/settings'

const props = withDefaults(defineProps<{
  modelValue: boolean
  /** data-prefill-service. */
  service?: ServiceId
  /** Вызвано из мастера «Подключить интеграцию»: не сохранять, а вернуть результат (data-oauth-defer). */
  defer?: boolean
}>(), { service: 'yandex', defer: false })

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  /** Доступ разрешён в режиме defer (integration:oauth-ok). */
  ok: [detail: IntegrationConnected]
  /** Интеграция сохранена (integration:connected). */
  connected: [detail: IntegrationConnected]
}>()

const notify = useNotify()
const integrations = useCompanyIntegrations()

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const s = computed(() => SERVICES[props.service] ?? SERVICES.yandex)
const isKey = computed(() => s.value.auth === 'key')
const account = ref('')
const domain = ref('')
const token = ref('')
const busy = ref(false)

watch(open, v => {
  if (!v) return
  busy.value = false
  account.value = s.value.accounts?.[0] ?? ''
  domain.value = s.value.host ?? ''
  token.value = ''
})

function allow() {
  if (busy.value) return
  const svc = s.value
  let acc = svc.account
  if (isKey.value) {
    if (token.value.trim().length < 8) return notify('Вставьте API-ключ (не меньше 8 символов)')
    acc = domain.value.trim() || svc.host || svc.short
  } else {
    acc = account.value || svc.account
  }
  busy.value = true
  setTimeout(() => {
    busy.value = false
    const detail: IntegrationConnected = { service: props.service, account: acc, projects: svc.bind.length }
    if (props.defer) {
      emit('ok', detail)
      open.value = false
      return
    }
    integrations.value = { ...integrations.value, [props.service]: { status: 'connected', account: acc, projects: svc.bind.length } }
    notify('Интеграция с ' + svc.short + ' успешно подключена для компании')
    emit('connected', detail)
    open.value = false
  }, 1000)
}
</script>

<template>
  <UiSheet v-model="open" title="Подключение сервиса" :subtitle="s.short" size="md" :submit="false" cancel="Отмена">
    <div class="space-y-5">
      <div class="flex items-center justify-center gap-3 py-2">
        <span class="w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-sm" :class="s.tone">{{ s.logo }}</span>
        <svg class="w-5 h-5 text-zinc-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M8 12h8m0 0l-3-3m3 3l-3 3" /></svg>
        <span class="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center text-sm font-semibold shadow-sm">РМ</span>
      </div>
      <p class="text-center text-sm text-zinc-600"><span class="font-medium text-ink">{{ s.short }}</span> запрашивает доступ для <span class="font-medium text-ink">Ромашка Digital</span></p>
      <ul class="rounded-2xl border border-zinc-200 divide-y divide-zinc-100 text-sm text-zinc-700">
        <li v-for="p in s.perms" :key="p" class="px-4 py-2.5 flex items-start gap-2.5">
          <svg class="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" /></svg>
          <span>{{ p }}</span>
        </li>
      </ul>
      <div v-if="!isKey">
        <UiField label="Сервисный аккаунт"><USelect v-model="account" :options="s.accounts ?? []" /></UiField>
      </div>
      <div v-else class="space-y-3">
        <UiField label="Адрес аккаунта"><UInput v-model="domain" placeholder="romashka.callibri.ru" /></UiField>
        <UiField label="API-ключ"><UInput v-model="token" type="password" autocomplete="off" placeholder="Вставьте ключ из настроек сервиса" /></UiField>
      </div>
      <UButton size="lg" block class="rounded-full text-sm" :disabled="busy" @click="allow">
        <span>{{ busy ? 'Проверяем доступ…' : isKey ? 'Подключить по API' : 'Разрешить доступ' }}</span>
        <svg v-if="busy" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
      </UButton>
      <p class="text-[11px] text-zinc-400 text-center">Sandbox OAuth · пароль сервису не передаётся</p>
    </div>
  </UiSheet>
</template>
