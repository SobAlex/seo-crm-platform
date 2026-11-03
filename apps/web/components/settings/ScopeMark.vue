<script setup lang="ts">
// Ячейка матрицы: mark() из renderMatrix() прототипа, но по scope из @crm/access.
import { SCOPE_DESCRIPTION, type Scope } from '@crm/access'

defineProps<{
  scope: Scope
  short: Record<Exclude<Scope, 'workspace' | 'deny'>, string>
}>()
</script>

<template>
  <span v-if="scope === 'workspace'" class="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 align-middle" aria-label="Разрешено" :title="SCOPE_DESCRIPTION.workspace" />
  <span v-else-if="scope === 'deny'" class="text-zinc-300" aria-label="Запрещено">—</span>
  <span v-else class="text-xs font-medium text-amber-700" :title="SCOPE_DESCRIPTION[scope]">{{ short[scope] }}</span>
</template>
