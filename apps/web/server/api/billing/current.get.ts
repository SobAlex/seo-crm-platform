export default defineEventHandler((event) => {
  return upstream('/api/billing/current', {
    headers: authCookieHeader(event)
  })
})
