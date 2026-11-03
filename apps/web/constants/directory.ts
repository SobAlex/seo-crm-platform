// Демо-справочники прототипа (App.data в assets/modals.js). Только mock-данные, без API.
import type { Role } from '@crm/access'
import { MONTHS } from '~/utils/proto'

export const CLIENTS = [
  { id: 'holod', name: 'ООО «Холод Групп»', inn: '7701234567', city: 'Москва', rate: 2500, contact: 'Сергей Волков', post: 'Директор по маркетингу', email: 's.volkov@holod.ru', phone: '+7 495 123-45-67', brief: 'ecommerce' },
  { id: 'smirnov', name: 'ИП Смирнов А.', inn: '771234567890', city: 'Москва', rate: 2000, contact: 'Андрей Смирнов', post: 'Владелец', email: 'a@remont-plus.ru', phone: '+7 916 555-12-34', brief: 'services' },
  { id: 'stroytech', name: 'АО «Стройтех»', inn: '7812345678', city: 'Санкт-Петербург', rate: 2800, contact: 'Михаил Орлов', post: 'Коммерческий директор', email: 'm.orlov@stroytech.ru', phone: '+7 812 300-40-50', brief: 'b2b' },
  { id: 'medlife', name: 'ООО «МедЛайф»', inn: '5401234567', city: 'Новосибирск', rate: 2200, contact: 'Елена Крылова', post: 'Маркетолог', email: 'e.krylova@medlife.ru', phone: '+7 383 200-10-20', brief: 'base' },
  { id: 'alfa', name: 'ООО «Альфа»', inn: '6658123456', city: 'Екатеринбург', rate: 2400, contact: 'Дмитрий Лебедев', post: 'Руководитель e-com', email: 'd.lebedev@alfa-group.ru', phone: '+7 343 222-33-44', brief: 'ecommerce' }
]

export const TYPES = [
  { id: 'ecommerce', name: 'Интернет-магазин' },
  { id: 'services', name: 'Сайт услуг' },
  { id: 'b2b', name: 'B2B портал' },
  { id: 'info', name: 'Информационный сайт' },
  { id: 'landing', name: 'Лендинг' }
]

export const ROADMAPS = [
  { id: 'rm-ecom', type: 'ecommerce', name: 'Интернет-магазин · 6 месяцев', info: '4 направления · 18 работ · 268 ч' },
  { id: 'rm-ecom-fast', type: 'ecommerce', name: 'Интернет-магазин · быстрый старт, 3 мес', info: '3 направления · 9 работ · 120 ч' },
  { id: 'rm-services', type: 'services', name: 'Сайт услуг · 6 месяцев', info: '4 направления · 14 работ · 180 ч' },
  { id: 'rm-local', type: 'services', name: 'Локальные услуги · гео-продвижение', info: '3 направления · 10 работ · 110 ч' },
  { id: 'rm-b2b', type: 'b2b', name: 'B2B портал · 12 месяцев', info: '5 направлений · 26 работ · 420 ч' },
  { id: 'rm-info', type: 'info', name: 'Информационный сайт · контент-план', info: '3 направления · 12 работ · 150 ч' },
  { id: 'rm-landing', type: 'landing', name: 'Лендинг · 3 месяца', info: '2 направления · 6 работ · 48 ч' }
]

export const BRIEFS = [
  { id: 'base', name: 'Базовый SEO-бриф' },
  { id: 'ecommerce', name: 'Бриф интернет-магазина' },
  { id: 'services', name: 'Бриф сайта услуг' },
  { id: 'b2b', name: 'Бриф B2B-компании' }
]

/** Роли прототипа pm → account_manager, employee → seo_specialist. */
export const TEAM: { id: string; name: string; role: Role; dept: string; load: string; projects: string[] }[] = [
  { id: 'smirnov', name: 'Александр Смирнов', role: 'owner', dept: 'Руководство', load: '12/40', projects: [] },
  { id: 'sidorov', name: 'Иван Сидоров', role: 'seo_head', dept: 'SEO', load: '30/40', projects: ['holod', 'stroytech'] },
  { id: 'vetrova', name: 'Ольга Ветрова', role: 'mgr_head', dept: 'Менеджеры', load: '26/40', projects: ['stroytech', 'medlife'] },
  { id: 'morozov', name: 'Никита Морозов', role: 'account_manager', dept: 'Менеджеры', load: '32/40', projects: ['holod', 'remont', 'medlife'] },
  { id: 'petrov', name: 'Алексей Петров', role: 'seo_specialist', dept: 'SEO', load: '44/40', projects: ['holod', 'remont'] },
  { id: 'dronov', name: 'Иван Дронов', role: 'seo_specialist', dept: 'SEO', load: '28/40', projects: ['stroytech', 'medlife'] },
  { id: 'kim', name: 'Мария Ким', role: 'contractor', dept: '—', load: '16/20', projects: ['holod', 'remont', 'stroytech'] }
]

export const PROJECTS = [
  { id: 'holod', name: 'Интернет-магазин «Холод»', client: 'holod', site: 'holod-shop.ru' },
  { id: 'holodb2b', name: 'Оптовый портал «Холод B2B»', client: 'holod', site: 'b2b.holod-shop.ru' },
  { id: 'remont', name: 'Сайт услуг «Ремонт+»', client: 'smirnov', site: 'remont-plus.ru' },
  { id: 'stroytech', name: 'B2B портал «Стройтех»', client: 'stroytech', site: 'stroytech.ru' },
  { id: 'medlife', name: 'Клиника «МедЛайф»', client: 'medlife', site: 'medlife.ru' }
]

export const KPI_OPTS = [
  { id: 'traffic', label: 'Поисковый трафик' },
  { id: 'leads', label: 'Целевые обращения (Лиды)' },
  { id: 'top10', label: 'Видимость в поиске (% в ТОП-10)' }
]
export const KPI_DEFAULT = ['traffic', 'leads']

export const ROLE_NAME: Record<Role, string> = {
  owner: 'Владелец компании',
  seo_head: 'Руководитель SEO',
  mgr_head: 'Руководитель менеджеров',
  seo_specialist: 'SEO-специалист',
  account_manager: 'Менеджер по клиентам',
  contractor: 'Подрядчик',
  client: 'Клиент'
}

/** Опции месяцев 2025+ (MONTH_OPTIONS прототипа): from/to — индекс месяца от января 2025. */
export function monthOptions(from: number, to: number): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = []
  for (let i = from; i <= to; i++) {
    const y = 2025 + Math.floor(i / 12)
    const m = i % 12
    out.push({ value: `${y}-${String(m + 1).padStart(2, '0')}`, label: `${MONTHS[m]} ${y}` })
  }
  return out
}

export const shortName = (name: string) => {
  const p = name.split(' ')
  return p[1] ? `${p[0]![0]}. ${p[1]}` : name
}
