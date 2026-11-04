import type { H3Event } from 'h3'
import { deleteCookie, setCookie } from 'h3'

const WEEK = 60 * 60 * 24 * 7
const MONTH = 60 * 60 * 24 * 30

export function writeAuthCookie(event: H3Event, token: string, remember = false) {
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: remember ? MONTH : WEEK
  })
}

export function clearAuthCookie(event: H3Event) {
  deleteCookie(event, 'auth_token', { path: '/' })
}
