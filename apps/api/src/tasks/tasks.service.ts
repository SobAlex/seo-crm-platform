import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, Prisma, TaskLifecycleStatus } from '@prisma/client';
import { AuthPayload } from '../auth/auth.types';
import { assertCan } from '../access';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { resolveProjectId } from '../projects/slugs';
import { CreateCommentDto, CreateTaskDto, UpdateTaskDto } from './dto';

const STAFF = new Set(['owner', 'seo_head', 'mgr_head', 'pm', 'employee', 'contractor']);

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async transition(
    actor: AuthPayload,
    taskId: string,
    action: 'submit' | 'accept' | 'rework' | 'assign',
    comment?: string,
    assigneeId?: string,
  ) {
    if (!STAFF.has(actor.role)) throw new ForbiddenException('Недостаточно прав для изменения задачи');
    const task = await this.load(actor, taskId);

    if (action === 'assign') {
      return this.assign(actor, task, assigneeId);
    }
    if (action === 'submit') return this.submit(actor, task);
    if (action === 'accept') return this.accept(actor, task);
    return this.rework(actor, task, comment);
  }

  private async submit(actor: AuthPayload, task: TaskRow) {
    if (task.lifecycleStatus === TaskLifecycleStatus.DONE) {
      throw new BadRequestException('Завершённую задачу нельзя сдать повторно');
    }
    if (task.lifecycleStatus === TaskLifecycleStatus.ON_REVIEW) {
      throw new BadRequestException('Задача уже на проверке');
    }
    const updated = await this.prisma.task.update({
      where: { id: task.id },
      data: { lifecycleStatus: TaskLifecycleStatus.ON_REVIEW },
    });
    if (task.creatorId && task.creatorId !== actor.sub) {
      const actorName = await this.personName(actor.sub);
      await this.notifications.createNotification({
        companyId: task.project.companyId,
        userId: task.creatorId,
        type: NotificationType.TASK_SUBMITTED,
        title: 'Задача на проверке',
        message: `${actorName} сдал задачу «${task.title}».`,
        link: `/tasks/${task.id}`,
      });
    }
    return this.present(updated);
  }

  private async accept(actor: AuthPayload, task: TaskRow) {
    if (task.lifecycleStatus !== TaskLifecycleStatus.ON_REVIEW) {
      throw new BadRequestException('Принять можно задачу на проверке');
    }
    const updated = await this.prisma.task.update({
      where: { id: task.id },
      data: { lifecycleStatus: TaskLifecycleStatus.DONE },
    });
    if (task.assigneeId && task.assigneeId !== actor.sub) {
      await this.notifications.createNotification({
        companyId: task.project.companyId,
        userId: task.assigneeId,
        type: NotificationType.TASK_DONE,
        title: 'Задача принята',
        message: `Задача «${task.title}» принята и завершена.`,
        link: `/tasks/${task.id}`,
      });
    }
    return this.present(updated);
  }

  private async rework(actor: AuthPayload, task: TaskRow, comment?: string) {
    if (task.lifecycleStatus !== TaskLifecycleStatus.ON_REVIEW) {
      throw new BadRequestException('Вернуть можно задачу на проверке');
    }
    const note = comment?.trim();
    if (!note) throw new BadRequestException('Опишите, что исправить');
    const updated = await this.prisma.task.update({
      where: { id: task.id },
      data: { lifecycleStatus: TaskLifecycleStatus.IN_PROGRESS, reviewComment: note },
    });
    if (task.assigneeId && task.assigneeId !== actor.sub) {
      await this.notifications.createNotification({
        companyId: task.project.companyId,
        userId: task.assigneeId,
        type: NotificationType.TASK_REWORK,
        title: 'Задача возвращена',
        message: `Задачу «${task.title}» вернули на доработку: ${note}`,
        link: `/tasks/${task.id}`,
      });
    }
    return this.present(updated);
  }

  private async assign(actor: AuthPayload, task: TaskRow, assigneeId?: string) {
    if (!assigneeId) throw new BadRequestException('Укажите исполнителя');
    const member = await this.prisma.companyMember.findFirst({
      where: { companyId: actor.companyId, userId: assigneeId, isActive: true },
    });
    if (!member) throw new NotFoundException('Сотрудник не найден');
    const updated = await this.prisma.task.update({
      where: { id: task.id },
      data: { assigneeId },
    });
    if (assigneeId !== actor.sub && assigneeId !== task.assigneeId) {
      await this.notifications.createNotification({
        companyId: task.project.companyId,
        userId: assigneeId,
        type: NotificationType.TASK_ASSIGNED,
        title: 'Новая задача',
        message: `Вас назначили исполнителем задачи: ${task.title}`,
        link: `/tasks/${task.id}`,
      });
    }
    return this.present(updated);
  }

  async list(actor: AuthPayload) {
    assertCan(actor, 'task.view');
    const mine = actor.role === 'contractor';
    const rows = await this.prisma.task.findMany({
      where: {
        project: { companyId: actor.companyId },
        ...(mine ? { assigneeId: actor.sub } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    return rows.map((row) => ({
      ...this.present(row),
      title: row.title,
      projectId: row.project.id,
      projectName: row.project.name,
      assigneeName: row.assignee ? `${row.assignee.firstName} ${row.assignee.lastName}`.trim() : '',
      deadline: row.deadline,
      isInReport: row.isInReport,
      plannedHours: Number(row.plannedHours),
    }));
  }

  async get(actor: AuthPayload, id: string) {
    assertCan(actor, 'task.view');
    const task = await this.prisma.task.findFirst({
      where: { id, project: { companyId: actor.companyId } },
      include: {
        project: { select: { id: true, name: true, companyId: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        comments: { orderBy: { createdAt: 'asc' }, include: { author: { select: { firstName: true, lastName: true } } } },
      },
    });
    if (!task) throw new NotFoundException('Задача не найдена');
    if (actor.role === 'contractor' && task.assigneeId !== actor.sub) {
      throw new ForbiddenException('Подрядчик видит только назначенные задачи');
    }
    return {
      ...this.present(task),
      title: task.title,
      description: task.description,
      projectId: task.project.id,
      projectName: task.project.name,
      isInReport: task.isInReport,
      reportNote: task.reportNote,
      plannedHours: Number(task.plannedHours),
      actualHours: Number(task.actualHours),
      deadline: task.deadline,
      reviewComment: task.reviewComment,
      assigneeId: task.assigneeId,
      lifecycleStatus: task.lifecycleStatus,
      assigneeName: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}`.trim() : '',
      creatorName: task.creator ? `${task.creator.firstName} ${task.creator.lastName}`.trim() : '',
      comments: task.comments.map((comment) => ({
        id: comment.id,
        text: comment.text,
        isInReport: comment.isReportNote,
        createdAt: comment.createdAt,
        author: comment.author ? `${comment.author.firstName} ${comment.author.lastName}`.trim() : 'Сотрудник',
      })),
    };
  }

  async remove(actor: AuthPayload, id: string) {
    assertCan(actor, 'task.delete');
    const task = await this.load(actor, id);
    await this.prisma.task.delete({ where: { id: task.id } });
    return { id: task.id };
  }

  async create(actor: AuthPayload, dto: CreateTaskDto) {
    assertCan(actor, 'task.create');
    const project = await this.prisma.project.findFirst({
      where: { id: resolveProjectId(dto.projectId), companyId: actor.companyId },
      select: { id: true },
    });
    if (!project) throw new NotFoundException('Проект не найден');
    if (dto.assigneeId) await this.ensureMember(actor.companyId, dto.assigneeId);
    const task = await this.prisma.task.create({
      data: {
        projectId: project.id,
        creatorId: actor.sub,
        assigneeId: dto.assigneeId || null,
        title: dto.title.trim(),
        description: dto.description?.trim() || null,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        plannedHours: dto.estimatedHours ?? 0,
        isInReport: dto.isInReport ?? false,
        reportNote: dto.reportNote?.trim() || null,
        lifecycleStatus: TaskLifecycleStatus.PLANNED,
      },
    });
    if (dto.assigneeId && dto.assigneeId !== actor.sub) {
      await this.notifications.createNotification({
        companyId: actor.companyId,
        userId: dto.assigneeId,
        type: NotificationType.TASK_ASSIGNED,
        title: 'Новая задача',
        message: `Вас назначили исполнителем задачи: ${task.title}`,
        link: `/tasks/${task.id}`,
      });
    }
    return this.present(task);
  }

  async update(actor: AuthPayload, id: string, dto: UpdateTaskDto) {
    assertCan(actor, 'task.update');
    const current = await this.load(actor, id);
    if (dto.assigneeId) await this.ensureMember(actor.companyId, dto.assigneeId);
    const task = await this.prisma.task.update({
      where: { id: current.id },
      data: {
        title: dto.title?.trim() || undefined,
        description: dto.description === undefined ? undefined : dto.description.trim() || null,
        assigneeId: dto.assigneeId === undefined ? undefined : dto.assigneeId || null,
        deadline: dto.deadline === undefined ? undefined : dto.deadline ? new Date(dto.deadline) : null,
        plannedHours: dto.estimatedHours,
        actualHours: dto.spentHours === undefined ? undefined : new Prisma.Decimal(dto.spentHours),
        isInReport: dto.isInReport,
        reportNote: dto.reportNote === undefined ? undefined : dto.reportNote.trim() || null,
        reviewComment: dto.reviewComment === undefined ? undefined : dto.reviewComment.trim() || null,
      },
    });
    if (dto.assigneeId && dto.assigneeId !== actor.sub && dto.assigneeId !== current.assigneeId) {
      await this.notifications.createNotification({
        companyId: actor.companyId,
        userId: dto.assigneeId,
        type: NotificationType.TASK_ASSIGNED,
        title: 'Новая задача',
        message: `Вас назначили исполнителем задачи: ${task.title}`,
        link: `/tasks/${task.id}`,
      });
    }
    return this.present(task);
  }

  async comment(actor: AuthPayload, id: string, dto: CreateCommentDto) {
    assertCan(actor, 'comment.internal.write');
    const task = await this.load(actor, id);
    const text = dto.text.trim();
    const saved = await this.prisma.$transaction(async (tx) => {
      const row = await tx.taskComment.create({
        data: {
          taskId: task.id,
          authorId: actor.sub,
          text,
          isReportNote: dto.isInReport ?? false,
        },
      });
      if (dto.hours && dto.hours > 0) {
        await tx.taskTimeLog.create({
          data: { taskId: task.id, userId: actor.sub, hours: dto.hours, comment: text, loggedAt: new Date() },
        });
        await tx.task.update({
          where: { id: task.id },
          data: { actualHours: { increment: new Prisma.Decimal(dto.hours) } },
        });
      }
      if (dto.isInReport) {
        await tx.task.update({ where: { id: task.id }, data: { isInReport: true, reportNote: text } });
      }
      return row;
    });
    const recipient = task.assigneeId === actor.sub ? task.creatorId : task.assigneeId;
    if (recipient && recipient !== actor.sub) {
      await this.notifications.createNotification({
        companyId: actor.companyId,
        userId: recipient,
        type: NotificationType.TASK_COMMENT,
        title: 'Новый комментарий',
        message: `Комментарий к задаче «${task.title}»`,
        link: `/tasks/${task.id}`,
      });
    }
    return { id: saved.id, text: saved.text, isInReport: saved.isReportNote, createdAt: saved.createdAt };
  }

  private async load(actor: AuthPayload, taskId: string): Promise<TaskRow> {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, project: { companyId: actor.companyId } },
      include: { project: { select: { companyId: true, name: true } } },
    });
    if (!task) throw new NotFoundException('Задача не найдена');
    if (actor.role === 'contractor' && task.assigneeId !== actor.sub) {
      throw new ForbiddenException('Подрядчик работает только с назначенными задачами');
    }
    return task;
  }

  private async ensureMember(companyId: string, userId: string) {
    const member = await this.prisma.companyMember.findFirst({ where: { companyId, userId, isActive: true } });
    if (!member) throw new NotFoundException('Сотрудник не найден');
  }

  private async personName(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });
    return user ? `${user.firstName} ${user.lastName}`.trim() : 'Сотрудник';
  }

  private present(task: { id: string; lifecycleStatus: TaskLifecycleStatus; assigneeId: string | null }) {
    return { id: task.id, status: task.lifecycleStatus, assigneeId: task.assigneeId };
  }
}

type TaskRow = {
  id: string;
  title: string;
  lifecycleStatus: TaskLifecycleStatus;
  creatorId: string | null;
  assigneeId: string | null;
  project: { companyId: string; name: string };
};
