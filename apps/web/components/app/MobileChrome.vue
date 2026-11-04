<script setup lang="ts">
import { BOTTOM, NAV, isActive } from '~/constants/nav'

const route = useRoute()
const { role, user } = useRole()
const auth = useAuth()
const open = useState('sidebar-open', () => false)
const initials = computed(() => (auth.user.value ? personInitials(auth.user.value) : user.value.initials))

const bottom = computed(() =>
  role.value === 'client' ? [] : NAV.filter(i => BOTTOM.includes(i.id) && i.roles.includes(role.value))
)
</script>

<template>
  <header data-mobile-header class="lg:hidden sticky top-0 z-30 bg-canvas/80 backdrop-blur-xl border-b border-black/5 px-4 h-14 flex items-center justify-between">
    <button type="button" aria-label="Открыть меню" class="w-10 h-10 -ml-2 rounded-full active:bg-black/5 flex items-center justify-center" @click="open = true">
      <AppIcon name="menu" class="w-5 h-5 text-zinc-800" />
    </button>
    <NuxtLink :to="homeFor(role)" class="text-sm font-semibold tracking-tight">{{ COMPANY.name }}</NuxtLink>
    <button type="button" aria-label="Профиль и роль" class="w-8 h-8 rounded-full bg-zinc-900 text-white text-[10px] font-semibold flex items-center justify-center" @click="open = true">{{ initials }}</button>
  </header>

  <nav v-if="bottom.length" data-bottom-nav aria-label="Быстрая навигация" class="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/80 backdrop-blur-xl border-t border-black/5 pb-[env(safe-area-inset-bottom)] flex">
    <NuxtLink
      v-for="item in bottom"
      :key="item.id"
      :to="item.to"
      class="flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition"
      :class="isActive(item, route.path) ? 'text-accent' : 'text-zinc-500'"
    >
      <AppIcon :name="item.icon" class="w-6 h-6" /><span>{{ item.label }}</span>
    </NuxtLink>
    <button type="button" class="flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium text-zinc-500" @click="open = true">
      <AppIcon name="menu" class="w-6 h-6" /><span>Меню</span>
    </button>
  </nav>
</template>
