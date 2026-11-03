import type { CLIENTS } from '~/constants/directory'

/** Клиент справочника (App.data.CLIENTS прототипа). */
export type DirectoryClient = (typeof CLIENTS)[number]

/** Поля окна «Новый клиент» / «Редактировать клиента» (clientBody в assets/modals.js). */
export interface ClientForm {
  name: string
  inn: string
  city: string
  rate: string
  contact: string
  post: string
  email: string
  phone: string
  brief: string
  /** data:URL выбранного логотипа. */
  logo: string
}

export interface ClientUpdated extends Omit<ClientForm, 'brief'> {}

/** Монограмма компании без ООО/ИП (monoFromName прототипа). */
export function clientMono(name: string, fallback = 'КЛ'): string {
  const skip = /^(ооо|оао|ао|зао|пао|ип|llc|ltd|inc)$/i
  const parts = String(name || '').replace(/[«»"']/g, '').split(/\s+/).filter(p => p && !skip.test(p))
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  return (parts[0] || fallback).slice(0, 2).toUpperCase()
}

export interface BriefSent {
  client: string
  label: string
  mode: 'link'
}
