import { getQuery } from 'h3'

export default defineEventHandler((event) => {
  const token = String(getQuery(event).token ?? '')
  return upstream('/api/invites/validate', { query: { token } })
})