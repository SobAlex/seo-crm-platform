const PUBLIC = new Set(['/login', '/register', '/register-company', '/landing', '/portal', '/brief-form'])

function isPublic(path: string) {
  return PUBLIC.has(path) || path.startsWith('/public/reports/')
}

export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchUser } = useAuth()
  if (!user.value) await fetchUser()
  if (isPublic(to.path)) return
  if (!user.value) return navigateTo('/login')
})
