<script setup lang="ts">
// Кнопка-действие шаблона с data-roles прототипа: без права остаётся в DOM, disabled, с подсказкой на обёртке.
defineOptions({ inheritAttrs: false })
defineProps<{ allowed: boolean; tip: string; block?: boolean }>()
defineEmits<{ click: [e: MouseEvent] }>()
</script>

<template>
  <AccessGate :allowed="allowed" :tip="tip" :block="block">
    <button
      type="button"
      v-bind="$attrs"
      :disabled="!allowed"
      :data-deny-tip="allowed ? undefined : tip"
      class="disabled:opacity-50 disabled:cursor-not-allowed"
      @click="$emit('click', $event)"
    ><slot /></button>
  </AccessGate>
</template>
