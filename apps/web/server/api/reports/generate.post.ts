import { readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return upstream('/api/reports/generate', {
    method: 'POST',
    body,
    headers: authCookieHeader(event)
  })
})
