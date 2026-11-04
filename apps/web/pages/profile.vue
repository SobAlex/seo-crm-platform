<script setup lang="ts">
// profile.html → Сетка 3 (Form): основные данные, безопасность, уведомления, сессии.
import type { Role } from '@crm/access'

definePageMeta({ roles: ['owner', 'seo_head', 'mgr_head', 'pm', 'employee', 'contractor', 'client'] })
useHead({ title: 'Мой профиль — SEO Control' })

const { role, user, roleLabel } = useRole()
const auth = useAuth()
const notify = useNotify()

const EMAILS: Record<Role, string> = {
  owner: 'owner@romashka.ru',
  seo_head: 'i.sidorov@romashka.ru',
  mgr_head: 'o.vetrova@romashka.ru',
  account_manager: 'n.morozov@romashka.ru',
  seo_specialist: 'a.petrov@romashka.ru',
  contractor: 'm.kim@contractor.ru',
  client: 'e.krylova@holod.ru'
}

const session = computed(() => auth.user.value)
const initials = computed(() => (session.value ? personInitials(session.value) : user.value.initials))
const name = ref(session.value ? personName(session.value) : user.value.name)
const email = ref(session.value?.email ?? EMAILS[role.value])
const phone = ref(session.value ? (session.value.phone ?? '') : '+7 (999) 000-11-22')
const telegram = ref(session.value ? (session.value.telegram ?? '') : '@alex_smirnov')
const touched = { name: false, email: false }

// Смена роли в демо-переключателе подставляет данные нового человека, пока поле не трогали.
watch(role, () => {
  const current = auth.user.value
  if (!touched.name) name.value = current ? personName(current) : user.value.name
  if (!touched.email) email.value = current?.email ?? EMAILS[role.value]
  if (current) {
    phone.value = current.phone ?? ''
    telegram.value = current.telegram ?? ''
  }
})

const showSettingsHint = computed(() => role.value !== 'client' && role.value !== 'contractor')

const photoInput = ref<HTMLInputElement | null>(null)
function onPhoto(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files?.[0]) return
  notify('Фото профиля обновлено')
  input.value = ''
}

const pwd = ref({ current: '', next: '', repeat: '' })
function updatePassword() {
  const p = pwd.value
  if (!p.current) return notify('Введите текущий пароль', 'error')
  if (p.next.length < 8) return notify('Новый пароль — не менее 8 символов', 'error')
  if (p.next !== p.repeat) return notify('Пароли не совпадают', 'error')
  pwd.value = { current: '', next: '', repeat: '' }
  notify('Пароль успешно изменён')
}

const notifications = ref([
  { label: 'Назначали исполнителем задачи', email: true, telegram: true },
  { label: 'Задачу вернули на доработку', email: true, telegram: true },
  { label: 'Готов отчёт за месяц', email: true, telegram: false },
  { label: 'Ежедневная сводка дедлайнов в 09:00', email: true, telegram: true }
])

async function logout() {
  notify('Вы вышли из системы', 'info')
  await auth.logout({ redirect: false })
  setTimeout(() => navigateTo('/login'), 700)
}
</script>

