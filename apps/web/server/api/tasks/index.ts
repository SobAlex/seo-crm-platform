import { getQuery, readBody, setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  const method = event.method
  const hasBody = method !== 'GET' && method !== 'HEAD'
  if (method === 'POST') setResponseStatus(event, 201)
  return upstream('/api/tasks', {
    method,
    query: getQuery(event),
    body: hasBody ? await readBody(event) : undefined,
    headers: authCookieHeader(event)
  })
})
