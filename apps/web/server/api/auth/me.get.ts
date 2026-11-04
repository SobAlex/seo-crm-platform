export default defineEventHandler((event) => {
  return upstream('/api/auth/me', { headers: authCookieHeader(event) })
})
