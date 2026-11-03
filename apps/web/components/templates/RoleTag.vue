<script setup lang="ts">
// Тег исполнителя работы (roleTag в templates.html): pill в картах, мелкий в строках месячного плана.
import { ROLE_LABEL, type WorkRole } from '~/types/templates'

defineProps<{ role: WorkRole; small?: boolean }>()

const CLS: Record<WorkRole, string> = {
  seo: 'bg-emerald-50 text-emerald-700',
  pm: 'bg-amber-50 text-amber-700',
  contractor: 'bg-zinc-100 text-zinc-700'
}
</script>

<template>
  <span
    v-if="small"
    class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium whitespace-nowrap shrink-0"
    :class="CLS[role]"
  >{{ ROLE_LABEL[role] }}</span>
  <span
    v-else
    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap"
    :class="CLS[role]"
  >{{ ROLE_LABEL[role] }}</span>
</template>
