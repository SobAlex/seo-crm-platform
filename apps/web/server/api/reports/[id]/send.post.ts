import { readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  return upstream(`/api/reports/${encodeURIComponent(id || '')}/send`, {
    method: 'POST',
    body,
    headers: authCookieHeader(event)
  })
})
