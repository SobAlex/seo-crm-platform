<script setup lang="ts">
// Сайдбар консоли платформы (#side в superadmin.html): якоря разделов, сайт продукта, возврат в кабинет.
const open = defineModel<boolean>('open', { default: false })

const route = useRoute()
const NAV = [
  { to: '#metrics', label: 'Сводка' },
  { to: '#companies', label: 'Компании' },
  { to: '#payments', label: 'Платежи' },
  { to: '#sandbox', label: 'Песочница' }
]
const active = computed(() => route.hash || '#metrics')
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" @click="open = false" />
  <aside class="fixed inset-y-0 left-0 z-50 w-64 lg:translate-x-0 transition-transform duration-300 bg-white/90 backdrop-blur-2xl border-r border-black/5 flex flex-col" :class="open ? 'translate-x-0' : '-translate-x-full'">
    <div class="px-4 pt-4 pb-3 flex items-center justify-between">
      <NuxtLink to="/superadmin" class="flex items-center gap-2.5 min-w-0" @click="open = false">
        <span class="w-8 h-8 rounded-xl bg-zinc-900 text-white text-sm font-semibold flex items-center justify-center shrink-0">S</span>
        <span class="min-w-0"><span class="block text-sm font-semibold tracking-tight">SEO Control</span><span class="block text-[11px] text-zinc-500">Платформа</span></span>
      </NuxtLink>
      <button type="button" aria-label="Закрыть меню" class="lg:hidden w-8 h-8 rounded-full hover:bg-black/5" @click="open = false">×</button>
    </div>
    <div class="px-4 pb-3">
      <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 text-white text-[11px] font-medium">SuperAdmin Platform</span>
    </div>
    <nav class="px-3 flex flex-col gap-0.5 text-sm">
      <a
        v-for="item in NAV"
        :key="item.to"
        :href="item.to"
        class="px-3 py-2 rounded-xl"
        :class="active === item.to ? 'text-zinc-900 bg-black/5 font-medium' : 'text-zinc-600 hover:bg-black/5'"
        @click="open = false"
      >{{ item.label }}</a>
      <NuxtLink to="/landing" class="px-3 py-2 rounded-xl text-zinc-600 hover:bg-black/5" @click="open = false">Сайт продукта</NuxtLink>
    </nav>
    <div class="mt-auto p-3 border-t border-black/5">
      <NuxtLink to="/" class="flex items-center justify-center px-3 py-2 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition"><span class="sm:hidden">В кабинет</span><span class="hidden sm:inline">В кабинет агентства</span></NuxtLink>
    </div>
  </aside>
</template>
