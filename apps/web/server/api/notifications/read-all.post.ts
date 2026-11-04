export default defineEventHandler((event) => {
  return upstream('/api/notifications/read-all', {
    method: 'POST',
    headers: authCookieHeader(event)
  })
})
