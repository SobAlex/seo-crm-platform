import { getQuery, getRouterParam, readBody, setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  const slugParam = getRouterParam(event, 'slug')
  const slug = Array.isArray(slugParam) ? slugParam.join('/') : slugParam || ''
  const method = event.method
  const hasBody = method !== 'GET' && method !== 'HEAD'
  if (method === 'POST') setResponseStatus(event, 201)
  return upstream(`/api/templates/${slug}`, {
    method,
    query: getQuery(event),
    body: hasBody ? await readBody(event) : undefined,
    headers: authCookieHeader(event)
  })
})
