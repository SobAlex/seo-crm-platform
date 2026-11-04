const PUBLIC = new Set(['/login', '/register', '/landing', '/portal', '/brief-form'])

export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchUser } = useAuth()
  if (!user.value) await fetchUser()
  if (PUBLIC.has(to.path)) return
  if (!user.value) return navigateTo('/login')
})
