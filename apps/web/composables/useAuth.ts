import { accessRoleOf } from '~/utils/session-role'

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  companyId: string
  phone: string | null
  telegram: string | null
  avatar: string | null
  companyName: string
}

interface AuthSession {
  accessToken: string
  user: AuthUser
}

/** Сессия в HTTP-only cookie auth_token. Токен в localStorage не пишется. */
function bearerFromCookie(cookie: string | undefined): string | null {
  if (!cookie) return null
  for (const part of cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=')
    if (name === 'auth_token') return decodeURIComponent(rest.join('='))
  }
  return null
}

export function useAuth() {
  const user = useState<AuthUser | null>('auth-user', () => null)
  const config = useRuntimeConfig()
  const roleCookie = useCookie<string | null>('seo_role', { sameSite: 'lax', path: '/' })

  function requestHeaders(): HeadersInit | undefined {
    if (!import.meta.server) return undefined
    const token = bearerFromCookie(useRequestHeaders(['cookie']).cookie)
    return token ? { authorization: `Bearer ${token}` } : undefined
  }

  function rememberRole(dbRole: string) {
    roleCookie.value = accessRoleOf(dbRole)
  }

  async function fetchUser(): Promise<AuthUser | null> {
    try {
      user.value = await $fetch<AuthUser>(import.meta.server ? `${config.public.apiBase}/api/auth/me` : '/api/auth/me', {
        credentials: 'include',
        headers: requestHeaders()
      })
      rememberRole(user.value.role)
    } catch {
      user.value = null
    }
    return user.value
  }

  async function login(email: string, password: string, remember = false): Promise<AuthUser> {
    const session = await $fetch<AuthSession>('/api/auth/login', {
      method: 'POST',
      body: { email, password, remember },
      credentials: 'include',
      headers: requestHeaders()
    })
    user.value = session.user
    rememberRole(session.user.role)
    return session.user
  }

  async function registerByInvite(body: { token: string; firstName: string; lastName: string; password: string }): Promise<AuthUser> {
    const session = await $fetch<AuthSession>('/api/auth/register-by-invite', {
      method: 'POST',
      body,
      credentials: 'include',
      headers: requestHeaders()
    })
    user.value = session.user
    rememberRole(session.user.role)
    return session.user
  }

  async function registerCompany(body: {
    companyName: string
    firstName: string
    lastName: string
    email: string
    password: string
  }): Promise<AuthUser> {
    const session = await $fetch<AuthSession>('/api/auth/register-company', {
      method: 'POST',
      body,
      credentials: 'include',
      headers: requestHeaders()
    })
    user.value = session.user
    rememberRole(session.user.role)
    return session.user
  }

  async function switchDevRole(role: string): Promise<AuthUser> {
    const session = await $fetch<AuthSession>('/api/auth/dev-switch-role', {
      method: 'POST',
      body: { role },
      credentials: 'include',
      headers: requestHeaders()
    })
    user.value = session.user
    rememberRole(session.user.role)
    return session.user
  }

  async function logout(options?: { redirect?: boolean }) {
    try {
      await $fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: requestHeaders()
      })
    } catch {
      // Сессия на клиенте очищается в любом случае.
    }
    user.value = null
    roleCookie.value = null
    if (options?.redirect !== false) await navigateTo('/login')
  }

  return {
    user,
    isAuthenticated: computed(() => !!user.value),
    login,
    logout,
    fetchUser,
    switchDevRole,
    registerByInvite,
    registerCompany
  }
}
