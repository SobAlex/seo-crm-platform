import { createError, getCookie } from 'h3'

export function apiOrigin(): string {
  return useRuntimeConfig().public.apiBase || 'http://localhost:3001'
}

export function authCookieHeader(event: Parameters<typeof getCookie>[0]): HeadersInit | undefined {
  const token = getCookie(event, 'auth_token')
  return token ? { cookie: `auth_token=${encodeURIComponent(token)}` } : undefined
}

/** Проксирует запрос к Nest и отдаёт клиенту его текст ошибки. */
export async function upstream<T>(path: string, options: Parameters<typeof $fetch>[1] = {}): Promise<T> {
  try {
    return await $fetch<T>(`${apiOrigin()}${path}`, options)
  } catch (error) {
    const err = error as { statusCode?: number; status?: number; data?: { message?: unknown } }
    const message = err.data?.message
    const text = Array.isArray(message) ? message.map(String).join('. ') : typeof message === 'string' ? message : 'Ошибка запроса'
    throw createError({
      statusCode: err.statusCode || err.status || 500,
      statusMessage: text,
      data: { message: text }
    })
  }
}
