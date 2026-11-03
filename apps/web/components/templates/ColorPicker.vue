<script setup lang="ts">
// «Цвет маркера» типа проекта ([data-color] в templates.html): выбранный кружок с кольцом.
import { TYPE_COLORS, type TypeColor } from '~/types/templates'

defineProps<{ modelValue: TypeColor }>()
defineEmits<{ 'update:modelValue': [value: TypeColor] }>()
</script>

<template>
  <div class="flex items-center gap-2" role="radiogroup" aria-label="Цвет маркера">
    <button
      v-for="c in TYPE_COLORS"
      :key="c"
      type="button"
      role="radio"
      :aria-checked="c === modelValue"
      aria-label="Цвет"
      class="w-7 h-7 rounded-full"
      :class="c === modelValue && 'ring-2 ring-zinc-900 ring-offset-2'"
      @click="$emit('update:modelValue', c)"
    ><TemplatesTypeDot :color="c" class="block w-7 h-7" /></button>
  </div>
</template>
