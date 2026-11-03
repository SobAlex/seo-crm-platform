<script setup lang="ts">
// Модалка-шит прототипа (buildModal в assets/app.js) на UModal из Nuxt UI.
// Шапка с заголовком и крестиком, тело с прокруткой, футер «Отмена» + основное действие.
// Перед submit проверяет [required] поля в теле; ⌘/Ctrl+Enter — отправить, Esc и оверлей — закрыть.
const props = withDefaults(defineProps<{
  modelValue: boolean
  title: string
  subtitle?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  /** Подпись основной кнопки; false — без неё. */
  submit?: string | false
  cancel?: string
  danger?: boolean
  footerNote?: string
  /** Тост после успешной отправки; false — без тоста. */
  submitToast?: string | false
  /** Основная кнопка недоступна роли: disabled + подсказка. */
  submitAllowed?: boolean
  submitTip?: string
  /** Не закрывать окно после submit — родитель закроет сам. */
  manual?: boolean
}>(), {
  subtitle: undefined,
  size: 'md',
  submit: 'Сохранить',
  cancel: 'Отмена',
  danger: false,
  footerNote: undefined,
  submitToast: 'Сохранено',
  submitAllowed: true,
  submitTip: undefined,
  manual: false
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  submit: []
}>()

const notify = useNotify()
const body = ref<HTMLElement | null>(null)

const WIDTH = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-3xl' } as const
const INVALID = ['!border-red-400', 'ring-4', 'ring-red-100']

const open = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

function invalidFields(): HTMLInputElement[] {
  if (!body.value) return []
  return Array.from(body.value.querySelectorAll<HTMLInputElement>('[required]')).filter(f => {
    if (f.disabled || f.closest('.hidden')) return false
    if (f.type === 'checkbox') return !f.checked
    const v = String(f.value || '').trim()
    if (!v) return true
    if (f.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)) return true
    return false
  })
}

function clearInvalid() {
  body.value?.querySelectorAll('[aria-invalid]').forEach(f => {
    f.removeAttribute('aria-invalid')
    INVALID.forEach(c => f.classList.remove(c))
  })
}

function onSubmit() {
  if (!props.submitAllowed) return
  clearInvalid()
  const bad = invalidFields()
  if (bad.length) {
    bad.forEach(f => {
      f.setAttribute('aria-invalid', 'true')
      INVALID.forEach(c => f.classList.add(c))
    })
    bad[0]!.focus()
    notify(bad.some(f => String(f.value || '').trim()) ? 'Проверьте выделенные поля' : 'Заполните обязательные поля')
    return
  }
  emit('submit')
  if (props.manual) return
  open.value = false
  if (props.submitToast) notify(props.submitToast)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && props.submit !== false) {
    e.preventDefault()
    onSubmit()
  }
}

watch(open, v => {
  if (!v) return
  nextTick(() => {
    clearInvalid()
    const field = body.value?.querySelector<HTMLElement>('input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([disabled]), select:not([disabled]), textarea:not([disabled])')
    field?.focus()
  })
})
</script>

<template>
  <UModal v-model="open" :ui="{ width: `w-full ${WIDTH[size]}` }">
    <div class="flex flex-col max-h-[90vh] min-h-0" @keydown="onKeydown" @input="clearInvalid">
      <div class="px-6 py-4 border-b border-black/5 flex items-center justify-between gap-3 shrink-0">
        <div class="min-w-0">
          <h3 class="text-sm font-semibold tracking-tight text-ink truncate">{{ title }}</h3>
          <p v-if="subtitle" class="text-xs text-zinc-500 mt-0.5 truncate">{{ subtitle }}</p>
        </div>
        <button type="button" aria-label="Закрыть" class="h-7 w-7 shrink-0 rounded-full text-zinc-400 hover:text-zinc-600 hover:bg-black/5 flex items-center justify-center transition" @click="open = false">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <div ref="body" class="p-6 space-y-4 max-h-[75vh] overflow-y-auto min-h-0">
        <slot />
      </div>
      <div class="px-6 py-3.5 bg-zinc-50/70 border-t border-black/5 flex flex-col-reverse sm:flex-row gap-2.5 sm:items-center sm:justify-end shrink-0">
        <div v-if="footerNote || $slots.note" class="text-xs text-zinc-500 sm:mr-auto"><slot name="note">{{ footerNote }}</slot></div>
        <slot name="footer">
          <UButton color="white" @click="open = false">{{ cancel }}</UButton>
          <AccessGate v-if="submit !== false" :allowed="submitAllowed" :tip="submitTip">
            <UButton :color="danger ? 'red' : 'primary'" :disabled="!submitAllowed" @click="onSubmit">{{ submit }}</UButton>
          </AccessGate>
        </slot>
      </div>
    </div>
  </UModal>
</template>
