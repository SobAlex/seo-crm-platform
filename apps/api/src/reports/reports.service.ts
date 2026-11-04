import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationType, Prisma, ReportStatus, TaskLifecycleStatus } from '@prisma/client';
import { AuthPayload } from '../auth/auth.types';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { projectSlug } from '../projects/slugs';
import { ReportsQueue } from './reports.queue';

const COMPOSE_ROLES = new Set(['owner', 'seo_head', 'mgr_head', 'pm', 'employee']);
const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

const FORWARD: Partial<Record<ReportStatus, ReportStatus[]>> = {
  DRAFT: [ReportStatus.ON_REVIEW],
  ON_REVIEW: [ReportStatus.SENT],
  SENT: [ReportStatus.SENT],
  APPROVED: [ReportStatus.SENT],
};

export interface MetricPair {
  plan: number;
  fact: number;
  pct: number;
}

export interface ReportSnapshot {
  month: string;
  metrics: {
    traffic: MetricPair;
    leads: MetricPair;
    top10: MetricPair;
    visibilityTop10: number | null;
  };
  tasks: Array<{
    id: string;
    title: string;
    reportNote: string | null;
    spentHours: number;
    completedAt: string | null;
  }>;
}

function asNumber(value: { toString(): string } | number | null | undefined): number {
  if (value == null) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function pct(fact: number, plan: number): number {
  if (!plan) return 0;
  return Math.round((fact / plan) * 100);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export function monthLabel(month: string): string {
  const [year, raw] = month.split('-');
  const name = MONTHS[Number(raw) - 1] ?? month;
  return `${name} ${year}`;
}

export function reportTitle(month: string): string {
  return `Отчёт по SEO за ${monthLabel(month)}`;
}

function monthRange(month: string): { start: Date; end: Date; periodMonth: Date } {
  const [year, raw] = month.split('-').map(Number);
  const start = new Date(Date.UTC(year!, raw! - 1, 1));
  const end = new Date(Date.UTC(year!, raw!, 1));
  return { start, end, periodMonth: start };
}

function inRange(date: Date | null | undefined, start: Date, end: Date): boolean {
  return !!date && date >= start && date < end;
}

function emptySnapshot(month: string): ReportSnapshot {
  const blank = { plan: 0, fact: 0, pct: 0 };
  return {
    month,
    metrics: { traffic: blank, leads: blank, top10: blank, visibilityTop10: null },
    tasks: [],
  };
}

export function readSnapshot(value: unknown, month: string): ReportSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return emptySnapshot(month);
  const raw = value as Partial<ReportSnapshot>;
  const metrics = raw.metrics;
  const pair = (key: 'traffic' | 'leads' | 'top10'): MetricPair => {
    const item = metrics?.[key];
    return {
      plan: asNumber(item?.plan),
      fact: asNumber(item?.fact),
      pct: asNumber(item?.pct),
    };
  };
  const tasks = Array.isArray(raw.tasks) ? raw.tasks : [];
  return {
    month: typeof raw.month === 'string' ? raw.month : month,
    metrics: {
      traffic: pair('traffic'),
      leads: pair('leads'),
      top10: pair('top10'),
      visibilityTop10: metrics?.visibilityTop10 == null ? null : asNumber(metrics.visibilityTop10),
    },
    tasks: tasks.map((task) => ({
      id: typeof task.id === 'string' ? task.id : '',
      title: typeof task.title === 'string' ? task.title : '',
      reportNote: typeof task.reportNote === 'string' ? task.reportNote : null,
      spentHours: asNumber(task.spentHours),
      completedAt: typeof task.completedAt === 'string' ? task.completedAt : null,
    })),
  };
}

function shortName(user: { firstName: string; lastName: string }): string {
  const initial = user.firstName.trim().charAt(0);
  return initial ? `${initial}. ${user.lastName}` : user.lastName;
}

function reportUrl(token: string): string {
  const origin = (process.env.WEB_ORIGIN || 'http://localhost:3000').replace(/\/$/, '');
  return `${origin}/public/reports/${token}`;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: ReportsQueue,
    private readonly notifications: NotificationsService,
  ) {}

  async generateReport(actor: AuthPayload, projectId: string, month: string, summaryText?: string) {
    this.assertCompose(actor);
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, companyId: actor.companyId },
      select: { id: true, companyId: true },
    });
    if (!project) throw new NotFoundException('Проект не найден');

    const snapshot = await this.buildSnapshot(project.id, month);
    const { periodMonth } = monthRange(month);
    const existing = await this.prisma.report.findUnique({
      where: { projectId_month: { projectId: project.id, month } },
    });
    const summary = summaryText === undefined ? undefined : summaryText.trim() || null;

    const saved = await this.prisma.$transaction(async (tx) => {
      const report = existing
        ? await tx.report.update({
            where: { id: existing.id },
            data: {
              title: reportTitle(month),
              snapshot: snapshot as unknown as Prisma.InputJsonValue,
              ...(summary !== undefined ? { summaryText: summary } : {}),
            },
          })
        : await tx.report.create({
            data: {
              projectId: project.id,
              companyId: project.companyId,
              periodMonth,
              month,
              title: reportTitle(month),
              status: ReportStatus.DRAFT,
              summaryText: summary ?? null,
              snapshot: snapshot as unknown as Prisma.InputJsonValue,
            },
          });

      await tx.reportTask.deleteMany({ where: { reportId: report.id } });
      const taskIds = snapshot.tasks.map((task) => task.id).filter(Boolean);
      if (taskIds.length) {
        await tx.reportTask.createMany({
          data: taskIds.map((taskId) => ({ reportId: report.id, taskId })),
        });
      }
      return report;
    });

    await this.notifyReportReady(actor.companyId, saved.projectId, saved.title);
    return this.present(saved.id);
  }

  async getCompanyReports(companyId: string, filter?: { month?: string; status?: string }) {
    const month = filter?.month && /^\d{4}-\d{2}$/.test(filter.month) ? filter.month : undefined;
    const status = filter?.status && (Object.values(ReportStatus) as string[]).includes(filter.status)
      ? (filter.status as ReportStatus)
      : undefined;

    const rows = await this.prisma.report.findMany({
      where: { companyId, ...(month ? { month } : {}), ...(status ? { status } : {}) },
      orderBy: [{ month: 'desc' }, { createdAt: 'desc' }],
      include: {
        project: {
          include: {
            client: { select: { name: true, contactEmail: true } },
            members: { include: { user: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
    });

    return rows.map((row) => {
      const manager = row.project.members.find((member) => member.projectRole === 'PM') ?? row.project.members[0];
      return {
        id: row.id,
        projectId: row.projectId,
        projectSlug: projectSlug(row.projectId),
        projectName: row.project.name,
        domain: row.project.domain,
        clientName: row.project.client?.name ?? '',
        clientEmail: row.project.client?.contactEmail ?? '',
        month: row.month,
        title: row.title,
        status: row.status,
        publicToken: row.publicToken,
        summaryText: row.summaryText,
        sentAt: row.sentAt,
        sentToEmail: row.sentToEmail,
        authorName: manager ? shortName(manager.user) : 'Агентство',
      };
    });
  }

  async updateStatus(actor: AuthPayload, reportId: string, status: ReportStatus) {
    this.assertCompose(actor);
    const report = await this.owned(actor.companyId, reportId);
    const allowed = FORWARD[report.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException('Такой переход статуса недоступен');
    }
    await this.prisma.report.update({
      where: { id: report.id },
      data: {
        status,
        ...(status === ReportStatus.SENT && !report.sentAt ? { sentAt: new Date() } : {}),
      },
    });
    return this.present(report.id);
  }

  async sendReport(actor: AuthPayload, reportId: string, email: string) {
    this.assertCompose(actor);
    const report = await this.prisma.report.findFirst({
      where: { id: reportId, companyId: actor.companyId },
      include: { company: { select: { name: true } } },
    });
    if (!report) throw new NotFoundException('Отчёт не найден');

    const to = email.trim().toLowerCase();
    const updated = await this.prisma.report.update({
      where: { id: report.id },
      data: {
        status: ReportStatus.SENT,
        sentAt: new Date(),
        sentToEmail: to,
      },
    });

    this.queue.enqueue({
      email: to,
      url: reportUrl(updated.publicToken),
      title: updated.title,
      companyName: report.company.name,
    });

    return {
      id: updated.id,
      status: updated.status,
      sentAt: updated.sentAt,
      sentToEmail: updated.sentToEmail,
      publicToken: updated.publicToken,
    };
  }

  async getPublicReport(publicToken: string) {
    const report = await this.prisma.report.findUnique({
      where: { publicToken },
      include: {
        company: {
          select: {
            name: true,
            members: {
              where: { role: 'owner' },
              include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
              take: 1,
            },
          },
        },
        project: {
          include: {
            client: { select: { name: true } },
            members: {
              where: { projectRole: 'PM' },
              include: { user: { select: { firstName: true, lastName: true, email: true, phone: true } } },
              take: 1,
            },
          },
        },
      },
    });
    if (!report) throw new NotFoundException('Отчёт не найден');

    const manager = report.project.members[0]?.user ?? report.company.members[0]?.user ?? null;
    return {
      token: report.publicToken,
      title: report.title,
      month: report.month,
      monthLabel: monthLabel(report.month),
      status: report.status,
      summaryText: report.summaryText,
      sentAt: report.sentAt,
      agency: {
        name: report.company.name,
        managerName: manager ? `${manager.firstName} ${manager.lastName}`.trim() : '',
        phone: manager?.phone ?? '',
        email: manager?.email ?? '',
      },
      project: {
        name: report.project.name,
        domain: report.project.domain ?? '',
        clientName: report.project.client?.name ?? '',
      },
      snapshot: readSnapshot(report.snapshot, report.month),
    };
  }

  private async notifyReportReady(companyId: string, projectId: string, title: string) {
    const [owner, pm] = await Promise.all([
      this.prisma.companyMember.findFirst({
        where: { companyId, role: 'owner', isActive: true },
        select: { userId: true },
      }),
      this.prisma.projectMember.findFirst({
        where: { projectId, projectRole: 'PM' },
        select: { userId: true },
      }),
    ]);
    const userId = owner?.userId ?? pm?.userId;
    if (!userId) return;
    await this.notifications.createNotification({
      companyId,
      userId,
      type: NotificationType.REPORT_READY,
      title: 'Отчёт готов',
      message: `Месячный отчёт «${title}» сформирован и готов к отправке.`,
      link: '/reports',
    });
  }

  private assertCompose(actor: AuthPayload) {
    if (!COMPOSE_ROLES.has(actor.role)) {
      throw new ForbiddenException('Недостаточно прав для сборки отчёта');
    }
  }

  private async owned(companyId: string, reportId: string) {
    const report = await this.prisma.report.findFirst({ where: { id: reportId, companyId } });
    if (!report) throw new NotFoundException('Отчёт не найден');
    return report;
  }

  private async present(id: string) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Отчёт не найден');
    return {
      id: report.id,
      projectId: report.projectId,
      month: report.month,
      title: report.title,
      status: report.status,
      publicToken: report.publicToken,
      summaryText: report.summaryText,
      snapshot: readSnapshot(report.snapshot, report.month),
    };
  }

  private async buildSnapshot(projectId: string, month: string): Promise<ReportSnapshot> {
    const { start, end } = monthRange(month);
    const [plan, fact, queries, tasks] = await Promise.all([
      this.prisma.projectMetricPlan.findUnique({ where: { projectId_periodMonth: { projectId, periodMonth: start } } }),
      this.prisma.projectMetricFact.findUnique({ where: { projectId_periodMonth: { projectId, periodMonth: start } } }),
      this.prisma.searchQuery.findMany({
        where: { projectId },
        include: {
          positions: {
            where: { checkedAt: { gte: start, lt: end } },
            orderBy: { checkedAt: 'desc' },
            take: 1,
          },
        },
      }),
      this.prisma.task.findMany({
        where: { projectId, isInReport: true },
        include: {
          timeLogs: true,
          statusHistory: { where: { newStatus: TaskLifecycleStatus.DONE }, orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const positioned = queries.filter((query) => query.positions[0]);
    const inTop = positioned.filter((query) => query.positions[0]!.position <= 10).length;
    const visibilityTop10 = positioned.length ? round1((inTop / positioned.length) * 100) : null;

    const traffic = { plan: plan?.targetTraffic ?? 0, fact: fact?.factTraffic ?? 0, pct: 0 };
    const leads = { plan: plan?.targetLeads ?? 0, fact: fact?.factLeads ?? 0, pct: 0 };
    const topFact = fact ? asNumber(fact.factTop10) : (visibilityTop10 ?? 0);
    const top10 = { plan: plan ? asNumber(plan.targetTop10) : 0, fact: topFact, pct: 0 };
    traffic.pct = pct(traffic.fact, traffic.plan);
    leads.pct = pct(leads.fact, leads.plan);
    top10.pct = pct(top10.fact, top10.plan);

    const included = tasks.filter((task) => this.taskInMonth(task, start, end));

    return {
      month,
      metrics: { traffic, leads, top10, visibilityTop10 },
      tasks: included.map((task) => {
        const logged = task.timeLogs.reduce((sum, row) => sum + asNumber(row.hours), 0);
        const spent = asNumber(task.actualHours) || logged;
        const doneAt = task.statusHistory[0]?.createdAt ?? null;
        return {
          id: task.id,
          title: task.title,
          reportNote: task.reportNote,
          spentHours: round1(spent),
          completedAt: task.lifecycleStatus === TaskLifecycleStatus.DONE && doneAt ? doneAt.toISOString() : null,
        };
      }),
    };
  }

  private taskInMonth(
    task: {
      lifecycleStatus: TaskLifecycleStatus;
      createdAt: Date;
      deadline: Date | null;
      timeLogs: { loggedAt: Date }[];
      statusHistory: { createdAt: Date }[];
    },
    start: Date,
    end: Date,
  ): boolean {
    const touched = [task.createdAt, task.deadline, ...task.timeLogs.map((row) => row.loggedAt), ...task.statusHistory.map((row) => row.createdAt)]
      .some((date) => inRange(date, start, end));
    const doneThisMonth = task.lifecycleStatus === TaskLifecycleStatus.DONE && inRange(task.deadline, start, end);
    return touched || doneThisMonth;
  }
}
