// Интеграции компании и тарифы (assets/modals.js: SERVICES, INT_DEFAULT, RUB_PLANS) — общие для settings.vue и окон.
import { useState } from '#imports'

export type ServiceId = 'yandex' | 'google' | 'callibri' | 'amocrm'
export type IntegrationStatus = 'connected' | 'expired' | 'off'

export interface IntegrationRow {
  status: IntegrationStatus
  account: string
  projects: number
  /** Только что подключено — «обновлено только что». */
  just?: boolean
}

export interface Service {
  name: string
  short: string
  logo: string
  tone: string
  auth: 'oauth' | 'key'
  btn?: string
  host?: string
  account: string
  accounts?: string[]
  perms: string[]
  bind: string[]
}

export const SERVICE_IDS: ServiceId[] = ['yandex', 'google', 'callibri', 'amocrm']

export const SERVICES: Record<ServiceId, Service> = {
  yandex: {
    name: 'Яндекс (Метрика и Вебмастер)', short: 'Яндекс', logo: 'Я', tone: 'bg-red-50 text-red-600',
    auth: 'oauth', btn: 'Войти через Яндекс ID', account: 'agency-master@yandex.ru',
    accounts: ['agency-master@yandex.ru', 'direct@romashka.ru', 'seo@romashka.ru'],
    perms: ['Просмотр данных счётчиков Яндекс.Метрики', 'Чтение поисковых запросов и индексации в Вебмастере', 'Управление доступом к статистике проектов'],
    bind: ['Метрика 48 213 907', 'Метрика 51 604 112', 'Метрика 39 877 450']
  },
  google: {
    name: 'Google Search Console', short: 'Google Search Console', logo: 'G', tone: 'bg-blue-50 text-blue-600',
    auth: 'oauth', btn: 'Войти через Google', account: 'agency-master@gmail.com',
    accounts: ['agency-master@gmail.com', 'marketing@romashka.ru', 'seo@romashka.ru'],
    perms: ['Просмотр данных Search Console', 'Чтение поисковых запросов и индексации', 'Управление доступом к статистике проектов'],
    bind: ['sc-domain:holod-shop.ru', 'sc-domain:remont-plus.ru', 'https://stroytech.ru/']
  },
  callibri: {
    name: 'Callibri — коллтрекинг', short: 'Callibri', logo: 'C', tone: 'bg-amber-50 text-amber-600',
    auth: 'key', host: 'romashka.callibri.ru', account: 'romashka.callibri.ru',
    perms: ['Чтение статистики звонков и заявок', 'Доступ к номерам коллтрекинга проектов', 'Управление доступом к статистике проектов'],
    bind: ['Сайт #2231 · 6 номеров', 'Сайт #2240 · 2 номера', 'Сайт #2318 · 3 номера']
  },
  amocrm: {
    name: 'amoCRM — лиды', short: 'amoCRM', logo: 'A', tone: 'bg-emerald-50 text-emerald-700',
    auth: 'key', host: 'romashka.amocrm.ru', account: 'romashka.amocrm.ru',
    perms: ['Чтение сделок и контактов', 'Доступ к воронкам SEO-заявок', 'Управление доступом к статистике проектов'],
    bind: ['Воронка «SEO-заявки»', 'Воронка «Опт»', 'Воронка «Сервис»']
  }
}

export const INT_STORE = 'seo_company_integrations'

export const INT_DEFAULT: Record<ServiceId, IntegrationRow> = {
  yandex: { status: 'off', account: '', projects: 0 },
  google: { status: 'off', account: '', projects: 0 },
  callibri: { status: 'off', account: '', projects: 0 },
  amocrm: { status: 'off', account: '', projects: 0 }
}

/** Состояние интеграций компании (readIntegrations / writeIntegrations прототипа). */
export function useCompanyIntegrations() {
  return useState<Record<ServiceId, IntegrationRow>>('company-integrations', () => structuredClone(INT_DEFAULT))
}

export interface IntegrationConnected {
  service: ServiceId
  account: string
  projects: number
}

export type PlanId = 'start' | 'pro' | 'ent'

export interface RubPlan {
  id: PlanId
  name: string
  price: number
  projects: number
  seats: number
  note: string
}

export const RUB_PLANS: RubPlan[] = [
  { id: 'start', name: 'Старт', price: 4900, projects: 5, seats: 3, note: 'Небольшие команды и соло-специалисты' },
  { id: 'pro', name: 'Про / Агентство', price: 9900, projects: 25, seats: 10, note: 'Хит продаж для агентств с отделом' },
  { id: 'ent', name: 'Enterprise', price: 39900, projects: 0, seats: 0, note: 'Сети агентств и in-house отделы' }
]

export const YEAR_FACTOR = 0.8

export const fmtRub = (n: number) => n.toLocaleString('ru-RU') + ' ₽'

export interface BillingPaid {
  amount: number
  period: 'month' | 'year'
  method: 'card' | 'invoice'
  purpose: string
  until: string
}
