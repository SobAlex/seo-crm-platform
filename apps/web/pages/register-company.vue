<script setup lang="ts">
// Публичная регистрация компании и её владельца. Триал на 14 дней создаётся на сервере.
definePageMeta({ layout: 'auth' })
useHead({ title: 'Регистрация компании — SEO Control' })

const { registerCompany } = useAuth()
const notify = useNotify()
const router = useRouter()

const formEl = ref<HTMLFormElement | null>(null)
const pending = ref(false)
const error = ref('')
const form = reactive({
  companyName: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  passwordConfirm: ''
})

async function submit() {
  error.value = ''
  if (!formEl.value?.checkValidity()) {
    formEl.value?.reportValidity()
    return
  }
  if (form.password !== form.passwordConfirm) {
    error.value = 'Пароли не совпадают'
    return
  }
  pending.value = true
  try {
    await registerCompany({
      companyName: form.companyName.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      password: form.password
    })
    notify('Компания зарегистрирована. Триал на 14 дней открыт.', 'success')
    await router.push('/projects')
  } catch (err: unknown) {
    error.value = apiErrorMessage(err)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-canvas flex items-center justify-center p-4">
    <div class="w-full max-w-sm mx-auto">
      <div class="bg-white rounded-3xl shadow-card p-6 sm:p-8">
        <AuthBrand class="mb-6" title="Новая компания" subtitle="14 дней триала. Карта не нужна." />
        <form ref="formEl" class="space-y-4" novalidate @submit.prevent="submit">
          <UiField label="Название компании / агентства" for="co-name">
            <UInput id="co-name" v-model="form.companyName" name="companyName" required autocomplete="organization" placeholder="Альфа SEO" size="md" />
          </UiField>
          <UiField label="Имя" for="co-first">
            <UInput id="co-first" v-model="form.firstName" name="firstName" required autocomplete="given-name" size="md" />
          </UiField>
          <UiField label="Фамилия" for="co-last">
            <UInput id="co-last" v-model="form.lastName" name="lastName" required autocomplete="family-name" size="md" />
          </UiField>
          <UiField label="Рабочий Email" for="co-email">
            <UInput id="co-email" v-model="form.email" name="email" type="email" required autocomplete="email" placeholder="owner@alfa.ru" size="md" />
          </UiField>
          <UiField label="Пароль" for="co-password">
            <UInput id="co-password" v-model="form.password" name="password" type="password" required minlength="6" autocomplete="new-password" size="md" />
          </UiField>
          <UiField label="Повторите пароль" for="co-password2">
            <UInput id="co-password2" v-model="form.passwordConfirm" name="passwordConfirm" type="password" required minlength="6" autocomplete="new-password" size="md" />
          </UiField>
          <p v-if="error" class="text-sm text-red-600" role="alert">{{ error }}</p>
          <UButton type="submit" size="md" block :loading="pending" :disabled="pending" :ui="{ rounded: 'rounded-full' }">Зарегистрировать компанию</UButton>
        </form>
      </div>
      <p class="mt-5 text-center text-sm text-zinc-500">
        Уже есть аккаунт?
        <NuxtLink to="/login" class="text-accent hover:underline">Войти</NuxtLink>
      </p>
    </div>
  </div>
</template>
