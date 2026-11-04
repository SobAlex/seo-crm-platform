import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotificationType, TaskLifecycleStatus } from '@prisma/client';
import { AuthPayload } from '../auth/auth.types';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

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
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, project: { companyId: actor.companyId } },
      include: { project: { select: { companyId: true, name: true } } },
    });
    if (!task) throw new NotFoundException('Задача не найдена');

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
