<script setup lang="ts">
// Сегменты и табы прототипа ([data-segmented], .tab-btn): капсула bg-zinc-100, активный — белый с тенью.
import type { SegmentOption } from '~/types/ui'

const props = withDefaults(defineProps<{
  modelValue: string
  options: SegmentOption[]
  size?: 'sm' | 'md'
  /** Синхронизировать с location.hash, как табы прототипа. */
  hash?: boolean
  ariaLabel?: string
}>(), { size: 'sm', hash: false, ariaLabel: undefined })

const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function pick(o: SegmentOption) {
  if (o.disabled) return
  emit('update:modelValue', o.value)
  if (props.hash && import.meta.client) history.replaceState(history.state, '', '#' + o.value)
}

onMounted(() => {
  if (!props.hash) return
  const fromHash = location.hash.slice(1)
  const o = props.options.find(x => x.value === fromHash && !x.disabled)
  if (o && o.value !== props.modelValue) emit('update:modelValue', o.value)
})

const pad = computed(() => props.size === 'md' ? 'px-3 lg:px-4 py-1.5 text-xs lg:text-sm' : 'px-3 py-1 text-xs')
</script>

<template>
  <div class="inline-flex bg-zinc-100 rounded-full p-1 max-w-full overflow-x-auto no-scrollbar shrink-0" role="group" :aria-label="ariaLabel">
    <AccessGate v-for="o in options" :key="o.value" :allowed="!o.disabled || !o.tip" :tip="o.tip">
      <button
        type="button"
        :aria-pressed="o.value === modelValue"
        :disabled="o.disabled"
        class="rounded-full font-medium shrink-0 whitespace-nowrap transition disabled:opacity-50 disabled:cursor-not-allowed"
        :class="[pad, o.value === modelValue ? SEG_ON : SEG_OFF]"
        @click="pick(o)"
      >
        <slot name="option" :option="o" :active="o.value === modelValue">
          {{ o.label }}<span v-if="o.count !== undefined" class="ml-1 tabular-nums text-zinc-400">{{ o.count }}</span>
        </slot>
      </button>
    </AccessGate>
  </div>
</template>
