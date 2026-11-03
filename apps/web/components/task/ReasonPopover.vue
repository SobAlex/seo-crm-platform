<script setup lang="ts">
// Микро-попап «Вернуть на доработку» у кнопки (SEOApp.askReason прототипа).
// ask(anchor, opts) → Promise: текст причины или null при отмене (Esc, клик мимо, «Отмена»).
import type { ReasonOptions } from '~/types/task'

const notify = useNotify()

const open = ref(false)
const opts = ref<ReasonOptions>({})
const text = ref('')
const invalid = ref(false)
const pos = ref({ left: -9999, top: -9999 })
const root = ref<HTMLElement | null>(null)
let resolver: ((v: string | null) => void) | null = null

const okLabel = computed(() => opts.value.ok || 'Вернуть')

function field(): HTMLTextAreaElement | null {
  return root.value?.querySelector('textarea') ?? null
}

function place(anchor: HTMLElement) {
  const el = root.value
  if (!el) return
  const r = anchor.getBoundingClientRect()
  const w = el.offsetWidth
  const h = el.offsetHeight
  let top = r.bottom + 8
  if (top + h > innerHeight - 12) top = Math.max(12, r.top - h - 8)
  pos.value = { left: Math.min(Math.max(12, r.right - w), innerWidth - w - 12), top }
}

function outside(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) done(null)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') { e.stopPropagation(); done(null) }
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); ok() }
}

function done(v: string | null) {
  open.value = false
  document.removeEventListener('mousedown', outside, true)
  document.removeEventListener('keydown', onKey, true)
  const r = resolver
  resolver = null
  r?.(v)
}

function ok() {
  const v = text.value.trim()
  if (!v) {
    invalid.value = true
    field()?.focus()
    notify('Напишите, что нужно исправить', 'error')
    return
  }
  invalid.value = false
  done(v)
}

watch(text, v => { if (v.trim()) invalid.value = false })

function ask(anchor: HTMLElement, o: ReasonOptions = {}): Promise<string | null> {
  if (resolver) done(null)
  opts.value = o
  text.value = ''
  invalid.value = false
  pos.value = { left: -9999, top: -9999 }
  open.value = true
  const result = new Promise<string | null>(r => { resolver = r })
  nextTick(() => {
    place(anchor)
    field()?.focus()
  })
  setTimeout(() => document.addEventListener('mousedown', outside, true))
  document.addEventListener('keydown', onKey, true)
  return result
}

onBeforeUnmount(() => { if (resolver) done(null) })

defineExpose({ ask })
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      ref="root"
      role="dialog"
      :aria-label="opts.title || 'Вернуть на доработку'"
      class="fixed z-[65] w-[min(320px,calc(100vw-24px))] p-3 rounded-2xl bg-white/95 backdrop-blur-xl shadow-pop ring-1 ring-black/5"
      :style="{ left: pos.left + 'px', top: pos.top + 'px' }"
    >
      <div class="text-sm font-semibold tracking-tight">{{ opts.title || 'Вернуть на доработку' }}</div>
      <div v-if="opts.sub" class="text-xs text-zinc-500 mt-0.5 truncate">{{ opts.sub }}</div>
      <label class="mt-2 block text-xs font-medium text-zinc-500">Комментарий <span class="text-red-500">*</span> <span class="font-normal text-zinc-400">— обязательно</span></label>
      <UTextarea
        v-model="text"
        :rows="3"
        :resize="false"
        required
        aria-required="true"
        aria-label="Что исправить"
        :aria-invalid="invalid ? 'true' : undefined"
        :color="invalid ? 'red' : 'white'"
        :placeholder="opts.placeholder || 'Что исправить — исполнитель увидит это в задаче'"
        class="mt-1.5"
      />
      <p v-if="invalid" class="mt-1 text-[11px] text-red-600">Напишите, что нужно исправить — без комментария вернуть нельзя</p>
      <div class="mt-2 flex items-center justify-end gap-2">
        <span class="mr-auto text-[11px] text-zinc-400">⌘↵ — {{ okLabel.toLowerCase() }}</span>
        <UButton color="white" variant="ghost" size="xs" class="rounded-full" @click="done(null)">Отмена</UButton>
        <UButton color="amber" size="xs" class="rounded-full" @click="ok">{{ okLabel }}</UButton>
      </div>
    </div>
  </Teleport>
</template>
