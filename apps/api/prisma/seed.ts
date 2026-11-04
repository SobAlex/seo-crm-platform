// Демо-данные SEO Control для компании «Ромашка Digital».
// Пароль всех пользователей: demo1234. Хэш — bcrypt.
// Повторный запуск удаляет компании и пользователей (каскадом — их данные) и заполняет базу заново.
// Роли pm и employee соответствуют прототипу: pm — Никита Морозов, employee — Алексей Петров и Иван Дронов.

import 'dotenv/config'
import bcrypt from 'bcrypt'
import {
  BriefFieldType,
  BriefStatus,
  ClientStatus,
  IntegrationService,
  IntegrationStatus,
  InvitationStatus,
  PrismaClient,
  PlanTier,
  ProjectRole,
  ProjectStatus,
  NotificationType,
  ReportStatus,
  Role,
  SubscriptionStatus,
  TaskLifecycleStatus
} from '@prisma/client'

const prisma = new PrismaClient()

const DEMO_PASSWORD = 'demo1234'

const COMPANY_ID = 'cmp_romashka'

const USER = {
  smirnov: 'usr_smirnov',
  sidorov: 'usr_sidorov',
  vetrova: 'usr_vetrova',
  morozov: 'usr_morozov',
  petrov: 'usr_petrov',
  dronov: 'usr_dronov',
  kim: 'usr_kim',
  krylova: 'usr_krylova'
} as const

function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10)
}

