<script setup lang="ts">
// Переключатель месяца прототипа ([data-month-nav]). v-model — 'YYYY-MM'; min / max — границы в том же формате.
const props = defineProps<{ modelValue: string; min?: string; max?: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const key = (s: string) => {
  const [y, m] = s.split('-').map(Number)
  return y! * 12 + (m! - 1)
}
const cur = computed(() => key(props.modelValue))
const label = computed(() => `${MONTHS[cur.value % 12]} ${Math.floor(cur.value / 12)}`)
const canStep = (d: number) => {
  const k = cur.value + d
  return !(props.min && k < key(props.min)) && !(props.max && k > key(props.max))
}
function step(d: number) {
  if (!canStep(d)) return
  const k = cur.value + d
  emit('update:modelValue', `${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, '0')}`)
}
</script>

<template>
  <div class="flex items-center gap-2 shrink-0">
    <button type="button" aria-label="Предыдущий месяц" :disabled="!canStep(-1)" class="w-8 h-8 rounded-full bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50 flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed" @click="step(-1)">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
    </button>
    <div class="px-3 lg:px-4 py-1.5 rounded-full bg-white border border-zinc-200 text-sm font-medium tabular-nums whitespace-nowrap">{{ label }}</div>
    <button type="button" aria-label="Следующий месяц" :disabled="!canStep(1)" class="w-8 h-8 rounded-full bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50 flex items-center justify-center shrink-0 disabled:opacity-40 disabled:cursor-not-allowed" @click="step(1)">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg>
    </button>
  </div>
</template>
