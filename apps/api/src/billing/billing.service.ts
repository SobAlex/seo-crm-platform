import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PlanTier, SubscriptionStatus } from '@prisma/client';
import { AuthPayload } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { PLAN_LIMITS } from './plans';

const DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async getCurrent(actor: AuthPayload) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { companyId: actor.companyId },
      include: { invoices: { orderBy: { createdAt: 'desc' } } },
    });
    if (!subscription) throw new NotFoundException('Подписка не найдена');

    const [projectsUsed, membersUsed] = await Promise.all([
      this.prisma.project.count({ where: { companyId: actor.companyId } }),
      this.prisma.companyMember.count({ where: { companyId: actor.companyId } }),
    ]);
    const daysLeft = Math.max(0, Math.ceil((subscription.expiresAt.getTime() - Date.now()) / DAY_MS));
    const status = subscription.expiresAt.getTime() < Date.now() ? SubscriptionStatus.EXPIRED : subscription.status;

    return {
      plan: subscription.plan,
      status,
      expiresAt: subscription.expiresAt,
      daysLeft,
      autoRenew: subscription.autoRenew,
      projectsUsed,
      maxProjects: subscription.maxProjects,
      membersUsed,
      maxMembers: subscription.maxMembers,
      invoices: subscription.invoices.map((invoice) => ({
        id: invoice.id,
        amount: invoice.amount,
        status: invoice.status,
        description: invoice.description,
        paidAt: invoice.paidAt,
        createdAt: invoice.createdAt,
      })),
    };
  }

  async changePlan(actor: AuthPayload, plan: PlanTier, periodMonths: number) {
    if (actor.role !== 'owner') {
      throw new ForbiddenException('Тариф может менять только владелец компании');
    }
    if (plan === PlanTier.TRIAL) {
      throw new BadRequestException('Пробный тариф нельзя выбрать повторно');
    }
    const limits = PLAN_LIMITS[plan];
    const subscription = await this.prisma.subscription.findUnique({ where: { companyId: actor.companyId } });
    if (!subscription) throw new NotFoundException('Подписка не найдена');

    const base = subscription.expiresAt.getTime() > Date.now() ? subscription.expiresAt.getTime() : Date.now();
    const expiresAt = new Date(base + periodMonths * 30 * DAY_MS);
    const description = `Подписка «${limits.title}» на ${periodMonths} мес.`;

    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        plan,
        status: SubscriptionStatus.ACTIVE,
        maxProjects: limits.maxProjects,
        maxMembers: limits.maxMembers,
        expiresAt,
        autoRenew: true,
        invoices: {
          create: {
            amount: limits.price * periodMonths,
            status: 'PAID',
            description,
            paidAt: new Date(),
          },
        },
      },
    });

    return {
      plan: updated.plan,
      expiresAt: updated.expiresAt,
      maxProjects: updated.maxProjects,
      maxMembers: updated.maxMembers,
      amount: limits.price * periodMonths,
      description,
    };
  }

  async assertProjectCapacity(companyId: string): Promise<void> {
    const subscription = await this.requireSubscription(companyId);
    const used = await this.prisma.project.count({ where: { companyId } });
    if (used >= subscription.maxProjects) {
      throw new ForbiddenException('Лимит проектов по вашему тарифу исчерпан. Перейдите на тариф выше');
    }
  }

  async assertMemberCapacity(companyId: string): Promise<void> {
    const subscription = await this.requireSubscription(companyId);
    const [members, invites] = await Promise.all([
      this.prisma.companyMember.count({ where: { companyId } }),
      this.prisma.invitation.count({
        where: { companyId, status: 'PENDING', expiresAt: { gt: new Date() } },
      }),
    ]);
    if (members + invites >= subscription.maxMembers) {
      throw new ForbiddenException('Лимит сотрудников по тарифу исчерпан. Перейдите на тариф выше');
    }
  }

  private async requireSubscription(companyId: string) {
    const subscription = await this.prisma.subscription.findUnique({ where: { companyId } });
    if (!subscription) throw new ForbiddenException('Подписка компании не найдена');
    return subscription;
  }
}
