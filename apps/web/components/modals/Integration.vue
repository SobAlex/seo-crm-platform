<script setup lang="ts">
// Мастер «Подключить интеграцию» (registerModal('integration') в assets/modals.js): сервис → авторизация → проекты.
import { PROJECTS } from '~/constants/directory'
import { SERVICES, SERVICE_IDS, useCompanyIntegrations, type IntegrationConnected, type ServiceId } from '~/types/settings'

const props = withDefaults(defineProps<{
  modelValue: boolean
  /** data-prefill-service: сразу шаг 2. */
  service?: ServiceId
  /** data-reconnect. */
  reconnect?: boolean
}>(), { service: undefined, reconnect: false })

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  connected: [detail: IntegrationConnected]
}>()

const { can } = useRole()
const notify = useNotify()
const integrations = useCompanyIntegrations()

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const STEPS = ['Сервис', 'Авторизация', 'Проекты']
const WZ_PROJECTS = PROJECTS.filter(p => ['holod', 'remont', 'stroytech'].includes(p.id))

const svc = ref<ServiceId>('yandex')
const step = ref(1)
const authed = ref(false)
const authAccount = ref('')
const domain = ref('')
const token = ref('')
const keyState = ref<'' | 'ok' | 'bad'>('')
const bind = ref<string[]>([])
const oauthOpen = ref(false)

const s = computed(() => SERVICES[svc.value])
const subtitle = computed(() => step.value === 1 ? 'Шаг 1 из 3 · выберите сервис' : `${s.value.name} · шаг ${step.value} из 3`)

watch(open, v => {
  if (!v || oauthOpen.value) return
  svc.value = props.service ?? 'yandex'
  step.value = props.service ? 2 : 1
  authed.value = false
  authAccount.value = ''
  keyState.value = ''
  token.value = ''
  domain.value = SERVICES[svc.value].host ?? ''
  bind.value = WZ_PROJECTS.slice(0, 2).map(p => p.id)
})

function pick(id: ServiceId) {
  svc.value = id
  authed.value = false
  authAccount.value = ''
  keyState.value = ''
  domain.value = SERVICES[id].host ?? ''
}

watch(token, () => { keyState.value = '' })

function onOauthOk(d: IntegrationConnected) {
  if (d.service !== svc.value) return
  authed.value = true
  authAccount.value = d.account
}

function checkKey(): boolean {
  const ok = token.value.trim().length >= 8
  keyState.value = ok ? 'ok' : 'bad'
  if (!ok) notify('Проверьте API-ключ')
  return ok
}

function submit() {
  if (step.value === 2 && s.value.auth === 'oauth' && !authed.value) return notify('Сначала войдите через ' + s.value.short)
  if (step.value === 2 && s.value.auth === 'key' && keyState.value !== 'ok') {
    if (token.value.trim().length >= 8) { if (checkKey()) step.value = 3 }
    else notify('Проверьте API-ключ')
    return
  }
  if (step.value < 3) { step.value++; return }
  const n = bind.value.length
  if (!n) return notify('Выберите хотя бы один проект')
  const account = (s.value.auth === 'oauth' ? authAccount.value || s.value.account : s.value.host) || domain.value.trim()
  integrations.value = { ...integrations.value, [svc.value]: { status: 'connected', account, projects: n, just: true } }
  emit('connected', { service: svc.value, account, projects: n })
  open.value = false
  notify(s.value.short + ' подключён · ' + n + ' ' + plural(n, ['проект', 'проекта', 'проектов']))
}

const dotClass = (n: number) => n < step.value ? 'bg-emerald-500 text-white' : n === step.value ? 'bg-accent text-white' : 'bg-zinc-100 text-zinc-500'
</script>

