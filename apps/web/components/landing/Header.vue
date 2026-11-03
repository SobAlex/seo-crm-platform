<script setup lang="ts">
// Липкая шапка сайта: логотип, якорное меню, вход и триал; на мобильном — раскрывающееся меню.
defineEmits<{ signup: [] }>()

const NAV = [
  { href: '#features', label: 'Возможности' },
  { href: '#how', label: 'Как это работает' },
  { href: '#pricing', label: 'Тарифы' },
  { href: '#faq', label: 'FAQ' }
]

const navOpen = ref(false)
</script>

<template>
  <header class="sticky top-0 z-40 bg-canvas/80 backdrop-blur-xl border-b border-black/5">
    <div class="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
      <NuxtLink to="/landing" class="flex items-center gap-2.5 shrink-0">
        <span class="w-8 h-8 rounded-xl bg-zinc-900 text-white text-sm font-semibold flex items-center justify-center">S</span>
        <span class="text-sm font-semibold tracking-tight">SEO Control</span>
      </NuxtLink>
      <nav class="hidden md:flex items-center gap-6 text-sm text-zinc-500 ml-4">
        <a v-for="item in NAV" :key="item.href" :href="item.href" class="hover:text-zinc-900 transition">{{ item.label }}</a>
      </nav>
      <div class="ml-auto flex items-center gap-2">
        <UButton to="/login" color="white" variant="ghost" size="xs" class="hidden sm:inline-flex px-3.5 rounded-full text-sm">Войти в кабинет</UButton>
        <UButton size="xs" class="px-3.5 rounded-full text-sm" @click="$emit('signup')">Попробовать бесплатно 14 дней</UButton>
        <UButton color="white" variant="ghost" square aria-label="Меню" class="md:hidden rounded-full" :aria-expanded="navOpen" @click="navOpen = !navOpen">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M4 7h16M4 12h16M4 17h16" /></svg>
        </UButton>
      </div>
    </div>
    <nav v-show="navOpen" class="md:hidden border-t border-black/5 px-4 py-3 flex flex-col gap-1 text-sm">
      <a v-for="item in NAV" :key="item.href" :href="item.href" class="px-3 py-2 rounded-xl hover:bg-black/5" @click="navOpen = false">{{ item.label }}</a>
      <NuxtLink to="/login" class="px-3 py-2 rounded-xl hover:bg-black/5" @click="navOpen = false">Войти в кабинет</NuxtLink>
    </nav>
  </header>
</template>