<template>
  <PageForm title="Мой профиль" :back="{ to: homeFor(role), label: 'Назад' }">
    <template #actions>
      <UButton @click="notify('Профиль обновлён')">Сохранить изменения</UButton>
    </template>

    <section class="bg-white rounded-2xl shadow-card p-6 space-y-4">
      <h2 class="text-sm font-semibold tracking-tight text-zinc-900">Основные данные</h2>
      <div class="flex flex-col sm:flex-row sm:items-center gap-4">
        <img v-if="session?.avatar" :src="session.avatar" alt="" class="w-20 h-20 rounded-full object-cover shrink-0">
        <span v-else class="w-20 h-20 rounded-full bg-zinc-900 text-white text-xl font-semibold flex items-center justify-center shrink-0"><span>{{ initials }}</span></span>
        <div class="flex flex-wrap items-center gap-2">
          <UButton color="white" class="rounded-full text-sm" @click="photoInput?.click()">Сменить фото</UButton>
          <input ref="photoInput" type="file" accept="image/png,image/jpeg" class="hidden" @change="onPhoto">
          <UButton color="gray" variant="ghost" class="rounded-full text-sm text-zinc-500 hover:text-red-600 hover:bg-red-50" @click="notify('Фото профиля удалено')">Удалить</UButton>
          <p class="w-full text-xs text-zinc-400">PNG или JPG, до 5 МБ</p>
        </div>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UiField label="Имя и фамилия" class="sm:col-span-2"><UInput v-model="name" @update:model-value="touched.name = true" /></UiField>
        <div class="sm:col-span-2">
          <label class="block text-xs font-medium text-zinc-500 mb-2">Системная роль</label>
          <div class="flex flex-wrap items-center gap-2">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium" :class="user.badge">{{ roleLabel }}</span>
            <span class="text-xs text-zinc-500 leading-relaxed">{{ user.desc }}</span>
          </div>
        </div>
        <UiField label="Рабочий Email"><UInput v-model="email" type="email" @update:model-value="touched.email = true" /></UiField>
        <UiField label="Телефон"><UInput v-model="phone" type="tel" input-class="tabular-nums" /></UiField>
        <div class="sm:col-span-2">
          <label class="block text-xs font-medium text-zinc-500 mb-2">Ник в Telegram</label>
          <UInput v-model="telegram" placeholder="@username" />
          <p class="text-xs text-zinc-400 mt-1.5">Нужен для уведомлений бота SEO Control</p>
        </div>
      </div>
    </section>

    <section class="bg-white rounded-2xl shadow-card p-6 space-y-4">
      <h2 class="text-sm font-semibold tracking-tight text-zinc-900">Безопасность</h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UiField label="Текущий пароль" class="sm:col-span-2"><UInput v-model="pwd.current" type="password" autocomplete="current-password" placeholder="••••••••" /></UiField>
        <UiField label="Новый пароль"><UInput v-model="pwd.next" type="password" autocomplete="new-password" placeholder="Не менее 8 символов" /></UiField>
        <UiField label="Повтор нового пароля"><UInput v-model="pwd.repeat" type="password" autocomplete="new-password" placeholder="Повторите новый пароль" /></UiField>
      </div>
      <UButton color="white" @click="updatePassword">Обновить пароль</UButton>
    </section>

    <section class="bg-white rounded-2xl shadow-card p-6 space-y-4">
      <div>
        <h2 class="text-sm font-semibold tracking-tight text-zinc-900">Уведомления</h2>
        <p class="text-xs text-zinc-500 mt-1">Куда слать персональные оповещения</p>
      </div>
      <ul class="divide-y divide-zinc-100 -mx-6">
        <ProfileNotifyRow v-for="n in notifications" :key="n.label" v-model:email="n.email" v-model:telegram="n.telegram" :label="n.label" />
      </ul>
    </section>

    <section class="bg-white rounded-2xl shadow-card p-6 space-y-4">
      <h2 class="text-sm font-semibold tracking-tight text-zinc-900">Сессии</h2>
      <div class="rounded-2xl bg-zinc-50 border border-zinc-100 px-4 py-3 text-sm text-zinc-600">
        <div class="font-medium text-ink">Текущая сессия</div>
        <p class="text-xs text-zinc-500 mt-1">Chrome на macOS · Москва · IP 188.130.xxx.xx · активна сейчас</p>
      </div>
      <UButton color="white" class="rounded-full text-sm border-red-200 text-red-600 hover:bg-red-50 hover:border-red-200" @click="logout">Выйти из аккаунта</UButton>
    </section>

    <p v-if="showSettingsHint" class="text-xs text-zinc-400 text-center pb-2">
      Настройки компании (тариф, интеграции, роли) — в разделе
      <NuxtLink to="/settings" class="text-accent hover:underline">Настройки компании</NuxtLink>
    </p>
  </PageForm>
</template>
