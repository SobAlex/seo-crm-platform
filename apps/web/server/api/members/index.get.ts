export default defineEventHandler(async (event) => {
  return upstream('/api/members', {
    headers: authCookieHeader(event)
  })
})
