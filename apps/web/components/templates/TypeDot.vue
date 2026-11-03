<script setup lang="ts">
// Цветная точка-маркер типа проекта; размер задаётся классом снаружи.
import type { TypeColor } from '~/types/templates'

defineProps<{ color: TypeColor }>()

const DOT: Record<TypeColor, string> = {
  violet: 'bg-violet-600',
  emerald: 'bg-emerald-600',
  blue: 'bg-blue-600',
  amber: 'bg-amber-600',
  cyan: 'bg-cyan-600',
  rose: 'bg-rose-600'
}
</script>

<template>
  <span class="rounded-full shrink-0" :class="DOT[color]" />
</template>
