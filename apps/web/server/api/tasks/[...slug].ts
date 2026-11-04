import { getQuery, getRouterParam, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const slugParam = getRouterParam(event, 'slug')
  const slug = Array.isArray(slugParam) ? slugParam.join('/') : slugParam || ''
  const method = event.method
  const hasBody = method !== 'GET' && method !== 'HEAD'
  return upstream(`/api/tasks${slug ? `/${slug}` : ''}`, {
    method,
    query: getQuery(event),
    body: hasBody ? await readBody(event) : undefined,
    headers: authCookieHeader(event)
  })
})
