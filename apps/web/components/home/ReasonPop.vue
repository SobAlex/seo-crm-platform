<script setup lang="ts">
// Микро-попап «На доработку» у кнопки (SEOApp.askReason): обязательный комментарий, ⌘↵ — подтвердить, Esc / клик мимо — отмена.
const props = withDefaults(defineProps<{
  /** Кнопка, у которой открыт попап; null — закрыт. */
  anchor: HTMLElement | null
  title?: string
  sub?: string
  placeholder?: string
  ok?: string
}>(), {
  title: 'Вернуть на доработку',
  sub: undefined,
  placeholder: 'Что исправить — исполнитель увидит это в задаче',
  ok: 'Вернуть'
})

const emit = defineEmits<{ resolve: [reason: string | null] }>()
const notify = useNotify()

const el = ref<HTMLElement | null>(null)
const reason = ref('')
const invalid = ref(false)
const pos = ref({ left: 0, top: 0 })

function place() {
  const a = props.anchor
  const box = el.value
  if (!a || !box) return
  const r = a.getBoundingClientRect()
  const w = box.offsetWidth
  const h = box.offsetHeight
  let top = r.bottom + 8
  if (top + h > innerHeight - 12) top = Math.max(12, r.top - h - 8)
  pos.value = { left: Math.min(Math.max(12, r.right - w), innerWidth - w - 12), top }
  box.querySelector('textarea')?.focus()
}

function done(v: string | null) {
  emit('resolve', v)
}

function submit() {
  const v = reason.value.trim()
  if (!v) {
    invalid.value = true
    el.value?.querySelector('textarea')?.focus()
    notify('Напишите, что нужно исправить', 'error')
    return
  }
  invalid.value = false
  done(v)
}

function outside(e: MouseEvent) {
  if (el.value && !el.value.contains(e.target as Node)) done(null)
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.stopPropagation()
    done(null)
  }
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    submit()
  }
}

function bind(on: boolean) {
  if (!import.meta.client) return
  document.removeEventListener('mousedown', outside, true)
  document.removeEventListener('keydown', onKey, true)
  if (!on) return
  setTimeout(() => document.addEventListener('mousedown', outside, true))
  document.addEventListener('keydown', onKey, true)
}

watch(() => props.anchor, a => {
  reason.value = ''
  invalid.value = false
  bind(!!a)
  if (a) nextTick(place)
})
watch(reason, v => { if (v.trim()) invalid.value = false })
onBeforeUnmount(() => bind(false))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="anchor"
      ref="el"
      role="dialog"
      :aria-label="title"
      class="fixed z-[65] w-[min(320px,calc(100vw-24px))] p-3 rounded-2xl bg-white/95 backdrop-blur-xl shadow-pop ring-1 ring-black/5"
      :style="{ left: pos.left + 'px', top: pos.top + 'px' }"
    >
      <div class="text-sm font-semibold tracking-tight">{{ title }}</div>
      <div v-if="sub" class="text-xs text-zinc-500 mt-0.5 truncate">{{ sub }}</div>
      <label class="mt-2 block text-xs font-medium text-zinc-500">Комментарий <span class="text-red-500">*</span> <span class="font-normal text-zinc-400">— обязательно</span></label>
      <UTextarea
        v-model="reason"
        :rows="3"
        required
        aria-required="true"
        aria-label="Что исправить"
        :aria-invalid="invalid ? 'true' : undefined"
        :placeholder="placeholder"
        class="mt-1.5"
        :textarea-class="invalid ? '!border-red-400 ring-2 ring-red-200' : ''"
      />
      <p v-if="invalid" class="mt-1 text-[11px] text-red-600">Напишите, что нужно исправить — без комментария вернуть нельзя</p>
      <div class="mt-2 flex items-center justify-end gap-2">
        <span class="mr-auto text-[11px] text-zinc-400">⌘↵ — {{ ok.toLowerCase() }}</span>
        <button type="button" class="px-3 py-1.5 rounded-full text-sm text-zinc-500 hover:text-zinc-900 hover:bg-black/5 transition" @click="done(null)">Отмена</button>
        <button type="button" class="px-3.5 py-1.5 rounded-full bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition" @click="submit">{{ ok }}</button>
      </div>
    </div>
  </Teleport>
</template>