function day(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`)
}

function at(isoDateTime: string): Date {
  return new Date(isoDateTime)
}

async function resetDemo(): Promise<void> {
  await prisma.task.updateMany({ data: { parentTaskId: null } })
  await prisma.company.deleteMany()
  await prisma.user.deleteMany()
}

async function seedOrganization(passwordHash: string): Promise<void> {
  await prisma.user.createMany({
    data: [
      { id: USER.smirnov, email: 'owner@romashka.ru', passwordHash, firstName: 'Александр', lastName: 'Смирнов', phone: '+7 495 120-00-26', createdAt: at('2024-11-01T09:00:00.000Z') },
      { id: USER.sidorov, email: 'sidorov@romashka.ru', passwordHash, firstName: 'Иван', lastName: 'Сидоров', phone: '+7 916 200-11-22', telegram: '@ivan_sidorov', createdAt: at('2024-11-02T09:00:00.000Z') },
      { id: USER.vetrova, email: 'vetrova@romashka.ru', passwordHash, firstName: 'Ольга', lastName: 'Ветрова', phone: '+7 903 300-22-33', createdAt: at('2024-11-02T09:00:00.000Z') },
      { id: USER.morozov, email: 'morozov@romashka.ru', passwordHash, firstName: 'Никита', lastName: 'Морозов', phone: '+7 926 111-22-33', createdAt: at('2024-11-04T09:00:00.000Z') },
      { id: USER.petrov, email: 'petrov@romashka.ru', passwordHash, firstName: 'Алексей', lastName: 'Петров', phone: '+7 916 444-55-66', createdAt: at('2024-11-04T09:00:00.000Z') },
      { id: USER.dronov, email: 'dronov@romashka.ru', passwordHash, firstName: 'Иван', lastName: 'Дронов', phone: '+7 903 777-88-99', createdAt: at('2025-01-15T09:00:00.000Z') },
      { id: USER.kim, email: 'kim@romashka.ru', passwordHash, firstName: 'Мария', lastName: 'Ким', phone: '+7 921 555-66-77', telegram: '@maria_kim', createdAt: at('2025-02-01T09:00:00.000Z') },
      { id: USER.krylova, email: 'e.krylova@medlife.ru', passwordHash, firstName: 'Елена', lastName: 'Крылова', phone: '+7 383 200-10-20', createdAt: at('2025-02-10T09:00:00.000Z') }
    ]
  })

  await prisma.company.create({
    data: {
      id: COMPANY_ID,
      name: 'Ромашка Digital',
      inn: '7701122334',
      address: '125009, Москва, ул. Тверская, д. 7',
      createdAt: at('2024-11-01T09:00:00.000Z')
    }
  })

  await prisma.companyMember.createMany({
    data: [
      { id: 'mem_smirnov', companyId: COMPANY_ID, userId: USER.smirnov, role: Role.owner },
      { id: 'mem_sidorov', companyId: COMPANY_ID, userId: USER.sidorov, role: Role.seo_head, hourlyRate: '3500.00', monthlyHoursQuota: 160 },
      { id: 'mem_vetrova', companyId: COMPANY_ID, userId: USER.vetrova, role: Role.mgr_head, hourlyRate: '3200.00', monthlyHoursQuota: 160 },
      { id: 'mem_morozov', companyId: COMPANY_ID, userId: USER.morozov, role: Role.pm, hourlyRate: '2800.00', monthlyHoursQuota: 160 },
      { id: 'mem_petrov', companyId: COMPANY_ID, userId: USER.petrov, role: Role.employee, hourlyRate: '2500.00', monthlyHoursQuota: 160 },
      { id: 'mem_dronov', companyId: COMPANY_ID, userId: USER.dronov, role: Role.employee, hourlyRate: '2300.00', monthlyHoursQuota: 160 },
      { id: 'mem_kim', companyId: COMPANY_ID, userId: USER.kim, role: Role.contractor, hourlyRate: '2000.00', monthlyHoursQuota: 80 },
      { id: 'mem_krylova', companyId: COMPANY_ID, userId: USER.krylova, role: Role.client }
    ]
  })

  await prisma.invitation.createMany({
    data: [
      {
        id: 'inv_demo',
        companyId: COMPANY_ID,
        email: 'new.seo@romashka.ru',
        role: Role.employee,
        token: 'invite-romashka-seo-demo',
        status: InvitationStatus.PENDING,
        expiresAt: at('2026-12-01T00:00:00.000Z'),
        createdAt: at('2026-11-01T10:00:00.000Z')
      },
      {
        id: 'inv_expired',
        companyId: COMPANY_ID,
        email: 'old.contractor@example.com',
        role: Role.contractor,
        token: 'invite-romashka-contractor-expired',
        status: InvitationStatus.EXPIRED,
        expiresAt: at('2025-01-15T00:00:00.000Z'),
        createdAt: at('2024-12-20T10:00:00.000Z')
      }
    ]
  })

  await prisma.employeeVacation.create({
    data: {
      id: 'vac_petrov',
      companyId: COMPANY_ID,
      userId: USER.petrov,
      coverUserId: USER.dronov,
      startDate: day('2026-11-16'),
      endDate: day('2026-11-27'),
      comment: 'Ежегодный отпуск. Проекты «Холод» и «Ремонт+» на время отсутствия принимает Иван Дронов.',
      createdAt: at('2026-10-20T11:00:00.000Z')
    }
  })
}

async function seedLibrary(): Promise<void> {
  await prisma.projectType.createMany({
    data: [
      {
        id: 'ptype_ecom',
        companyId: COMPANY_ID,
        name: 'Интернет-магазин',
        description: 'Каталог, коммерческие факторы, семантика по категориям и карточкам товаров.',
        isDefault: true
      },
      {
        id: 'ptype_services',
        companyId: COMPANY_ID,
        name: 'Услуги',
        description: 'Сайт услуг: посадочные, локальная семантика и контент под коммерческие запросы.',
        isDefault: false
      }
    ]
  })

  await prisma.workflowCategory.createMany({
    data: [
      { id: 'wcat_semantic', companyId: COMPANY_ID, name: 'Семантика', color: '#6366f1', sortOrder: 1 },
      { id: 'wcat_dev', companyId: COMPANY_ID, name: 'Разработка', color: '#0ea5e9', sortOrder: 2 },
      { id: 'wcat_audit', companyId: COMPANY_ID, name: 'Аудит', color: '#f59e0b', sortOrder: 3 }
    ]
  })

  await prisma.workflowStatus.createMany({
    data: [
      { id: 'wst_sem_1', categoryId: 'wcat_semantic', name: 'Сбор', sortOrder: 1, isInitial: true },
      { id: 'wst_sem_2', categoryId: 'wcat_semantic', name: 'Кластеризация', sortOrder: 2 },
      { id: 'wst_sem_3', categoryId: 'wcat_semantic', name: 'Распределение', sortOrder: 3 },
      { id: 'wst_sem_4', categoryId: 'wcat_semantic', name: 'Готово', sortOrder: 4, isDone: true },
      { id: 'wst_dev_1', categoryId: 'wcat_dev', name: 'Постановка', sortOrder: 1, isInitial: true },
      { id: 'wst_dev_2', categoryId: 'wcat_dev', name: 'В работе', sortOrder: 2 },
      { id: 'wst_dev_3', categoryId: 'wcat_dev', name: 'Ревью', sortOrder: 3 },
      { id: 'wst_dev_4', categoryId: 'wcat_dev', name: 'Готово', sortOrder: 4, isDone: true },
      { id: 'wst_aud_1', categoryId: 'wcat_audit', name: 'Сбор данных', sortOrder: 1, isInitial: true },
      { id: 'wst_aud_2', categoryId: 'wcat_audit', name: 'Анализ', sortOrder: 2 },
      { id: 'wst_aud_3', categoryId: 'wcat_audit', name: 'Рекомендации', sortOrder: 3 },
      { id: 'wst_aud_4', categoryId: 'wcat_audit', name: 'Готово', sortOrder: 4, isDone: true }
    ]
  })

  await prisma.roadmapTemplate.createMany({
    data: [
      { id: 'rm_ecom', projectTypeId: 'ptype_ecom', name: 'Интернет-магазин · 6 месяцев', createdAt: at('2024-12-01T10:00:00.000Z') },
      { id: 'rm_services', projectTypeId: 'ptype_services', name: 'Услуги · 6 месяцев', createdAt: at('2024-12-01T10:00:00.000Z') }
    ]
  })

  await prisma.roadmapStageTemplate.createMany({
    data: [
      { id: 'rst_ecom_1', templateId: 'rm_ecom', monthIndex: 1, title: 'Аудит и доступы', sortOrder: 1 },
      { id: 'rst_ecom_2', templateId: 'rm_ecom', monthIndex: 2, title: 'Семантика', sortOrder: 2 },
      { id: 'rst_ecom_3', templateId: 'rm_ecom', monthIndex: 3, title: 'Структура и контент', sortOrder: 3 },
      { id: 'rst_ecom_4', templateId: 'rm_ecom', monthIndex: 4, title: 'Внутренняя оптимизация', sortOrder: 4 },
      { id: 'rst_ecom_5', templateId: 'rm_ecom', monthIndex: 5, title: 'Ссылки', sortOrder: 5 },
      { id: 'rst_ecom_6', templateId: 'rm_ecom', monthIndex: 6, title: 'Отчётность', sortOrder: 6 },
      { id: 'rst_srv_1', templateId: 'rm_services', monthIndex: 1, title: 'Аудит', sortOrder: 1 },
      { id: 'rst_srv_2', templateId: 'rm_services', monthIndex: 2, title: 'Семантика', sortOrder: 2 },
      { id: 'rst_srv_3', templateId: 'rm_services', monthIndex: 3, title: 'Страницы услуг', sortOrder: 3 },
      { id: 'rst_srv_4', templateId: 'rm_services', monthIndex: 4, title: 'Запуск', sortOrder: 4 }
    ]
  })

  await prisma.roadmapTaskTemplate.createMany({
    data: [
      { id: 'rtt_ecom_audit', stageId: 'rst_ecom_1', title: 'Аудит технический', defaultHours: '8.00', sortOrder: 1 },
      { id: 'rtt_ecom_access', stageId: 'rst_ecom_1', title: 'Доступы к GSC и Метрике', defaultHours: '4.00', sortOrder: 2 },
      { id: 'rtt_ecom_markers', stageId: 'rst_ecom_2', title: 'Сбор маркеров', defaultHours: '4.00', sortOrder: 1 },
      { id: 'rtt_ecom_semantic', stageId: 'rst_ecom_2', title: 'Сбор семантики', defaultHours: '10.00', sortOrder: 2 },
      { id: 'rtt_ecom_cluster', stageId: 'rst_ecom_2', title: 'Кластеризация', defaultHours: '6.00', sortOrder: 3 },
      { id: 'rtt_ecom_pages', stageId: 'rst_ecom_3', title: 'Распределение по страницам', defaultHours: '4.00', sortOrder: 1 },
      { id: 'rtt_ecom_texts', stageId: 'rst_ecom_3', title: 'Тексты категорий', defaultHours: '8.00', sortOrder: 2 },
      { id: 'rtt_ecom_links', stageId: 'rst_ecom_4', title: 'Перелинковка', defaultHours: '4.00', sortOrder: 1 },
      { id: 'rtt_ecom_meta', stageId: 'rst_ecom_4', title: 'Мета-теги', defaultHours: '6.00', sortOrder: 2 },
      { id: 'rtt_ecom_offpage', stageId: 'rst_ecom_5', title: 'Стратегия ссылок', defaultHours: '6.00', sortOrder: 1 },
      { id: 'rtt_ecom_report', stageId: 'rst_ecom_6', title: 'Сводка и рекомендации', defaultHours: '4.00', sortOrder: 1 },
      { id: 'rtt_srv_audit', stageId: 'rst_srv_1', title: 'Аудит технический', defaultHours: '6.00', sortOrder: 1 },
      { id: 'rtt_srv_content', stageId: 'rst_srv_1', title: 'Аудит контента', defaultHours: '6.00', sortOrder: 2 },
      { id: 'rtt_srv_semantic', stageId: 'rst_srv_2', title: 'Сбор семантики', defaultHours: '8.00', sortOrder: 1 },
      { id: 'rtt_srv_cluster', stageId: 'rst_srv_2', title: 'Кластеризация', defaultHours: '6.00', sortOrder: 2 },
      { id: 'rtt_srv_texts', stageId: 'rst_srv_3', title: 'Тексты услуг', defaultHours: '6.00', sortOrder: 1 },
      { id: 'rtt_srv_access', stageId: 'rst_srv_4', title: 'Доступы к GSC и Метрике', defaultHours: '4.00', sortOrder: 1 }
    ]
  })

  await prisma.monthlyPlanTemplate.createMany({
    data: [
      { id: 'mplan_ecom', projectTypeId: 'ptype_ecom', name: 'Типовой месяц интернет-магазина', sortOrder: 1 },
      { id: 'mplan_services', projectTypeId: 'ptype_services', name: 'Месяц сопровождения услуг', sortOrder: 1 }
    ]
  })

  await prisma.monthlyPlanTaskTemplate.createMany({
    data: [
      { id: 'mpt_ecom_audit', planId: 'mplan_ecom', roadmapTaskTemplateId: 'rtt_ecom_audit', title: 'Аудит технический', defaultHours: '8.00' },
      { id: 'mpt_ecom_semantic', planId: 'mplan_ecom', roadmapTaskTemplateId: 'rtt_ecom_semantic', title: 'Сбор семантики', defaultHours: '10.00' },
      { id: 'mpt_ecom_report', planId: 'mplan_ecom', roadmapTaskTemplateId: null, title: 'Отчёт клиенту за месяц', defaultHours: '3.00' },
      { id: 'mpt_srv_audit', planId: 'mplan_services', roadmapTaskTemplateId: 'rtt_srv_audit', title: 'Аудит технический', defaultHours: '6.00' },
      { id: 'mpt_srv_texts', planId: 'mplan_services', roadmapTaskTemplateId: 'rtt_srv_texts', title: 'Тексты услуг', defaultHours: '6.00' },
      { id: 'mpt_srv_report', planId: 'mplan_services', roadmapTaskTemplateId: null, title: 'Отчёт клиенту', defaultHours: '2.00' }
    ]
  })

  await prisma.briefTemplate.create({
    data: {
      id: 'bt_ecom',
      companyId: COMPANY_ID,
      title: 'Бриф интернет-магазина',
      createdAt: at('2024-12-02T10:00:00.000Z')
    }
  })

  await prisma.briefQuestionTemplate.createMany({
    data: [
      {
        id: 'bq_site',
        briefTemplateId: 'bt_ecom',
        question: 'Адрес сайта',
        description: 'Основной домен, который продвигаем. Если магазин на поддомене — укажите его.',
        fieldType: BriefFieldType.TEXT,
        sortOrder: 1,
        isRequired: true
      },
      {
        id: 'bq_cms',
        briefTemplateId: 'bt_ecom',
        question: 'На какой CMS работает магазин?',
        description: 'От CMS зависит, кто закрывает технические правки.',
        fieldType: BriefFieldType.SELECT,
        options: ['1С-Битрикс', 'WooCommerce', 'OpenCart', 'Самописная'],
        sortOrder: 2,
        isRequired: true
      },
      {
        id: 'bq_regions',
        briefTemplateId: 'bt_ecom',
        question: 'Регионы продвижения',
        description: 'Можно выбрать несколько.',
        fieldType: BriefFieldType.CHECKBOX,
        options: ['Москва', 'Санкт-Петербург', 'Города-миллионники', 'Вся Россия'],
        sortOrder: 3,
        isRequired: false
      },
      {
        id: 'bq_priority',
        briefTemplateId: 'bt_ecom',
        question: 'Что важнее в первые три месяца?',
        description: 'От этого зависит, какие KPI вынесем в отчёт.',
        fieldType: BriefFieldType.RADIO,
        options: ['Поисковый трафик', 'Заявки и звонки', 'Видимость в ТОП-10'],
        sortOrder: 4,
        isRequired: true
      }
    ]
  })
}

async function seedClients(): Promise<void> {
  await prisma.client.createMany({
    data: [
      {
        id: 'cli_holod',
        companyId: COMPANY_ID,
        name: 'ООО «Холод Групп»',
        inn: '7701234567',
        city: 'Москва',
        status: ClientStatus.ACTIVE,
        hourlyRate: '2500.00',
        contactPerson: 'Сергей Волков',
        contactPosition: 'Директор по маркетингу',
        contactPhone: '+7 495 123-45-67',
        contactEmail: 's.volkov@holod.ru',
        createdAt: at('2025-02-20T10:00:00.000Z')
      },
      {
        id: 'cli_remont',
        companyId: COMPANY_ID,
        name: 'ИП Смирнов А.',
        inn: '771234567890',
        city: 'Москва',
        status: ClientStatus.ACTIVE,
        hourlyRate: '2000.00',
        contactPerson: 'Андрей Смирнов',
        contactPosition: 'Владелец',
        contactPhone: '+7 916 555-12-34',
        contactEmail: 'a@remont-plus.ru',
        createdAt: at('2025-03-15T10:00:00.000Z')
      },
      {
        id: 'cli_medlife',
        companyId: COMPANY_ID,
        portalUserId: USER.krylova,
        name: 'ООО «МедЛайф»',
        inn: '5401234567',
        city: 'Новосибирск',
        status: ClientStatus.ACTIVE,
        hourlyRate: '2200.00',
        contactPerson: 'Елена Крылова',
        contactPosition: 'Маркетолог',
        contactPhone: '+7 383 200-10-20',
        contactEmail: 'e.krylova@medlife.ru',
        createdAt: at('2025-01-20T10:00:00.000Z')
      },
      {
        id: 'cli_stroy',
        companyId: COMPANY_ID,
        name: 'АО «Стройтех»',
        inn: '7812345678',
        city: 'Санкт-Петербург',
        status: ClientStatus.PAUSED,
        hourlyRate: '2800.00',
        contactPerson: 'Михаил Орлов',
        contactPosition: 'Коммерческий директор',
        contactPhone: '+7 812 300-40-50',
        contactEmail: 'm.orlov@stroytech.ru',
        createdAt: at('2025-04-01T10:00:00.000Z')
      },
      {
        id: 'cli_alfa',
        companyId: COMPANY_ID,
        name: 'ООО «Альфа»',
        inn: '6658123456',
        city: 'Екатеринбург',
        status: ClientStatus.LEAD,
        hourlyRate: '2400.00',
        contactPerson: 'Дмитрий Лебедев',
        contactPosition: 'Руководитель e-com',
        contactPhone: '+7 343 222-33-44',
        contactEmail: 'd.lebedev@alfa-group.ru',
        createdAt: at('2026-10-12T10:00:00.000Z')
      }
    ]
  })

  await prisma.clientBrief.createMany({
    data: [
      {
        id: 'cbr_holod',
        clientId: 'cli_holod',
        briefTemplateId: 'bt_ecom',
        status: BriefStatus.COMPLETED,
        publicToken: 'brief-holod-demo',
        createdAt: at('2025-02-21T10:00:00.000Z'),
        completedAt: at('2025-02-28T15:00:00.000Z')
      },
      {
        id: 'cbr_medlife',
        clientId: 'cli_medlife',
        briefTemplateId: 'bt_ecom',
        status: BriefStatus.SENT,
        publicToken: 'brief-medlife-demo',
        createdAt: at('2025-03-02T10:00:00.000Z')
      }
    ]
  })

  await prisma.briefAnswer.createMany({
    data: [
      { id: 'ban_holod_site', briefId: 'cbr_holod', questionTemplateId: 'bq_site', answerText: 'https://holod-shop.ru' },
      { id: 'ban_holod_cms', briefId: 'cbr_holod', questionTemplateId: 'bq_cms', answerText: '1С-Битрикс', selectedOptions: ['1С-Битрикс'] },
      { id: 'ban_holod_regions', briefId: 'cbr_holod', questionTemplateId: 'bq_regions', answerText: 'Москва, вся Россия', selectedOptions: ['Москва', 'Вся Россия'] },
      { id: 'ban_holod_priority', briefId: 'cbr_holod', questionTemplateId: 'bq_priority', answerText: 'Заявки и звонки', selectedOptions: ['Заявки и звонки'] }
    ]
  })
}

async function seedProjects(): Promise<void> {
  await prisma.project.createMany({
    data: [
      {
        id: 'prj_holod',
        companyId: COMPANY_ID,
        clientId: 'cli_holod',
        projectTypeId: 'ptype_ecom',
        name: 'Интернет-магазин «Холод»',
        domain: 'holod-shop.ru',
        status: ProjectStatus.ACTIVE,
        startDate: day('2025-03-01'),
        monthlyBudget: '180000.00',
        monthlyHoursLimit: '80.00',
        targetKpis: ['traffic', 'leads', 'top10'],
        createdAt: at('2025-03-01T09:00:00.000Z')
      },
      {
        id: 'prj_remont',
        companyId: COMPANY_ID,
        clientId: 'cli_remont',
        projectTypeId: 'ptype_services',
        name: 'Сайт услуг «Ремонт+»',
        domain: 'remont-plus.ru',
        status: ProjectStatus.ACTIVE,
        startDate: day('2025-04-01'),
        monthlyBudget: '120000.00',
        monthlyHoursLimit: '60.00',
        targetKpis: ['traffic', 'leads'],
        createdAt: at('2025-04-01T09:00:00.000Z')
      },
      {
        id: 'prj_medlife',
        companyId: COMPANY_ID,
        clientId: 'cli_medlife',
        projectTypeId: 'ptype_services',
        name: 'Клиника «МедЛайф»',
        domain: 'medlife.ru',
        status: ProjectStatus.ACTIVE,
        startDate: day('2025-02-01'),
        monthlyBudget: '140000.00',
        monthlyHoursLimit: '70.00',
        targetKpis: ['traffic', 'leads'],
        createdAt: at('2025-02-01T09:00:00.000Z')
      },
      {
        id: 'prj_stroy',
        companyId: COMPANY_ID,
        clientId: 'cli_stroy',
        projectTypeId: 'ptype_services',
        name: 'B2B портал «Стройтех»',
        domain: 'stroytech.ru',
        status: ProjectStatus.ON_HOLD,
        startDate: day('2025-04-15'),
        monthlyBudget: '200000.00',
        monthlyHoursLimit: '90.00',
        targetKpis: ['traffic', 'leads'],
        createdAt: at('2025-04-15T09:00:00.000Z')
      },
      {
        id: 'prj_promo',
        companyId: COMPANY_ID,
        clientId: 'cli_holod',
        projectTypeId: 'ptype_ecom',
        name: 'Промо-лендинг «Холод» 2024',
        domain: 'promo.holod-shop.ru',
        status: ProjectStatus.ARCHIVED,
        startDate: day('2024-09-01'),
        monthlyBudget: '60000.00',
        monthlyHoursLimit: '20.00',
        targetKpis: ['traffic'],
        createdAt: at('2024-09-01T09:00:00.000Z')
      }
    ]
  })

  await prisma.projectMember.createMany({
    data: [
      { id: 'pmem_holod_morozov', projectId: 'prj_holod', userId: USER.morozov, projectRole: ProjectRole.PM },
      { id: 'pmem_holod_sidorov', projectId: 'prj_holod', userId: USER.sidorov, projectRole: ProjectRole.SEO_LEAD },
      { id: 'pmem_holod_petrov', projectId: 'prj_holod', userId: USER.petrov, projectRole: ProjectRole.EXECUTOR },
      { id: 'pmem_holod_kim', projectId: 'prj_holod', userId: USER.kim, projectRole: ProjectRole.EXECUTOR },
      { id: 'pmem_remont_morozov', projectId: 'prj_remont', userId: USER.morozov, projectRole: ProjectRole.PM },
      { id: 'pmem_remont_petrov', projectId: 'prj_remont', userId: USER.petrov, projectRole: ProjectRole.EXECUTOR },
      { id: 'pmem_remont_dronov', projectId: 'prj_remont', userId: USER.dronov, projectRole: ProjectRole.EXECUTOR },
      { id: 'pmem_med_vetrova', projectId: 'prj_medlife', userId: USER.vetrova, projectRole: ProjectRole.SEO_LEAD },
      { id: 'pmem_med_morozov', projectId: 'prj_medlife', userId: USER.morozov, projectRole: ProjectRole.PM },
      { id: 'pmem_med_dronov', projectId: 'prj_medlife', userId: USER.dronov, projectRole: ProjectRole.EXECUTOR },
      { id: 'pmem_med_krylova', projectId: 'prj_medlife', userId: USER.krylova, projectRole: ProjectRole.GUEST },
      { id: 'pmem_stroy_vetrova', projectId: 'prj_stroy', userId: USER.vetrova, projectRole: ProjectRole.PM },
      { id: 'pmem_stroy_sidorov', projectId: 'prj_stroy', userId: USER.sidorov, projectRole: ProjectRole.SEO_LEAD },
      { id: 'pmem_promo_petrov', projectId: 'prj_promo', userId: USER.petrov, projectRole: ProjectRole.EXECUTOR }
    ]
  })

  await prisma.projectMetricPlan.createMany({
    data: [
      { id: 'plan_holod_03', projectId: 'prj_holod', periodMonth: day('2025-03-01'), targetTraffic: 8000, targetLeads: 40, targetTop10: '18.00', plannedHours: '70.00' },
      { id: 'plan_holod_04', projectId: 'prj_holod', periodMonth: day('2025-04-01'), targetTraffic: 10000, targetLeads: 55, targetTop10: '22.00', plannedHours: '75.00' },
      { id: 'plan_holod_05', projectId: 'prj_holod', periodMonth: day('2025-05-01'), targetTraffic: 12000, targetLeads: 70, targetTop10: '28.00', plannedHours: '80.00' }
    ]
  })

  await prisma.projectMetricFact.createMany({
    data: [
      { id: 'fact_holod_03', projectId: 'prj_holod', periodMonth: day('2025-03-01'), factTraffic: 7600, factLeads: 36, factTop10: '16.40', acceptedTasksCount: 12, spentHours: '64.00', isManualInput: true },
      { id: 'fact_holod_04', projectId: 'prj_holod', periodMonth: day('2025-04-01'), factTraffic: 10400, factLeads: 58, factTop10: '21.20', acceptedTasksCount: 15, spentHours: '72.50', isManualInput: true },
      { id: 'fact_holod_05', projectId: 'prj_holod', periodMonth: day('2025-05-01'), factTraffic: 11300, factLeads: 64, factTop10: '25.00', acceptedTasksCount: 18, spentHours: '76.00', isManualInput: false }
    ]
  })

  await prisma.companyIntegration.createMany({
    data: [
      { id: 'int_metrika', companyId: COMPANY_ID, serviceType: IntegrationService.YANDEX_METRIKA, status: IntegrationStatus.CONNECTED, config: { counterId: '87654321' }, lastSyncedAt: at('2025-06-01T06:00:00.000Z') },
      { id: 'int_webmaster', companyId: COMPANY_ID, serviceType: IntegrationService.YANDEX_WEBMASTER, status: IntegrationStatus.ERROR, config: { hostId: 'https:holod-shop.ru:443', error: 'Токен истёк' }, lastSyncedAt: at('2025-05-28T06:00:00.000Z') },
      { id: 'int_ga', companyId: COMPANY_ID, serviceType: IntegrationService.GOOGLE_ANALYTICS, status: IntegrationStatus.DISCONNECTED },
      { id: 'int_gsc', companyId: COMPANY_ID, serviceType: IntegrationService.GOOGLE_SEARCH_CONSOLE, status: IntegrationStatus.CONNECTED, config: { siteUrl: 'https://holod-shop.ru/' }, lastSyncedAt: at('2025-06-01T06:10:00.000Z') },
      { id: 'int_callibri', companyId: COMPANY_ID, serviceType: IntegrationService.CALLIBRI, status: IntegrationStatus.DISCONNECTED }
    ]
  })
}

async function seedTasks(): Promise<void> {
  await prisma.task.createMany({
    data: [
      {
        id: 'tsk_semantic',
        projectId: 'prj_holod',
        categoryId: 'wcat_semantic',
        workflowStatusId: 'wst_sem_2',
        creatorId: USER.sidorov,
        assigneeId: USER.sidorov,
        title: 'Сбор семантики',
        description: 'Собрать коммерческое ядро по категориям каталога холодильников и отделить информационные запросы.',
        lifecycleStatus: TaskLifecycleStatus.IN_PROGRESS,
        plannedHours: '10.00',
        actualHours: '4.00',
        deadline: at('2025-06-22T09:00:00.000Z'),
        isInReport: true,
        reportNote: 'Ядро собрано по категориям каталога, идёт чистка нерелевантных запросов.',
        sortOrder: 10,
        createdAt: at('2025-06-01T09:00:00.000Z')
      },
      {
        id: 'tsk_cluster',
        projectId: 'prj_holod',
        categoryId: 'wcat_semantic',
        workflowStatusId: 'wst_sem_1',
        creatorId: USER.sidorov,
        assigneeId: USER.sidorov,
        title: 'Кластеризация запросов',
        description: 'Разложить собранное ядро по посадочным: категории, фильтры и карточки.',
        lifecycleStatus: TaskLifecycleStatus.PLANNED,
        plannedHours: '6.00',
        deadline: at('2025-06-27T09:00:00.000Z'),
        sortOrder: 20,
        createdAt: at('2025-06-02T09:00:00.000Z')
      },
      {
        id: 'tsk_gsc',
        projectId: 'prj_holod',
        categoryId: 'wcat_audit',
        workflowStatusId: 'wst_aud_3',
        creatorId: USER.petrov,
        assigneeId: USER.kim,
        title: 'Проверить индексацию в GSC',
        description: 'Сверить покрытие важных категорий и пагинации, приложить выгрузку.',
        lifecycleStatus: TaskLifecycleStatus.ON_REVIEW,
        plannedHours: '3.00',
        actualHours: '1.00',
        deadline: at('2025-06-18T09:00:00.000Z'),
        isInReport: true,
        reviewComment: 'Проверьте покрытие страниц пагинации: в выгрузке их нет.',
        sortOrder: 30,
        createdAt: at('2025-06-04T09:00:00.000Z')
      },
      {
        id: 'tsk_access',
        projectId: 'prj_holod',
        creatorId: USER.morozov,
        assigneeId: USER.dronov,
        title: 'Доступы к GSC и Метрике',
        description: 'Получить у клиента гостевой доступ к Search Console и Яндекс Метрике.',
        lifecycleStatus: TaskLifecycleStatus.WAITING_CLIENT,
        plannedHours: '4.00',
        sortOrder: 40,
        createdAt: at('2025-06-03T09:00:00.000Z')
      },
      {
        id: 'tsk_markers',
        projectId: 'prj_holod',
        categoryId: 'wcat_semantic',
        workflowStatusId: 'wst_sem_4',
        creatorId: USER.sidorov,
        assigneeId: USER.sidorov,
        title: 'Сбор маркеров',
        description: 'Базовые маркеры по товарным категориям для расширения ядра.',
        lifecycleStatus: TaskLifecycleStatus.DONE,
        plannedHours: '4.00',
        actualHours: '4.00',
        deadline: at('2025-05-20T09:00:00.000Z'),
        isInReport: true,
        reportNote: 'Собрано 1 240 маркеров, ядро передано в кластеризацию.',
        sortOrder: 50,
        createdAt: at('2025-05-06T09:00:00.000Z')
      },
      {
        id: 'tsk_links',
        projectId: 'prj_holod',
        categoryId: 'wcat_dev',
        workflowStatusId: 'wst_dev_1',
        creatorId: USER.sidorov,
        assigneeId: USER.petrov,
        title: 'Перелинковка в карточках',
        description: 'Связать карточки товаров с категориями и соседними моделями.',
        lifecycleStatus: TaskLifecycleStatus.PLANNED,
        plannedHours: '4.00',
        deadline: at('2025-06-24T09:00:00.000Z'),
        sortOrder: 60,
        createdAt: at('2025-06-05T09:00:00.000Z')
      },
      {
        id: 'tsk_article',
        projectId: 'prj_holod',
        creatorId: USER.petrov,
        assigneeId: USER.kim,
        title: 'Статья «Как выбрать холодильник»',
        description: 'Информационная статья под запросы выбора. После возврата нужны коммерческие блоки и ссылки в каталог.',
        lifecycleStatus: TaskLifecycleStatus.IN_PROGRESS,
        plannedHours: '6.00',
        actualHours: '2.00',
        deadline: at('2025-06-20T09:00:00.000Z'),
        isInReport: true,
        reviewComment: 'Нет коммерческих блоков и ссылок на категории каталога.',
        sortOrder: 70,
        createdAt: at('2025-06-01T11:00:00.000Z')
      },
      {
        id: 'tsk_audit_remont',
        projectId: 'prj_remont',
        categoryId: 'wcat_audit',
        workflowStatusId: 'wst_aud_4',
        creatorId: USER.sidorov,
        assigneeId: USER.dronov,
        title: 'Аудит технический',
        description: 'Технический аудит сайта услуг: индексация, скорость, дубли заголовков.',
        lifecycleStatus: TaskLifecycleStatus.DONE,
        plannedHours: '8.00',
        actualHours: '8.00',
        deadline: at('2025-06-10T09:00:00.000Z'),
        isInReport: true,
        reportNote: 'Найдены дубли Title на пагинации и 14 битых внутренних ссылок. Список передан в разработку.',
        sortOrder: 10,
        createdAt: at('2025-06-02T09:00:00.000Z')
      },
      {
        id: 'tsk_med_goals',
        projectId: 'prj_medlife',
        categoryId: 'wcat_audit',
        workflowStatusId: 'wst_aud_4',
        creatorId: USER.vetrova,
        assigneeId: USER.dronov,
        title: 'Настройка целей в Метрике',
        description: 'Цели на запись, звонок и клик по телефону.',
        lifecycleStatus: TaskLifecycleStatus.DONE,
        plannedHours: '3.00',
        actualHours: '3.00',
        deadline: at('2025-05-28T09:00:00.000Z'),
        isInReport: true,
        reportNote: 'Настроены три цели: запись, звонок и клик по номеру. Данные пошли в отчёт.',
        sortOrder: 10,
        createdAt: at('2025-05-20T09:00:00.000Z')
      }
    ]
  })

  await prisma.task.create({
    data: {
      id: 'tsk_semantic_freq',
      projectId: 'prj_holod',
      categoryId: 'wcat_semantic',
      workflowStatusId: 'wst_sem_1',
      creatorId: USER.sidorov,
      assigneeId: USER.petrov,
      parentTaskId: 'tsk_semantic',
      title: 'Выгрузить частотность',
      description: 'Частотность Wordstat по собранным маркерам, регион Москва.',
      lifecycleStatus: TaskLifecycleStatus.PLANNED,
      plannedHours: '2.00',
      deadline: at('2025-06-18T09:00:00.000Z'),
      sortOrder: 11,
      createdAt: at('2025-06-06T09:00:00.000Z')
    }
  })

  await prisma.taskAssignee.createMany({
    data: [
      { id: 'tas_semantic_kim', taskId: 'tsk_semantic', userId: USER.kim },
      { id: 'tas_links_kim', taskId: 'tsk_links', userId: USER.kim }
    ]
  })

  await prisma.taskComment.createMany({
    data: [
      {
        id: 'cmt_semantic_internal',
        taskId: 'tsk_semantic',
        authorId: USER.sidorov,
        text: 'Ядро собрано по категориям каталога. Коммерческие запросы держим отдельно от информационных.',
        isInternal: true,
        createdAt: at('2025-06-05T12:00:00.000Z')
      },
      {
        id: 'cmt_semantic_report',
        taskId: 'tsk_semantic',
        authorId: USER.sidorov,
        text: 'В отчёт: собрано ядро по категориям, идёт чистка мусорных запросов.',
        isInternal: false,
        isReportNote: true,
        createdAt: at('2025-06-05T12:05:00.000Z')
      },
      {
        id: 'cmt_gsc_kim',
        taskId: 'tsk_gsc',
        authorId: USER.kim,
        text: 'Проверила индекс категорий. Выгрузка покрытия во вложении, пагинацию не включала.',
        isInternal: false,
        attachments: [{ name: 'gsc-index.csv', size: 184320 }],
        createdAt: at('2025-06-16T15:00:00.000Z')
      },
      {
        id: 'cmt_gsc_petrov',
        taskId: 'tsk_gsc',
        authorId: USER.petrov,
        text: 'Пагинацию тоже нужно закрыть, без неё отчёт по индексации неполный.',
        isInternal: true,
        createdAt: at('2025-06-16T16:30:00.000Z')
      },
      {
        id: 'cmt_article_return',
        taskId: 'tsk_article',
        authorId: USER.petrov,
        text: 'Вернул в работу: в тексте нет коммерческих блоков и ссылок на категории каталога.',
        isInternal: true,
        createdAt: at('2025-06-13T10:00:00.000Z')
      },
      {
        id: 'cmt_markers_report',
        taskId: 'tsk_markers',
        authorId: USER.sidorov,
        text: 'В отчёт: 1 240 маркеров по товарным категориям, переданы на кластеризацию.',
        isInternal: false,
        isReportNote: true,
        createdAt: at('2025-05-20T14:00:00.000Z')
      }
    ]
  })

  await prisma.taskTimeLog.createMany({
    data: [
      { id: 'log_semantic_1', taskId: 'tsk_semantic', userId: USER.sidorov, hours: '2.50', comment: 'Сбор частотности в Wordstat', loggedAt: at('2025-06-02T09:00:00.000Z'), createdAt: at('2025-06-02T18:00:00.000Z') },
      { id: 'log_semantic_2', taskId: 'tsk_semantic', userId: USER.sidorov, hours: '1.50', comment: 'Чистка нерелевантных запросов', loggedAt: at('2025-06-05T09:00:00.000Z'), createdAt: at('2025-06-05T18:00:00.000Z') },
      { id: 'log_gsc', taskId: 'tsk_gsc', userId: USER.kim, hours: '1.00', comment: 'Проверка покрытия в GSC', loggedAt: at('2025-06-16T09:00:00.000Z'), createdAt: at('2025-06-16T15:10:00.000Z') },
      { id: 'log_markers_1', taskId: 'tsk_markers', userId: USER.sidorov, hours: '3.00', comment: 'Маркеры по категориям каталога', loggedAt: at('2025-05-15T09:00:00.000Z'), createdAt: at('2025-05-15T18:00:00.000Z') },
      { id: 'log_markers_2', taskId: 'tsk_markers', userId: USER.sidorov, hours: '1.00', comment: 'Добор маркеров по брендам', loggedAt: at('2025-05-19T09:00:00.000Z'), createdAt: at('2025-05-19T18:00:00.000Z') },
      { id: 'log_article', taskId: 'tsk_article', userId: USER.kim, hours: '2.00', comment: 'Черновик статьи', loggedAt: at('2025-06-11T09:00:00.000Z'), createdAt: at('2025-06-11T18:00:00.000Z') },
      { id: 'log_audit', taskId: 'tsk_audit_remont', userId: USER.dronov, hours: '8.00', comment: 'Технический аудит и список правок', loggedAt: at('2025-06-09T09:00:00.000Z'), createdAt: at('2025-06-09T18:00:00.000Z') },
      { id: 'log_med', taskId: 'tsk_med_goals', userId: USER.dronov, hours: '3.00', comment: 'Цели в Метрике', loggedAt: at('2025-05-27T09:00:00.000Z'), createdAt: at('2025-05-27T18:00:00.000Z') }
    ]
  })

  await prisma.taskStatusHistory.createMany({
    data: [
      { id: 'hist_semantic_1', taskId: 'tsk_semantic', changedById: USER.sidorov, oldStatus: null, newStatus: TaskLifecycleStatus.PLANNED, createdAt: at('2025-06-01T09:00:00.000Z') },
      { id: 'hist_semantic_2', taskId: 'tsk_semantic', changedById: USER.sidorov, oldStatus: TaskLifecycleStatus.PLANNED, newStatus: TaskLifecycleStatus.IN_PROGRESS, createdAt: at('2025-06-02T09:00:00.000Z') },
      { id: 'hist_gsc_1', taskId: 'tsk_gsc', changedById: USER.petrov, oldStatus: null, newStatus: TaskLifecycleStatus.PLANNED, createdAt: at('2025-06-04T09:00:00.000Z') },
      { id: 'hist_gsc_2', taskId: 'tsk_gsc', changedById: USER.kim, oldStatus: TaskLifecycleStatus.PLANNED, newStatus: TaskLifecycleStatus.IN_PROGRESS, createdAt: at('2025-06-10T09:00:00.000Z') },
      { id: 'hist_gsc_3', taskId: 'tsk_gsc', changedById: USER.kim, oldStatus: TaskLifecycleStatus.IN_PROGRESS, newStatus: TaskLifecycleStatus.ON_REVIEW, reason: 'Сдано на проверку', createdAt: at('2025-06-16T15:00:00.000Z') },
      { id: 'hist_access_1', taskId: 'tsk_access', changedById: USER.morozov, oldStatus: null, newStatus: TaskLifecycleStatus.PLANNED, createdAt: at('2025-06-03T09:00:00.000Z') },
      { id: 'hist_access_2', taskId: 'tsk_access', changedById: USER.dronov, oldStatus: TaskLifecycleStatus.PLANNED, newStatus: TaskLifecycleStatus.WAITING_CLIENT, reason: 'Ждём доступы от клиента', createdAt: at('2025-06-06T11:00:00.000Z') },
      { id: 'hist_markers_1', taskId: 'tsk_markers', changedById: USER.sidorov, oldStatus: null, newStatus: TaskLifecycleStatus.PLANNED, createdAt: at('2025-05-06T09:00:00.000Z') },
      { id: 'hist_markers_2', taskId: 'tsk_markers', changedById: USER.sidorov, oldStatus: TaskLifecycleStatus.PLANNED, newStatus: TaskLifecycleStatus.IN_PROGRESS, createdAt: at('2025-05-12T09:00:00.000Z') },
      { id: 'hist_markers_3', taskId: 'tsk_markers', changedById: USER.sidorov, oldStatus: TaskLifecycleStatus.IN_PROGRESS, newStatus: TaskLifecycleStatus.DONE, reason: 'Маркеры переданы в кластеризацию', createdAt: at('2025-05-20T14:00:00.000Z') },
      { id: 'hist_article_1', taskId: 'tsk_article', changedById: USER.petrov, oldStatus: null, newStatus: TaskLifecycleStatus.PLANNED, createdAt: at('2025-06-01T11:00:00.000Z') },
      { id: 'hist_article_2', taskId: 'tsk_article', changedById: USER.kim, oldStatus: TaskLifecycleStatus.PLANNED, newStatus: TaskLifecycleStatus.IN_PROGRESS, createdAt: at('2025-06-08T09:00:00.000Z') },
      { id: 'hist_article_3', taskId: 'tsk_article', changedById: USER.kim, oldStatus: TaskLifecycleStatus.IN_PROGRESS, newStatus: TaskLifecycleStatus.ON_REVIEW, reason: 'Сдано на проверку', createdAt: at('2025-06-12T16:00:00.000Z') },
      { id: 'hist_article_4', taskId: 'tsk_article', changedById: USER.petrov, oldStatus: TaskLifecycleStatus.ON_REVIEW, newStatus: TaskLifecycleStatus.IN_PROGRESS, reason: 'Нет коммерческих блоков в тексте', createdAt: at('2025-06-13T10:00:00.000Z') }
    ]
  })
}

async function seedReports(): Promise<void> {
  await prisma.report.createMany({
    data: [
      {
        id: 'rpt_holod_05',
        projectId: 'prj_holod',
        companyId: COMPANY_ID,
        periodMonth: day('2025-05-01'),
        month: '2025-05',
        title: 'Отчёт по SEO за Май 2025',
        status: ReportStatus.APPROVED,
        publicToken: 'report-holod-2025-05',
        summaryText: 'В мае собрано семантическое ядро по категориям каталога: 1 240 маркеров переданы в кластеризацию. Трафик 11 300 против плана 12 000, заявок 64 против 70. Видимость в ТОП-10 выросла до 25%.',
        snapshot: {},
        sentAt: at('2025-06-02T10:00:00.000Z'),
        approvedAt: at('2025-06-04T12:00:00.000Z'),
        createdAt: at('2025-06-01T09:00:00.000Z')
      },
      {
        id: 'rpt_holod_06',
        projectId: 'prj_holod',
        companyId: COMPANY_ID,
        periodMonth: day('2025-06-01'),
        month: '2025-06',
        title: 'Отчёт по SEO за Июнь 2025',
        status: ReportStatus.DRAFT,
        publicToken: 'report-holod-2025-06',
        summaryText: 'Черновик июня: индексация категорий и статья о выборе холодильника ещё на проверке.',
        snapshot: {},
        createdAt: at('2025-06-18T09:00:00.000Z')
      },
      {
        id: 'rpt_remont_06',
        projectId: 'prj_remont',
        companyId: COMPANY_ID,
        periodMonth: day('2025-06-01'),
        month: '2025-06',
        title: 'Отчёт по SEO за Июнь 2025',
        status: ReportStatus.ON_REVIEW,
        publicToken: 'report-remont-2025-06',
        summaryText: 'Технический аудит сайта услуг готов и ждёт подтверждения руководителя перед отправкой клиенту.',
        snapshot: {},
        createdAt: at('2025-06-11T09:00:00.000Z')
      },
      {
        id: 'rpt_med_05',
        projectId: 'prj_medlife',
        companyId: COMPANY_ID,
        periodMonth: day('2025-05-01'),
        month: '2025-05',
        title: 'Отчёт по SEO за Май 2025',
        status: ReportStatus.SENT,
        publicToken: 'report-medlife-2025-05',
        summaryText: 'В мае настроены цели в Метрике: запись, звонок и клик по номеру. Отчёт отправлен клиенту и ждёт решения.',
        snapshot: {},
        sentAt: at('2025-06-03T10:00:00.000Z'),
        createdAt: at('2025-06-02T09:00:00.000Z')
      }
    ]
  })

  await prisma.reportTask.createMany({
    data: [
      { id: 'rt_holod_05_markers', reportId: 'rpt_holod_05', taskId: 'tsk_markers' },
      { id: 'rt_holod_06_gsc', reportId: 'rpt_holod_06', taskId: 'tsk_gsc' },
      { id: 'rt_holod_06_article', reportId: 'rpt_holod_06', taskId: 'tsk_article' },
      { id: 'rt_remont_06_audit', reportId: 'rpt_remont_06', taskId: 'tsk_audit_remont' },
      { id: 'rt_med_05_goals', reportId: 'rpt_med_05', taskId: 'tsk_med_goals' }
    ]
  })

  await prisma.notification.createMany({
    data: [
      {
        id: 'ntf_report_approved',
        companyId: COMPANY_ID,
        userId: USER.smirnov,
        type: NotificationType.REPORT_READY,
        title: 'Отчёт утверждён',
        message: 'Клиент утвердил отчёт за май 2025 по проекту «Холод».',
        link: '/reports/2025-05',
        isRead: false,
        createdAt: at('2025-06-04T12:05:00.000Z')
      },
      {
        id: 'ntf_task_review',
        companyId: COMPANY_ID,
        userId: USER.petrov,
        type: NotificationType.TASK_SUBMITTED,
        title: 'Задача на проверке',
        message: 'Мария Ким сдала задачу «Проверить индексацию в GSC».',
        link: '/tasks/tsk_gsc',
        isRead: false,
        createdAt: at('2025-06-16T15:05:00.000Z')
      },
      {
        id: 'ntf_waiting',
        companyId: COMPANY_ID,
        userId: USER.morozov,
        type: NotificationType.TASK_COMMENT,
        title: 'Ждём клиента',
        message: 'Задача «Доступы к GSC и Метрике» ждёт доступы от «Холод Групп».',
        link: '/tasks/tsk_access',
        isRead: true,
        createdAt: at('2025-06-06T11:05:00.000Z')
      }
    ]
  })
}

/** Маркерные запросы «Холода» с двумя съёмами позиции. Повторный запуск не затирает уже сохранённое ядро. */
async function seedSemantics(): Promise<void> {
  const projectId = 'prj_holod'
  const existing = await prisma.searchQuery.count({ where: { projectId } })
  if (existing > 0) return

  await prisma.projectSource.upsert({
    where: { projectId },
    update: {},
    create: {
      id: 'src_holod',
      projectId,
      goalIds: [],
      searchEngine: 'YANDEX',
      isAutoSync: false
    }
  })

  const rows: { id: string; query: string; targetUrl: string; frequency: number; previous: number; current: number }[] = [
    { id: 'sq_holod_split', query: 'монтаж сплит систем', targetUrl: '/uslugi/split', frequency: 890, previous: 6, current: 4 },
    { id: 'sq_holod_fridge', query: 'купить холодильник', targetUrl: '/catalog/holodilniki', frequency: 2400, previous: 8, current: 8 },
    { id: 'sq_holod_repair', query: 'ремонт холодильника', targetUrl: '/service', frequency: 640, previous: 11, current: 14 },
    { id: 'sq_holod_gas', query: 'заправка кондиционера', targetUrl: '/uslugi/zapravka', frequency: 430, previous: 9, current: 3 },
    { id: 'sq_holod_freeze', query: 'купить морозильную камеру', targetUrl: '/catalog/moroz', frequency: 510, previous: 15, current: 12 }
  ]

  for (const row of rows) {
    await prisma.searchQuery.create({
      data: {
        id: row.id,
        projectId,
        query: row.query,
        targetUrl: row.targetUrl,
        frequency: row.frequency,
        isMarker: true,
        positions: {
          create: [
            { engine: 'YANDEX', position: row.previous, checkedAt: at('2025-05-01T09:00:00.000Z') },
            { engine: 'YANDEX', position: row.current, checkedAt: at('2025-06-01T09:00:00.000Z') }
          ]
        }
      }
    })
  }
}

/** Активная подписка «Ромашки» и два оплаченных счёта. Повторный запуск не затирает уже созданную подписку. */
async function seedBilling(): Promise<void> {
  const existing = await prisma.subscription.findUnique({ where: { companyId: COMPANY_ID } })
  if (existing) return
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  await prisma.subscription.create({
    data: {
      id: 'sub_romashka',
      companyId: COMPANY_ID,
      plan: PlanTier.AGENCY,
      status: SubscriptionStatus.ACTIVE,
      maxProjects: 100,
      maxMembers: 100,
      expiresAt,
      autoRenew: true,
      invoices: {
        create: [
          {
            id: 'inv_romashka_1',
            amount: 9900,
            status: 'PAID',
            description: 'Подписка «Агентство» на 1 месяц',
            paidAt: at('2026-10-04T10:00:00.000Z'),
            createdAt: at('2026-10-04T10:00:00.000Z')
          },
          {
            id: 'inv_romashka_2',
            amount: 9900,
            status: 'PAID',
            description: 'Подписка «Агентство» на 1 месяц',
            paidAt: at('2026-09-04T10:00:00.000Z'),
            createdAt: at('2026-09-04T10:00:00.000Z')
          }
        ]
      }
    }
  })
}

async function main(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL не задан. Сид читает его из apps/api/.env.')
  }

  if (process.argv.includes('--semantics-only')) {
    await seedSemantics()
    console.log('Семантика «Холода» проверена.')
    return
  }

  if (process.argv.includes('--billing-only')) {
    await seedBilling()
    console.log('Подписка «Ромашки» проверена.')
    return
  }

  const passwordHash = hashPassword(DEMO_PASSWORD)

  await resetDemo()
  await seedOrganization(passwordHash)
  await seedBilling()
  await seedLibrary()
  await seedClients()
  await seedProjects()
  await seedSemantics()
  await seedTasks()
  await seedReports()

  const [users, clients, projects, tasks, reports] = await Promise.all([
    prisma.user.count(),
    prisma.client.count(),
    prisma.project.count(),
    prisma.task.count(),
    prisma.report.count()
  ])

  console.log(`Сид готов: ${users} пользователей, ${clients} клиентов, ${projects} проектов, ${tasks} задач, ${reports} отчётов.`)
  console.log(`Компания «Ромашка Digital». Пароль всех пользователей: ${DEMO_PASSWORD}.`)
  console.log('Демо-инвайт: new.seo@romashka.ru, токен invite-romashka-seo-demo.')
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
