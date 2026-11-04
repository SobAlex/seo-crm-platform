export default defineEventHandler((event) => {
  return upstream('/api/projects', {
    headers: authCookieHeader(event)
  })
})
