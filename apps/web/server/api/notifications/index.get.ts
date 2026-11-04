export default defineEventHandler((event) => {
  return upstream('/api/notifications', {
    headers: authCookieHeader(event)
  })
})
