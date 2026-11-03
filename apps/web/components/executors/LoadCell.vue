<script setup lang="ts">
// Ячейка «Загрузка · июнь»: часы, процент, мини-бар и пометка (перегруз, отпуск).
defineProps<{
  hours: number
  pct: number
  cap: number
  over?: boolean
  note?: string
}>()
</script>

<template>
  <div class="min-w-0 w-40">
    <div class="flex items-center gap-1.5">
      <span class="text-sm font-semibold tabular-nums text-zinc-900">{{ hours }} ч</span>
      <span class="text-xs font-semibold tabular-nums" :class="over ? 'text-red-600' : 'text-emerald-600'">{{ pct }}%</span>
      <span class="ml-auto w-12 h-1 rounded-full bg-zinc-100 overflow-hidden shrink-0" role="progressbar" aria-label="Загрузка" :aria-valuenow="pct" aria-valuemin="0" aria-valuemax="100"><span class="block h-full rounded-full" :class="over ? 'bg-red-500' : 'bg-emerald-500'" :style="{ width: Math.min(100, pct) + '%' }" /></span>
    </div>
    <div class="text-xs text-zinc-400 mt-0.5">из {{ cap }} ч/мес<template v-if="note"> · <span :class="over ? 'text-red-600 font-medium' : 'text-zinc-500'">{{ note }}</span></template></div>
  </div>
</template>
