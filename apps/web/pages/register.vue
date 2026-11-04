<script setup lang="ts">
// Приглашение: email и роль приходят по токену. Запрос только в onMounted, чтобы SSR не терял контекст рендера.
definePageMeta({ layout: 'auth' })
useHead({ title: 'Принять приглашение — SEO Control' })

const route = useRoute()
const router = useRouter()
const notify = useNotify()

const token = computed(() => (typeof route.query.token === 'string' ? route.query.token : ''))
const loading = ref(true)
const pending = ref(false)
const error = ref('')
const companyName = ref('')
const formEl = ref<HTMLFormElement | null>(null)

const form = reactive({
  email: '',
  firstName: '',
  lastName: '',
  role: '',
  password: '',
  passwordConfirm: ''
})

const roleName = computed(() => (form.role ? dbRoleLabel(form.role) : ''))

onMounted(async () => {
  if (!token.value) {
    error.value = 'Токен приглашения отсутствует или недействителен'
    loading.value = false
    return
  }

  try {
    const res = await $fetch<{
      email: string
      role: string
      firstName?: string | null
      lastName?: string | null
      companyName?: string
    }>('/api/invites/validate', {
      query: { token: token.value }
    })
    form.email = res.email
    form.role = res.role
    form.firstName = res.firstName || ''
    form.lastName = res.lastName || ''
    companyName.value = res.companyName || ''
  } catch (err: unknown) {
    error.value = apiErrorMessage(err)
  } finally {
    loading.value = false
  }
})

async function handleRegister() {
  if (!token.value || !form.email) {
    error.value = error.value || 'Ссылка приглашения недействительна или устарела'
    return
  }
  if (!formEl.value?.checkValidity()) {
    formEl.value?.reportValidity()
    return
  }
  if (form.password !== form.passwordConfirm) {
    error.value = 'Пароли не совпадают'
    return
  }

  pending.value = true
  error.value = ''
  try {
    await $fetch('/api/auth/register-by-invite', {
      method: 'POST',
      body: {
        token: token.value,
        password: form.password,
        firstName: form.firstName,
        lastName: form.lastName
      }
    })
    notify('Добро пожаловать в команду!', 'success')
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
        <AuthBrand class="mb-5" title="Принять приглашение" subtitle="Создайте пароль и войдите в кабинет команды" />

        <div class="mb-5 rounded-2xl bg-zinc-50 border border-zinc-100 px-4 py-3 text-center">
          <span class="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full font-medium inline-block mb-2">Приглашение</span>
          <div class="text-sm font-medium text-ink">Приглашение в команду «{{ companyName || '…' }}»</div>
          <p class="mt-1 text-xs text-zinc-500">Вам назначена роль: <span class="font-semibold text-zinc-800">{{ roleName || '…' }}</span></p>
        </div>

        <p v-if="loading" class="text-sm text-zinc-500 text-center">Проверяем приглашение…</p>

        <form v-else ref="formEl" class="space-y-4" novalidate @submit.prevent="handleRegister">
          <UiField label="Email" for="reg-email">
            <UInput id="reg-email" v-model="form.email" name="email" type="email" readonly disabled size="md" :ui="{ base: 'text-zinc-700' }" />
          </UiField>
          <UiField label="Имя" for="reg-first-name">
            <UInput id="reg-first-name" v-model="form.firstName" name="firstName" type="text" required autocomplete="given-name" size="md" />
          </UiField>
          <UiField label="Фамилия" for="reg-last-name">
            <UInput id="reg-last-name" v-model="form.lastName" name="lastName" type="text" required autocomplete="family-name" size="md" />
          </UiField>
          <UiField label="Роль" for="reg-role">
            <UInput id="reg-role" :model-value="roleName" name="role" type="text" readonly disabled size="md" :ui="{ base: 'text-zinc-700' }" />
          </UiField>
          <UiField label="Пароль" for="reg-password">
            <UInput id="reg-password" v-model="form.password" name="password" type="password" required autocomplete="new-password" placeholder="Придумайте пароль" minlength="6" size="md" />
          </UiField>
          <UiField label="Подтверждение пароля" for="reg-password2">
            <UInput id="reg-password2" v-model="form.passwordConfirm" name="passwordConfirm" type="password" required autocomplete="new-password" placeholder="Повторите пароль" minlength="6" size="md" />
          </UiField>
          <p v-if="error" class="text-sm text-red-600" role="alert">{{ error }}</p>
          <UButton type="submit" size="md" block :loading="pending" :disabled="pending || !form.email" :ui="{ rounded: 'rounded-full' }">Принять приглашение и войти</UButton>
        </form>
      </div>

      <p class="mt-5 text-center text-sm text-zinc-500">
        Уже есть аккаунт?
        <NuxtLink to="/login" class="text-accent hover:underline">Войти</NuxtLink>
      </p>
    </div>
  </div>
</template>
