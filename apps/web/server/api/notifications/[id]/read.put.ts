export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  return upstream(`/api/notifications/${encodeURIComponent(id || '')}/read`, {
    method: 'PUT',
    headers: authCookieHeader(event)
  })
})
