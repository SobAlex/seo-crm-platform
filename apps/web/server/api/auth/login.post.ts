import { readBody } from 'h3'

interface Session {
  accessToken: string
  user: unknown
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string; remember?: boolean }>(event)
  const session = await upstream<Session>('/api/auth/login', { method: 'POST', body })
  writeAuthCookie(event, session.accessToken, body?.remember === true)
  return session
})
