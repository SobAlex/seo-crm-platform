<script setup lang="ts">
import type { Role } from '@crm/access'
import { NAV, NAV_FOOT, isActive } from '~/constants/nav'

const route = useRoute()
const { role, user, roleLabel, roles, can, hasRole } = useRole()
const auth = useAuth()
const notify = useNotify()
const open = useState('sidebar-open', () => false)

const sessionName = computed(() => (auth.user.value ? personName(auth.user.value) : user.value.name))
const sessionEmail = computed(() => auth.user.value?.email ?? user.value.email)
const sessionInitials = computed(() => (auth.user.value ? personInitials(auth.user.value) : user.value.initials))
const sessionAvatar = computed(() => auth.user.value?.avatar ?? '')

const nav = computed(() => NAV.filter(i => i.roles.includes(role.value)))
const foot = computed(() => NAV_FOOT.filter(i => i.roles.includes(role.value)))
const roleOptions = computed(() => roles.map(r => ({ value: r, label: DEMO_ROLE_LABEL[r] })))

const DEMO_ROLE_LABEL: Record<Role, string> = {
  owner: 'Владелец компании',
  seo_head: 'Руководитель SEO',
  mgr_head: 'Руководитель менеджеров',
  seo_specialist: 'SEO-специалист',
  account_manager: 'Менеджер по клиентам',
  contractor: 'Подрядчик',
  client: 'Клиент'
}

const menu = ref<'user' | 'notifications' | null>(null)
const unread = ref(true)
const box = ref<HTMLElement | null>(null)

function toggle(which: 'user' | 'notifications') {
  menu.value = menu.value === which ? null : which
}

function onDocClick(e: MouseEvent) {
  if (box.value && !box.value.contains(e.target as Node)) menu.value = null
}
function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') menu.value = null
}
onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
})

watch(() => route.fullPath, () => {
  open.value = false
  menu.value = null
})

async function switchRole(next: Role) {
  if (next === role.value) return
  try {
    await auth.switchDevRole(next)
  } catch (err) {
    notify(apiErrorMessage(err), 'error')
    return
  }
  const allowed = route.meta.roles as string[] | undefined
  if (allowed && !hasRole(allowed)) await navigateTo(homeFor(next))
}

async function onLogout() {
  menu.value = null
  await auth.logout()
}

const linkCls = 'flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition'
</script>

