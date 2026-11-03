<script setup lang="ts">
// Обёртка недоступного действия: у disabled-кнопки браузер не показывает title, поэтому подсказку несёт обёртка.
// Сам элемент внутри по-прежнему получает :disabled="!can(...)" и остаётся в DOM.
const props = withDefaults(defineProps<{ allowed: boolean; tip?: string; block?: boolean }>(), {
  tip: DENY_TIP,
  block: false
})
</script>

<template>
  <span v-if="props.allowed" class="contents"><slot /></span>
  <span
    v-else
    :title="props.tip"
    :data-deny-tip="props.tip"
    data-deny-wrap
    class="cursor-not-allowed [&>*]:pointer-events-none"
    :class="props.block ? 'flex w-full' : 'inline-flex max-w-full'"
  ><slot /></span>
</template>
