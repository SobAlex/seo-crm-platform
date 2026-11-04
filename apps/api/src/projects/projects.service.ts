import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, TaskLifecycleStatus } from '@prisma/client';
import { AuthPayload } from '../auth/auth.types';
import { assertCan } from '../access';
import { BillingService } from '../billing/billing.service';
import { resolveClientId } from '../clients/clients.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { projectSlug, resolveProjectId } from './slugs';

function monthDate(value?: string): Date {
  const match = value?.match(/^(\d{4})-(\d{2})$/);
  if (!match) return new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
}

function money(value: Prisma.Decimal | null): number | null {
  return value == null ? null : Number(value);
}

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
  ) {}

  async list(actor: AuthPayload) {
    assertCan(actor, 'project.view');
    const rows = await this.prisma.project.findMany({
      where: { companyId: actor.companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        client: { select: { name: true } },
        _count: { select: { tasks: true } },
        metricPlans: { orderBy: { periodMonth: 'asc' }, take: 1 },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      domain: row.domain,
      clientName: row.client?.name ?? '',
      slug: projectSlug(row.id),
      status: row.status,
      monthlyBudget: money(row.monthlyBudget),
      taskCount: row._count.tasks,
      targetTraffic: row.metricPlans[0]?.targetTraffic ?? 0,
      targetLeads: row.metricPlans[0]?.targetLeads ?? 0,
      startDate: row.startDate,
    }));
  }

  async get(actor: AuthPayload, id: string) {
    assertCan(actor, 'project.view');
    const project = await this.prisma.project.findFirst({
      where: { id: resolveProjectId(id), companyId: actor.companyId },
      include: {
        client: { select: { id: true, name: true } },
        projectType: { select: { id: true, name: true } },
        tasks: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, title: true, lifecycleStatus: true, plannedHours: true, deadline: true },
        },
        metricPlans: { orderBy: { periodMonth: 'asc' }, take: 1 },
      },
    });
    if (!project) throw new NotFoundException('Проект не найден');
    const plan = project.metricPlans[0];
    return {
      id: project.id,
      slug: projectSlug(project.id),
      name: project.name,
      domain: project.domain,
      status: project.status,
      startDate: project.startDate,
      monthlyBudget: money(project.monthlyBudget),
      monthlyHoursLimit: money(project.monthlyHoursLimit),
      targetKpis: project.targetKpis,
      client: project.client,
      projectType: project.projectType,
      tasks: project.tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.lifecycleStatus,
        plannedHours: Number(task.plannedHours),
        deadline: task.deadline,
      })),
      plan: plan
        ? {
            periodMonth: plan.periodMonth,
            targetTraffic: plan.targetTraffic,
            targetLeads: plan.targetLeads,
          }
        : null,
    };
  }

  async create(actor: AuthPayload, dto: CreateProjectDto) {
    assertCan(actor, 'project.create');
    await this.billing.assertProjectCapacity(actor.companyId);
    const start = monthDate(dto.startMonth);
    const created = await this.prisma.$transaction(async (tx) => {
      const clientId = dto.clientId ? await this.ownedClient(tx, actor.companyId, dto.clientId) : null;
      const projectTypeId = dto.projectTypeId ? await this.ownedType(tx, actor.companyId, dto.projectTypeId) : null;
      const project = await tx.project.create({
        data: {
          companyId: actor.companyId,
          name: dto.name.trim(),
          domain: (dto.siteUrl ?? dto.domain)?.trim() || null,
          clientId,
          projectTypeId,
          startDate: start,
          monthlyBudget: dto.budgetMonthly ?? null,
          monthlyHoursLimit: dto.hoursLimit ?? null,
          targetKpis: dto.kpis ?? [],
        },
      });
      const taskCount = dto.roadmapTemplateId
        ? await this.spawnTasks(tx, actor, project.id, dto.roadmapTemplateId)
        : 0;
      await tx.projectMetricPlan.create({
        data: {
          projectId: project.id,
          periodMonth: start,
          targetTraffic: dto.targetTraffic ?? 0,
          targetLeads: dto.targetLeads ?? 0,
        },
      });
      return { id: project.id, name: project.name, domain: project.domain, taskCount };
    });
    return { ...created, slug: projectSlug(created.id) };
  }

  async update(actor: AuthPayload, id: string, dto: UpdateProjectDto) {
    assertCan(actor, 'project.update');
    const current = await this.prisma.project.findFirst({
      where: { id: resolveProjectId(id), companyId: actor.companyId },
    });
    if (!current) throw new NotFoundException('Проект не найден');
    const start = dto.startMonth ? monthDate(dto.startMonth) : current.startDate;
    const updated = await this.prisma.$transaction(async (tx) => {
      const clientId = dto.clientId ? await this.ownedClient(tx, actor.companyId, dto.clientId) : current.clientId;
      const projectTypeId = dto.projectTypeId
        ? await this.ownedType(tx, actor.companyId, dto.projectTypeId)
        : current.projectTypeId;
      const project = await tx.project.update({
        where: { id: current.id },
        data: {
          name: dto.name.trim(),
          domain: (dto.siteUrl ?? dto.domain)?.trim() || null,
          clientId,
          projectTypeId,
          startDate: start,
          monthlyBudget: dto.budgetMonthly ?? null,
          monthlyHoursLimit: dto.hoursLimit ?? current.monthlyHoursLimit,
          targetKpis: dto.kpis ?? current.targetKpis ?? [],
        },
      });
      if (start) {
        await tx.projectMetricPlan.upsert({
          where: { projectId_periodMonth: { projectId: project.id, periodMonth: start } },
          update: { targetTraffic: dto.targetTraffic ?? 0, targetLeads: dto.targetLeads ?? 0 },
          create: {
            projectId: project.id,
            periodMonth: start,
            targetTraffic: dto.targetTraffic ?? 0,
            targetLeads: dto.targetLeads ?? 0,
          },
        });
      }
      return project;
    });
    return { id: updated.id, name: updated.name, domain: updated.domain, slug: projectSlug(updated.id) };
  }

  private async ownedClient(tx: Prisma.TransactionClient, companyId: string, clientId: string) {
    const client = await tx.client.findFirst({ where: { id: resolveClientId(clientId), companyId }, select: { id: true } });
    if (!client) throw new NotFoundException('Клиент не найден');
    return client.id;
  }

  private async ownedType(tx: Prisma.TransactionClient, companyId: string, typeId: string) {
    const type = await tx.projectType.findFirst({ where: { id: typeId, companyId }, select: { id: true } });
    if (!type) throw new NotFoundException('Тип проекта не найден');
    return type.id;
  }

  /** Первый месяц дорожной карты становится пулом задач со статусом PLANNED (бэклог жизненного цикла). */
  private async spawnTasks(tx: Prisma.TransactionClient, actor: AuthPayload, projectId: string, templateId: string) {
    const template = await tx.roadmapTemplate.findFirst({
      where: { id: templateId, projectType: { companyId: actor.companyId } },
      include: { stages: { orderBy: { sortOrder: 'asc' }, include: { tasks: { orderBy: { sortOrder: 'asc' } } } } },
    });
    if (!template) throw new NotFoundException('Дорожная карта не найдена');
    if (!template.stages.length) return 0;
    const firstMonth = Math.min(...template.stages.map((stage) => stage.monthIndex));
    const stages = template.stages.filter((stage) => stage.monthIndex === firstMonth);
    let count = 0;
    for (const stage of stages) {
      for (const work of stage.tasks) {
        await tx.task.create({
          data: {
            projectId,
            creatorId: actor.sub,
            title: work.title,
            description: stage.title,
            plannedHours: work.defaultHours,
            lifecycleStatus: TaskLifecycleStatus.PLANNED,
            isInReport: true,
          },
        });
        count += 1;
      }
    }
    return count;
  }
}
