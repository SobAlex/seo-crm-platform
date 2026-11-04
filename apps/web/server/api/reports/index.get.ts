export default defineEventHandler((event) => {
  return upstream('/api/reports', {
    headers: authCookieHeader(event)
  })
})
