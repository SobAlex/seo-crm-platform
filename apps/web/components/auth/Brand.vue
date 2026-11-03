<script setup lang="ts">
// Шапка карточки входа/регистрации: логотип «S», название продукта, заголовок экрана.
defineProps<{
  title: string
  subtitle: string
}>()
</script>

<template>
  <div class="flex flex-col items-center text-center">
    <span class="w-12 h-12 rounded-2xl bg-zinc-900 text-white text-lg font-semibold flex items-center justify-center shadow-sm">S</span>
    <div class="mt-3 text-sm font-semibold tracking-tight">SEO Control</div>
    <h1 class="mt-4 text-xl font-semibold tracking-tight text-ink">{{ title }}</h1>
    <p class="mt-1 text-sm text-zinc-500">{{ subtitle }}</p>
  </div>
</template>
