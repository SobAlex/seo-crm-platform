<script setup lang="ts">
// Поле формы прототипа (field() в assets/modals.js): подпись, «*» для обязательного, «— необязательно», подсказка.
defineProps<{
  label: string
  req?: boolean
  /** Пометка «— можно позже» и т. п. */
  opt?: string
  hint?: string
  for?: string
}>()
</script>

<template>
  <div>
    <label class="block text-xs font-medium text-zinc-500 mb-2" :for="$props.for">{{ label }}<template v-if="req"> <span class="text-red-500">*</span></template><template v-if="opt"> <span class="font-normal">— {{ opt }}</span></template></label>
    <slot />
    <div v-if="hint || $slots.hint" class="text-xs text-zinc-500 mt-1.5"><slot name="hint">{{ hint }}</slot></div>
  </div>
</template>