<template>
  <div>
    <div v-if="open" id="sidebar-overlay" class="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden" @click="open = false" />
    <aside
      id="sidebar"
      aria-label="Основное меню"
      class="fixed inset-y-0 left-0 z-50 w-72 lg:w-64 lg:translate-x-0 transition-transform duration-300 ease-out bg-canvas border-r border-black/5 flex flex-col justify-between"
      :class="open ? 'translate-x-0' : '-translate-x-full'"
    >
      <div class="flex-1 overflow-y-auto px-3 py-4 space-y-4 min-h-0">
        <div class="flex items-center justify-between gap-2 px-1">
          <NuxtLink :to="homeFor(role)" class="flex items-center gap-3 min-w-0 p-1.5 -m-1.5 rounded-xl hover:bg-black/5 transition">
            <span class="w-9 h-9 rounded-xl bg-zinc-900 text-white text-sm font-semibold flex items-center justify-center shrink-0">{{ COMPANY.initials }}</span>
            <span class="min-w-0"><span class="block text-sm font-semibold tracking-tight truncate">{{ COMPANY.name }}</span>
              <span class="block text-[11px] text-zinc-500 truncate">SEO Control</span></span>
          </NuxtLink>
          <button type="button" aria-label="Закрыть меню" class="lg:hidden w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center shrink-0" @click="open = false">
            <AppIcon name="close" class="w-4 h-4" />
          </button>
        </div>

        <nav class="flex flex-col gap-0.5">
          <NuxtLink
            v-for="item in nav"
            :key="item.id"
            :to="item.to"
            :aria-current="isActive(item, route.path) ? 'page' : undefined"
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition"
            :class="isActive(item, route.path) ? 'font-semibold bg-black/5 text-zinc-900' : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/5'"
          >
            <AppIcon :name="item.icon" class="w-[18px] h-[18px] shrink-0" /><span>{{ item.label }}</span>
          </NuxtLink>
        </nav>

        <div v-if="foot.length" class="pt-2 border-t border-black/5 flex flex-col gap-0.5">
          <NuxtLink
            v-for="item in foot"
            :key="item.id"
            :to="item.to"
            class="flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition"
            :class="isActive(item, route.path) ? 'font-semibold bg-black/5 text-zinc-900' : 'text-zinc-600 hover:text-zinc-900 hover:bg-black/5'"
          >
            <AppIcon :name="item.icon" class="w-[18px] h-[18px] shrink-0" /><span>{{ item.label }}</span>
          </NuxtLink>
        </div>

        <div class="rounded-2xl bg-black/[0.03] p-3">
          <label class="block text-[11px] font-medium text-zinc-500 mb-1" for="role-switch">Демо: смотреть как</label>
          <USelect
            id="role-switch"
            :model-value="role"
            :options="roleOptions"
            size="xs"
            @update:model-value="switchRole"
          />
          <UButton v-if="role === 'owner'" to="/superadmin" color="white" size="xs" block class="mt-2">Кабинет платформы</UButton>
        </div>
      </div>

      <div ref="box" class="m-3 p-2 rounded-2xl bg-white border border-black/5 shadow-sm hover:border-black/10 transition relative flex items-center justify-between gap-2 shrink-0" data-user-menu-container>
        <button type="button" :aria-expanded="menu === 'user'" aria-haspopup="menu" aria-label="Меню пользователя" class="flex items-center gap-2.5 min-w-0 flex-1 text-left p-1 rounded-xl hover:bg-zinc-50 transition focus:outline-none" @click.stop="toggle('user')">
          <img v-if="sessionAvatar" :src="sessionAvatar" alt="" class="h-9 w-9 rounded-full object-cover shrink-0">
          <span v-else class="h-9 w-9 rounded-full bg-zinc-900 text-white text-xs font-semibold flex items-center justify-center shrink-0">{{ sessionInitials }}</span>
          <span class="min-w-0 flex-1">
            <span class="block text-xs font-semibold text-zinc-900 truncate leading-tight">{{ sessionName }}</span>
            <span class="block text-[11px] text-zinc-400 truncate mt-0.5">{{ roleLabel }}</span>
          </span>
        </button>
        <button type="button" :aria-expanded="menu === 'notifications'" aria-label="Уведомления" class="relative h-8 w-8 rounded-full text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 flex items-center justify-center shrink-0 transition focus:outline-none" @click.stop="toggle('notifications')">
          <AppIcon name="bell" class="w-4 h-4" />
          <span v-if="unread" class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent" />
        </button>

        <div v-if="menu === 'user'" role="menu" class="absolute bottom-[calc(100%+8px)] left-0 right-0 bg-white rounded-2xl shadow-pop border border-black/5 py-2 z-50 text-left">
          <div class="px-4 py-2.5">
            <div class="text-xs font-semibold text-zinc-900 truncate">{{ sessionName }}</div>
            <div class="text-[11px] text-zinc-400 truncate mt-0.5">{{ sessionEmail }}</div>
            <div class="mt-2"><span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium" :class="user.badge">{{ roleLabel }}</span></div>
          </div>
          <div class="border-t border-zinc-100 my-1" />
          <NuxtLink to="/profile" role="menuitem" :class="linkCls"><AppIcon name="user" class="w-4 h-4 text-zinc-400 shrink-0" />Мой профиль</NuxtLink>
          <AccessGate :allowed="can('company.profile.manage')" :tip="TIP_SYSTEM" block>
            <NuxtLink
              :to="can('company.profile.manage') ? '/settings' : undefined"
              role="menuitem"
              :aria-disabled="!can('company.profile.manage') || undefined"
              :class="[linkCls, !can('company.profile.manage') && 'opacity-50 cursor-not-allowed']"
            ><AppIcon name="sliders" class="w-4 h-4 text-zinc-400 shrink-0" />Настройки компании</NuxtLink>
          </AccessGate>
          <div class="border-t border-zinc-100 my-1" />
          <button type="button" role="menuitem" class="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition" @click="onLogout"><AppIcon name="logout" class="w-4 h-4 shrink-0" />Выйти из аккаунта</button>
        </div>

        <div v-if="menu === 'notifications'" class="fixed lg:absolute left-4 right-4 bottom-20 lg:left-[calc(100%+12px)] lg:right-auto lg:bottom-0 w-auto lg:w-80 bg-white rounded-2xl shadow-pop border border-black/5 overflow-hidden z-50 text-left">
          <div class="px-4 py-3 bg-zinc-50/80 border-b border-zinc-100 flex items-center justify-between">
            <span class="text-xs font-semibold text-zinc-900">Уведомления</span>
            <button
              type="button"
              :disabled="!unread"
              class="text-[11px] font-medium"
              :class="unread ? 'text-accent hover:underline' : 'text-zinc-400 pointer-events-none'"
              @click="unread = false"
            >{{ unread ? 'Прочитать все' : 'Все прочитано' }}</button>
          </div>
          <div v-if="unread">
            <NuxtLink to="/tasks/1" class="block p-3 hover:bg-zinc-50 border-b border-zinc-100/80 transition">
              <div class="flex items-start gap-2.5">
                <span class="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <div class="text-xs min-w-0">
                  <p class="font-medium text-zinc-900">Вам назначена задача</p>
                  <p class="text-zinc-500 text-[11px] line-clamp-1">Новые заголовки и описания для раздела «Холодильники»</p>
                  <p class="text-zinc-400 text-[10px] mt-0.5">15 минут назад · Интернет-магазин «Холод»</p>
                </div>
              </div>
            </NuxtLink>
            <NuxtLink to="/tasks/1" class="block p-3 hover:bg-zinc-50 border-b border-zinc-100/80 transition">
              <div class="flex items-start gap-2.5">
                <span class="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div class="text-xs min-w-0">
                  <p class="font-medium text-zinc-900">Задача возвращена на доработку</p>
                  <p class="text-zinc-500 text-[11px] line-clamp-1">Причина: Уточнить частотность в кластере</p>
                  <p class="text-zinc-400 text-[10px] mt-0.5">2 часа назад · Никита Морозов</p>
                </div>
              </div>
            </NuxtLink>
            <NuxtLink to="/reports/2025-05" class="block p-3 hover:bg-zinc-50 transition">
              <div class="flex items-start gap-2.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div class="text-xs min-w-0">
                  <p class="font-medium text-zinc-900">Сформирован отчёт за Май 2025</p>
                  <p class="text-zinc-500 text-[11px] line-clamp-1">Отчёт ожидает проверки руководителя</p>
                  <p class="text-zinc-400 text-[10px] mt-0.5">Вчера в 18:30 · Интернет-магазин «Холод»</p>
                </div>
              </div>
            </NuxtLink>
          </div>
          <div v-else class="px-4 py-6 text-center text-[11px] text-zinc-400">Все прочитано</div>
        </div>
      </div>
    </aside>
  </div>
</template>