<template>
  <UiSheet
    v-model="open"
    :title="reconnect ? 'Переподключить интеграцию' : 'Подключить интеграцию'"
    :subtitle="subtitle"
    :submit="step < 3 ? 'Далее' : 'Подключить'"
    :submit-allowed="can('integrations.manage')"
    :submit-tip="TIP_SYSTEM"
    manual
    @submit="submit"
  >
    <ol class="flex items-center gap-2 text-xs" aria-label="Шаги">
      <li v-for="(t, i) in STEPS" :key="t" class="flex items-center gap-2 min-w-0" :class="{ 'flex-1': i > 0 }">
        <span v-if="i" class="flex-1 h-px bg-zinc-200" />
        <span class="w-6 h-6 rounded-full flex items-center justify-center font-semibold tabular-nums shrink-0 transition" :class="dotClass(i + 1)" :aria-label="i + 1 < step ? 'Шаг выполнен' : undefined">
          <template v-if="i + 1 >= step">{{ i + 1 }}</template>
        </span>
        <span class="font-medium whitespace-nowrap" :class="i + 1 === step ? 'text-zinc-900' : 'text-zinc-500'">{{ t }}</span>
      </li>
    </ol>

    <div v-if="step === 1" class="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <label
        v-for="k in SERVICE_IDS"
        :key="k"
        class="flex items-center gap-3 rounded-2xl border border-zinc-200 p-3 cursor-pointer hover:bg-zinc-50 has-[:checked]:border-accent has-[:checked]:ring-4 has-[:checked]:ring-accent/15 transition"
      >
        <input type="radio" name="service" :value="k" :checked="svc === k" required class="sr-only" @change="pick(k)">
        <span class="w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0" :class="SERVICES[k].tone">{{ SERVICES[k].logo }}</span>
        <span class="min-w-0"><span class="block text-sm font-medium truncate">{{ SERVICES[k].short }}</span><span class="block text-xs text-zinc-500 truncate">{{ SERVICES[k].auth === 'oauth' ? 'Вход через OAuth' : 'По API-ключу' }}</span></span>
      </label>
    </div>

    <div v-else-if="step === 2" class="space-y-4">
      <div v-if="s.auth === 'oauth'" class="space-y-4">
        <button
          type="button"
          class="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-medium transition"
          :class="svc === 'yandex' ? 'bg-[#fc3f1d] text-white hover:brightness-95' : 'bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50'"
          @click="oauthOpen = true"
        >
          <span class="w-6 h-6 rounded-full flex items-center justify-center font-bold" :class="svc === 'yandex' ? 'bg-white text-[#fc3f1d]' : 'bg-blue-50 text-blue-600'">{{ s.logo }}</span>{{ authed ? 'Войти другим аккаунтом' : s.btn }}
        </button>
        <div v-if="authed" class="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Доступ разрешён · <b class="font-medium">{{ authAccount }}</b>
          <div class="text-xs text-emerald-700 mt-0.5">Найдено источников: {{ s.bind.length }}</div>
        </div>
        <div class="rounded-2xl bg-zinc-50 px-4 py-3 text-xs text-zinc-600 leading-relaxed">
          Откроется окно входа сервиса. SEO Control запрашивает доступ <b class="font-medium">только на чтение</b>: посещаемость, цели, поисковые запросы и индексацию. Пароль нам не передаётся.
        </div>
      </div>
      <div v-else class="space-y-4">
        <UiField label="Адрес аккаунта" req><UInput v-model="domain" required placeholder="romashka.callibri.ru" /></UiField>
        <UiField label="API-ключ" req hint="Ключ хранится в зашифрованном виде, сотрудники видят только последние 4 символа">
          <div class="flex gap-2">
            <UInput v-model="token" type="password" required autocomplete="off" placeholder="Вставьте ключ из настроек сервиса" class="flex-1" input-class="font-mono" />
            <UButton color="white" class="shrink-0" @click="checkKey">Проверить</UButton>
          </div>
        </UiField>
        <div v-if="keyState" class="rounded-2xl px-4 py-3 text-sm" :class="keyState === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'">
          {{ keyState === 'ok' ? 'Ключ действителен · найдено источников: ' + s.bind.length : 'Ключ не подошёл — проверьте, что скопировали его целиком' }}
        </div>
      </div>
    </div>

    <div v-else class="space-y-3">
      <p class="text-xs text-zinc-500">Найдены источники данных. Отметьте, к каким проектам их привязать — потом это можно поменять в «Источниках» проекта.</p>
      <ul class="rounded-2xl border border-zinc-200 divide-y divide-zinc-100">
        <li v-for="(p, i) in WZ_PROJECTS" :key="p.id" class="px-3 py-2.5 flex items-center gap-3">
          <input v-model="bind" type="checkbox" :value="p.id" class="w-4 h-4 rounded accent-accent shrink-0" :aria-label="p.name">
          <span class="min-w-0 flex-1"><span class="block text-sm font-medium truncate">{{ p.name }}</span><span class="block text-xs text-zinc-500 truncate">{{ s.bind[i] }}</span></span>
        </li>
      </ul>
    </div>

    <button v-if="step > 1" type="button" class="text-xs text-zinc-500 hover:text-zinc-900 transition" @click="step--">← Назад</button>

    <ModalsIntegrationOauth v-model="oauthOpen" :service="svc" defer @ok="onOauthOk" />
  </UiSheet>
</template>
