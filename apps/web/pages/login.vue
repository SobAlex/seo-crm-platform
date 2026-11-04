<script setup lang="ts">
// login.html → чистый экран входа. Успешный вход ставит JWT-cookie и открывает проекты.
definePageMeta({ layout: 'auth' })
useHead({ title: 'Вход — SEO Control' })

const { login } = useAuth()
const notify = useNotify()

const form = ref<HTMLFormElement | null>(null)
const email = ref('')
const password = ref('')
const remember = ref(false)
const pending = ref(false)
const error = ref('')

async function submit() {
  if (!form.value?.checkValidity()) {
    form.value?.reportValidity()
    return
  }
  pending.value = true
  error.value = ''
  try {
    await login(email.value.trim(), password.value, remember.value)
    notify('Успешный вход', 'success')
    await navigateTo('/projects')
  } catch (err) {
    error.value = apiErrorMessage(err)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="bg-canvas min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-sm mx-auto">
      <div class="bg-white rounded-3xl shadow-card p-6 sm:p-8">
        <AuthBrand class="mb-6" title="Вход в кабинет" subtitle="Система управления проектами агентства" />

        <form ref="form" class="space-y-4" novalidate @submit.prevent="submit">
          <UiField label="Email" for="login-email">
            <UInput id="login-email" v-model="email" name="email" type="email" required autocomplete="username" placeholder="name@agency.ru" size="md" />
          </UiField>
          <UiField label="Пароль" for="login-password">
            <UInput id="login-password" v-model="password" name="password" type="password" required autocomplete="current-password" placeholder="••••••••" size="md" />
          </UiField>
          <div class="flex items-center justify-between gap-3">
            <label class="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer select-none">
              <input v-model="remember" type="checkbox" name="remember" class="w-4 h-4 rounded border-zinc-300 accent-accent">
              <span>Запомнить меня</span>
            </label>
            <a href="#" class="text-sm text-accent hover:underline shrink-0" @click.prevent>Забыли пароль?</a>
          </div>
          <p v-if="error" class="text-sm text-red-600" role="alert">{{ error }}</p>
          <UButton type="submit" size="md" block :loading="pending" :disabled="pending" :ui="{ rounded: 'rounded-full' }">Войти</UButton>
        </form>
      </div>

      <p class="mt-5 text-center text-sm text-zinc-500">
        <NuxtLink to="/register-company" class="text-accent hover:underline">Создать новую компанию</NuxtLink>
      </p>
      <p class="mt-3 text-center">
        <NuxtLink to="/landing" class="text-sm text-zinc-500 hover:text-zinc-900 transition">← На главную лендинга</NuxtLink>
      </p>
    </div>
  </div>
</template>
