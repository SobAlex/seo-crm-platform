import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface NotificationInput {
  companyId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createNotification(data: NotificationInput): Promise<void> {
    try {
      await this.prisma.notification.create({
        data: {
          companyId: data.companyId,
          userId: data.userId,
          type: data.type,
          title: data.title,
          message: data.message,
          link: data.link ?? null,
        },
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      this.logger.error(`Не удалось записать уведомление: ${detail}`);
    }
  }

  async getUserNotifications(userId: string, companyId: string, limit = 20) {
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId, companyId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId, companyId, isRead: false } }),
    ]);
    return { items, unreadCount };
  }

  async markAsRead(notificationId: string, userId: string, companyId: string) {
    const row = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId, companyId },
    });
    if (!row) throw new NotFoundException('Уведомление не найдено');
    if (row.isRead) return row;
    return this.prisma.notification.update({
      where: { id: row.id },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string, companyId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, companyId, isRead: false },
      data: { isRead: true },
    });
    return { updated: result.count };
  }
}
