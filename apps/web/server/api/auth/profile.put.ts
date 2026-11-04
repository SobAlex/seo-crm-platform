export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return upstream('/api/auth/profile', { method: 'PUT', body, headers: authCookieHeader(event) })
})
