<script setup lang="ts">
// Карточки ролей ([data-role-cards] в renderMatrix() прототипа).
import { ROLES, ROLE_INFO } from '@crm/access'
import { DEMO_USERS } from '~/composables/useRole'
</script>

<template>
  <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <li v-for="r in ROLES" :key="r" class="rounded-2xl bg-white shadow-card p-4">
      <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" :class="DEMO_USERS[r].badge">{{ ROLE_INFO[r].name }}</span>
      <p class="text-sm text-zinc-600 mt-2">{{ DEMO_USERS[r].desc }}</p>
    </li>
  </ul>
</template>
