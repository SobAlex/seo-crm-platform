import { readBody } from 'h3'

interface Session {
  accessToken: string
  user: unknown
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const session = await upstream<Session>('/api/auth/dev-switch-role', { method: 'POST', body })
  writeAuthCookie(event, session.accessToken)
  return session
})
