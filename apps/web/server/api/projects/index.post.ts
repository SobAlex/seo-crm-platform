import { readBody, setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  setResponseStatus(event, 201)
  return upstream('/api/projects', {
    method: 'POST',
    body,
    headers: authCookieHeader(event)
  })
})
