import { getQuery, getRouterParam, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const method = event.method
  const hasBody = method !== 'GET' && method !== 'HEAD'
  return upstream(`/api/projects/${id}`, {
    method,
    query: getQuery(event),
    body: hasBody ? await readBody(event) : undefined,
    headers: authCookieHeader(event)
  })
})
