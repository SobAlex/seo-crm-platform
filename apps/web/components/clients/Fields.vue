<script setup lang="ts">
// Тело окон «Новый клиент» / «Редактировать клиента» (clientBody + clientLogoField в assets/modals.js).
import { BRIEFS } from '~/constants/directory'
import { clientMono, type ClientForm } from '~/types/clients'

const props = defineProps<{
  /** Ключ логотипа в localStorage: seo_client_logo_<id>. */
  logoId: string
}>()
const form = defineModel<ClientForm>({ required: true })

const { can } = useRole()
const notify = useNotify()
const cityList = useId()

const CITIES = ['Москва', 'Санкт-Петербург', 'Екатеринбург', 'Новосибирск', 'Казань', 'Краснодар', 'Нижний Новгород']
const briefOptions = BRIEFS.map(b => ({ value: b.id, label: b.name }))
const INVALID = '!border-red-400 ring-4 ring-red-100'
const INN_RE = /^(\d{10}|\d{12})$/

const stored = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const innBad = ref(false)
const rateBad = ref(false)
const logoSrc = computed(() => form.value.logo || stored.value)

const mono = computed(() => clientMono(form.value.name || 'Холод Групп'))

onMounted(() => {
  try { stored.value = localStorage.getItem(`seo_client_logo_${props.logoId}`) || '' } catch { /* ignore */ }
})

function onLogo() {
  const input = fileInput.value
  const file = input?.files?.[0]
  if (!input || !file) return
  if (file.size > 2 * 1024 * 1024) {
    notify('Файл больше 2 МБ — выберите изображение поменьше', 'error')
    input.value = ''
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    const data = String(reader.result || '')
    form.value.logo = data
    try { localStorage.setItem(`seo_client_logo_${props.logoId}`, data) } catch { /* ignore */ }
  }
  reader.readAsDataURL(file)
}

/** Проверки, которых нет в UiSheet: data-digits="10,12" у ИНН и min="500" у ставки. */
function check(): boolean {
  innBad.value = !INN_RE.test(form.value.inn.trim())
  rateBad.value = can('finance.fee.view') && +form.value.rate < 500
  if (innBad.value || rateBad.value) {
    notify('Проверьте выделенные поля')
    return false
  }
  return true
}
defineExpose({ check })

watch(() => form.value.inn, () => { innBad.value = false })
watch(() => form.value.rate, () => { rateBad.value = false })
</script>

<template>
  <div class="mb-4">
    <label class="block text-xs font-medium text-zinc-500 mb-2">Логотип клиента <span class="text-zinc-400 font-normal">— опционально</span></label>
    <div class="flex items-center gap-4">
      <div class="w-14 h-14 rounded-2xl bg-zinc-900 text-white font-semibold flex items-center justify-center shrink-0 text-base shadow-sm overflow-hidden">
        <img v-if="logoSrc" :src="logoSrc" alt="" class="w-full h-full object-contain p-1.5">
        <span v-else>{{ mono }}</span>
      </div>
      <div class="flex-1 min-w-0">
        <input ref="fileInput" name="logo" type="file" accept="image/png,image/jpeg,image/svg+xml" class="block w-full text-xs text-zinc-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200 cursor-pointer" @change="onLogo">
        <p class="text-[11px] text-zinc-400 mt-1">PNG, SVG или JPG до 2 МБ. Отображается в шапке отчётов.</p>
      </div>
    </div>
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <UiField label="Название компании" req><UInput v-model="form.name" required placeholder="ООО «Альфа»" /></UiField>
    <UiField label="ИНН" req hint="10 цифр — юрлицо, 12 — ИП">
      <UInput v-model="form.inn" required inputmode="numeric" placeholder="10 или 12 цифр" :aria-invalid="innBad || undefined" :input-class="innBad ? INVALID : ''" />
    </UiField>
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <UiField label="Город" req>
      <UInput v-model="form.city" required :list="cityList" placeholder="Москва" />
      <datalist :id="cityList"><option v-for="c in CITIES" :key="c" :value="c" /></datalist>
    </UiField>
    <UiField v-if="can('finance.fee.view')" label="Часовая ставка, ₽/ч" req hint="Используется для расчёта чека и маржи">
      <UInput v-model="form.rate" type="number" required min="500" step="100" placeholder="2 500" :aria-invalid="rateBad || undefined" :input-class="rateBad ? INVALID : ''" />
    </UiField>
  </div>
  <div class="pt-1 text-xs font-medium text-zinc-900">Контактное лицо</div>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <UiField label="Имя и фамилия" req><UInput v-model="form.contact" required placeholder="Сергей Волков" /></UiField>
    <UiField label="Должность" opt="опционально"><UInput v-model="form.post" placeholder="Директор по маркетингу" /></UiField>
  </div>
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <UiField label="Email" req><UInput v-model="form.email" type="email" required placeholder="name@company.ru" /></UiField>
    <UiField label="Телефон" opt="опционально"><UInput v-model="form.phone" type="tel" placeholder="+7 900 000-00-00" /></UiField>
  </div>
  <UiField label="Шаблон брифа" hint="Этот бриф клиент получит по ссылке или в портале">
    <USelect v-model="form.brief" :options="briefOptions" />
  </UiField>
</template>
