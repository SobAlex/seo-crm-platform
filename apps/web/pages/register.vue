<script setup lang="ts">
// register.html → активация приглашения в команду: пароль, подтверждение и вход с ролью из инвайта.
import type { Role } from '@crm/access'

definePageMeta({ layout: 'auth' })
useHead({ title: 'Принять приглашение — SEO Control' })

const { setRole } = useRole()
const notify = useNotify()

const INVITE = { company: 'Ромашка Digital', role: 'seo_specialist' as Role, roleName: 'SEO-специалист' }

const form = ref<HTMLFormElement | null>(null)
const email = ref('anna.belova@gmail.com')
const name = ref('Анна Белова')
const password = ref('')
const password2 = ref('')

function submit() {
  if (!form.value?.checkValidity()) {
    form.value?.reportValidity()
    return
  }
  if (password.value !== password2.value) {
    notify('Пароли не совпадают', 'error')
    form.value.querySelector<HTMLInputElement>('[name="password2"]')?.focus()
    return
  }
  notify('Добро пожаловать в команду!', 'success')
  setRole(INVITE.role)
  setTimeout(() => navigateTo(homeFor(INVITE.role)), 700)
}
</script>

<template>
  <div class="bg-canvas min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-sm mx-auto">
      <div class="bg-white rounded-3xl shadow-card p-6 sm:p-8">
        <AuthBrand class="mb-5" title="Принять приглашение" subtitle="Создайте пароль и войдите в кабинет команды" />

        <div class="mb-5 rounded-2xl bg-zinc-50 border border-zinc-100 px-4 py-3 text-center">
          <span class="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full font-medium inline-block mb-2">Приглашение</span>
          <div class="text-sm font-medium text-ink">Приглашение в команду «{{ INVITE.company }}»</div>
          <p class="mt-1 text-xs text-zinc-500">Вам назначена роль: <span class="font-semibold text-zinc-800">{{ INVITE.roleName }}</span></p>
        </div>

        <form ref="form" class="space-y-4" novalidate @submit.prevent="submit">
          <UiField label="Email" for="reg-email">
            <UInput id="reg-email" v-model="email" name="email" type="email" readonly size="md" :ui="{ base: 'text-zinc-700' }" />
          </UiField>
          <UiField label="Имя и фамилия" for="reg-name">
            <UInput id="reg-name" v-model="name" name="name" type="text" required autocomplete="name" size="md" />
          </UiField>
          <UiField label="Пароль" for="reg-password">
            <UInput id="reg-password" v-model="password" name="password" type="password" required autocomplete="new-password" placeholder="Придумайте пароль" minlength="6" size="md" />
          </UiField>
          <UiField label="Подтверждение пароля" for="reg-password2">
            <UInput id="reg-password2" v-model="password2" name="password2" type="password" required autocomplete="new-password" placeholder="Повторите пароль" minlength="6" size="md" />
          </UiField>
          <UButton type="submit" size="md" block :ui="{ rounded: 'rounded-full' }">Принять приглашение и войти</UButton>
        </form>
      </div>

      <p class="mt-5 text-center text-sm text-zinc-500">
        Уже есть аккаунт?
        <NuxtLink to="/login" class="text-accent hover:underline">Войти</NuxtLink>
      </p>
    </div>
  </div>
</template>
