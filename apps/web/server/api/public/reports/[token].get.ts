export default defineEventHandler((event) => {
  const token = getRouterParam(event, 'token')
  return upstream(`/api/public/reports/${encodeURIComponent(token || '')}`)
})
