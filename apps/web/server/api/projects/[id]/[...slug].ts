import { getQuery, getRouterParam, readBody } from 'h3'

/** Прокси карточки проекта: cookie auth_token остаётся на том же origin, что и Nuxt. */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const slugParam = getRouterParam(event, 'slug')
  const slug = Array.isArray(slugParam) ? slugParam.join('/') : slugParam || ''
  const method = event.method
  const hasBody = method !== 'GET' && method !== 'HEAD'
  return upstream(`/api/projects/${id}/${slug}`, {
    method,
    query: getQuery(event),
    body: hasBody ? await readBody(event) : undefined,
    headers: authCookieHeader(event)
  })
})
