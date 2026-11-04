<script setup lang="ts">
// Каркас приложения: сайдбар w-64, мобильная шапка и нижняя навигация, контент.
// definePageMeta({ roles: [...] }) на странице — как data-roles у data-app-chrome прототипа: чужой роли «Нет доступа».
const router = useRouter()
const { role, roleLabel, hasRole } = useRole()

const denied = computed(() => {
  const allowed = router.currentRoute.value.meta.roles as string[] | undefined
  return !!allowed && !hasRole(allowed)
})
</script>

<template>
  <div class="min-h-screen overflow-x-hidden">
    <AppMobileChrome />
    <AppSidebar />

    <div class="flex">
      <main class="flex-1 min-w-0 lg:pl-[calc(16rem+2rem)] px-4 lg:px-8 pt-6 pb-24 lg:pb-20 space-y-6">
        <div v-if="denied" class="min-h-[70vh] flex items-center justify-center px-6">
          <div class="text-center max-w-sm">
            <span class="mx-auto mb-5 w-14 h-14 rounded-full bg-black/5 text-zinc-500 flex items-center justify-center"><AppIcon name="lock" class="w-6 h-6" /></span>
            <h1 class="text-xl font-semibold tracking-tight mb-2">Нет доступа</h1>
            <p class="text-sm text-zinc-500 mb-6">Раздел недоступен для роли «{{ roleLabel }}». Права задаются матрицей разрешений в «Настройки компании → Роли и доступ».</p>
            <UButton :to="homeFor(role)">На главную</UButton>
          </div>
        </div>
        <slot v-else />
      </main>
    </div>

    <UiConfirmHost />
  </div>
</template>
