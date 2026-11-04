import { readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return upstream('/api/invites', {
    method: 'POST',
    body,
    headers: authCookieHeader(event)
  })
})
