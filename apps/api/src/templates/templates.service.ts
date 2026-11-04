import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthPayload } from '../auth/auth.types';
import { assertCan } from '../access';
import { PrismaService } from '../prisma/prisma.service';
import { RoadmapDto, StageDto, TypeDto, WorkDto } from './dto';

const COLORS = ['violet', 'emerald', 'blue', 'amber', 'cyan', 'rose'] as const;

function hours(value: Prisma.Decimal): number {
  return Number(value);
}

@Injectable()
export class TemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async types(actor: AuthPayload) {
    assertCan(actor, 'directory.view');
    const rows = await this.prisma.projectType.findMany({
      where: { companyId: actor.companyId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { roadmaps: true, projects: true } } },
    });
    return rows.map((row, index) => ({
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      color: COLORS[index % COLORS.length],
      roadmaps: row._count.roadmaps,
      projects: row._count.projects,
    }));
  }

  async createType(actor: AuthPayload, dto: TypeDto) {
    assertCan(actor, 'templates.manage');
    const row = await this.prisma.projectType.create({
      data: { companyId: actor.companyId, name: dto.name.trim(), description: dto.description?.trim() || null },
    });
    return { id: row.id, name: row.name, description: row.description ?? '', color: 'violet' as const };
  }

  async updateType(actor: AuthPayload, id: string, dto: TypeDto) {
    assertCan(actor, 'templates.manage');
    await this.ownedType(actor.companyId, id);
    const row = await this.prisma.projectType.update({
      where: { id },
      data: { name: dto.name.trim(), description: dto.description?.trim() || null },
    });
    return { id: row.id, name: row.name, description: row.description ?? '' };
  }

  async deleteType(actor: AuthPayload, id: string) {
    assertCan(actor, 'templates.manage');
    await this.ownedType(actor.companyId, id);
    await this.prisma.projectType.delete({ where: { id } });
    return { id };
  }

  async roadmaps(actor: AuthPayload) {
    assertCan(actor, 'directory.view');
    const rows = await this.prisma.roadmapTemplate.findMany({
      where: { projectType: { companyId: actor.companyId } },
      orderBy: { createdAt: 'asc' },
      include: {
        stages: { orderBy: { sortOrder: 'asc' }, include: { tasks: { orderBy: { sortOrder: 'asc' } } } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      type: row.projectTypeId,
      name: row.name,
      directions: row.stages.map((stage) => ({
        id: stage.id,
        name: stage.title,
        monthIndex: stage.monthIndex,
        works: stage.tasks.map((work) => ({
          id: work.id,
          title: work.title,
          hours: hours(work.defaultHours),
          role: work.assigneeRole ?? 'seo',
        })),
      })),
    }));
  }

  async createRoadmap(actor: AuthPayload, dto: RoadmapDto) {
    assertCan(actor, 'templates.manage');
    await this.ownedType(actor.companyId, dto.projectTypeId);
    const row = await this.prisma.roadmapTemplate.create({
      data: { projectTypeId: dto.projectTypeId, name: dto.name.trim() },
    });
    return { id: row.id, type: row.projectTypeId, name: row.name, directions: [] };
  }

  async updateRoadmap(actor: AuthPayload, id: string, dto: RoadmapDto) {
    assertCan(actor, 'templates.manage');
    await this.ownedRoadmap(actor.companyId, id);
    await this.ownedType(actor.companyId, dto.projectTypeId);
    const row = await this.prisma.roadmapTemplate.update({
      where: { id },
      data: { name: dto.name.trim(), projectTypeId: dto.projectTypeId },
    });
    return { id: row.id, type: row.projectTypeId, name: row.name };
  }

  async deleteRoadmap(actor: AuthPayload, id: string) {
    assertCan(actor, 'templates.manage');
    await this.ownedRoadmap(actor.companyId, id);
    await this.prisma.roadmapTemplate.delete({ where: { id } });
    return { id };
  }

  async duplicateRoadmap(actor: AuthPayload, id: string) {
    assertCan(actor, 'templates.manage');
    const source = await this.prisma.roadmapTemplate.findFirst({
      where: { id, projectType: { companyId: actor.companyId } },
      include: { stages: { orderBy: { sortOrder: 'asc' }, include: { tasks: { orderBy: { sortOrder: 'asc' } } } } },
    });
    if (!source) throw new NotFoundException('Дорожная карта не найдена');
    const copy = await this.prisma.roadmapTemplate.create({
      data: {
        projectTypeId: source.projectTypeId,
        name: `${source.name} (копия)`,
        stages: {
          create: source.stages.map((stage) => ({
            monthIndex: stage.monthIndex,
            title: stage.title,
            sortOrder: stage.sortOrder,
            tasks: {
              create: stage.tasks.map((work) => ({
                title: work.title,
                defaultHours: work.defaultHours,
                assigneeRole: work.assigneeRole,
                sortOrder: work.sortOrder,
              })),
            },
          })),
        },
      },
      include: { stages: { orderBy: { sortOrder: 'asc' }, include: { tasks: { orderBy: { sortOrder: 'asc' } } } } },
    });
    return {
      id: copy.id,
      type: copy.projectTypeId,
      name: copy.name,
      directions: copy.stages.map((stage) => ({
        id: stage.id,
        name: stage.title,
        works: stage.tasks.map((work) => ({
          id: work.id,
          title: work.title,
          hours: hours(work.defaultHours),
          role: work.assigneeRole ?? 'seo',
        })),
      })),
    };
  }

  async addStage(actor: AuthPayload, roadmapId: string, dto: StageDto) {
    assertCan(actor, 'templates.manage');
    await this.ownedRoadmap(actor.companyId, roadmapId);
    const last = await this.prisma.roadmapStageTemplate.aggregate({
      where: { templateId: roadmapId },
      _max: { sortOrder: true, monthIndex: true },
    });
    const stage = await this.prisma.roadmapStageTemplate.create({
      data: {
        templateId: roadmapId,
        title: dto.title.trim(),
        monthIndex: dto.monthIndex ?? (last._max.monthIndex ?? 0) + 1,
        sortOrder: (last._max.sortOrder ?? 0) + 1,
      },
    });
    return { id: stage.id, name: stage.title, monthIndex: stage.monthIndex, works: [] };
  }

  async deleteStage(actor: AuthPayload, id: string) {
    assertCan(actor, 'templates.manage');
    const stage = await this.prisma.roadmapStageTemplate.findFirst({
      where: { id, template: { projectType: { companyId: actor.companyId } } },
    });
    if (!stage) throw new NotFoundException('Направление не найдено');
    await this.prisma.roadmapStageTemplate.delete({ where: { id } });
    return { id };
  }

  async addWork(actor: AuthPayload, stageId: string, dto: WorkDto) {
    assertCan(actor, 'templates.manage');
    const stage = await this.prisma.roadmapStageTemplate.findFirst({
      where: { id: stageId, template: { projectType: { companyId: actor.companyId } } },
    });
    if (!stage) throw new NotFoundException('Направление не найдено');
    const last = await this.prisma.roadmapTaskTemplate.aggregate({ where: { stageId }, _max: { sortOrder: true } });
    const work = await this.prisma.roadmapTaskTemplate.create({
      data: {
        stageId,
        title: dto.title.trim(),
        defaultHours: dto.hours ?? 0,
        assigneeRole: dto.role ?? 'seo',
        sortOrder: (last._max.sortOrder ?? 0) + 1,
      },
    });
    return { id: work.id, title: work.title, hours: hours(work.defaultHours), role: work.assigneeRole ?? 'seo' };
  }

  async deleteWork(actor: AuthPayload, id: string) {
    assertCan(actor, 'templates.manage');
    const work = await this.prisma.roadmapTaskTemplate.findFirst({
      where: { id, stage: { template: { projectType: { companyId: actor.companyId } } } },
    });
    if (!work) throw new NotFoundException('Работа не найдена');
    await this.prisma.roadmapTaskTemplate.delete({ where: { id } });
    return { id };
  }

  private async ownedType(companyId: string, id: string) {
    const row = await this.prisma.projectType.findFirst({ where: { id, companyId } });
    if (!row) throw new NotFoundException('Тип проекта не найден');
    return row;
  }

  private async ownedRoadmap(companyId: string, id: string) {
    const row = await this.prisma.roadmapTemplate.findFirst({
      where: { id, projectType: { companyId } },
    });
    if (!row) throw new NotFoundException('Дорожная карта не найдена');
    return row;
  }
}
