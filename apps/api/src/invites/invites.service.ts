import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InvitationStatus, Prisma, Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomUUID } from 'node:crypto';
import { AuthPayload, AuthSession } from '../auth/auth.types';
import { AuthService } from '../auth/auth.service';
import { LEAD_ROLES, roleLabel, toDbRole } from '../auth/role-map';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterByInviteDto } from '../auth/dto';
import { CreateInviteDto } from './dto';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class InvitesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly mail: MailService,
  ) {}

  async create(actor: AuthPayload, dto: CreateInviteDto) {
    const actorRole = toDbRole(actor.role);
    if (!actorRole || !LEAD_ROLES.includes(actorRole)) {
      throw new ForbiddenException('Приглашать может владелец или руководитель');
    }
    const role = toDbRole(dto.role);
    if (!role || role === Role.owner) {
      throw new BadRequestException('Эту роль нельзя выдать приглашением');
    }

    const email = dto.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException('Пользователь с таким email уже есть');
    }

    const firstName = cleanName(dto.firstName);
    const lastName = cleanName(dto.lastName);
    const token = randomUUID();
    const invite = await this.prisma.invitation.create({
      data: {
        companyId: actor.companyId,
        email,
        role,
        firstName,
        lastName,
        token,
        status: InvitationStatus.PENDING,
        expiresAt: new Date(Date.now() + WEEK_MS),
      },
    });

    const [actorUser, company] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: actor.sub } }),
      this.prisma.company.findUnique({ where: { id: actor.companyId } }),
    ]);
    const link = `${process.env.WEB_ORIGIN || 'http://localhost:3000'}/register?token=${token}`;
    const recipientName = [firstName, lastName].filter(Boolean).join(' ');
    await this.mail.sendInvite(email, {
      inviteUrl: link,
      inviterName: actorUser ? `${actorUser.firstName} ${actorUser.lastName}`.trim() : 'Коллега',
      companyName: company?.name ?? '',
      roleName: roleLabel(role),
      recipientName,
    });

    return {
      success: true as const,
      message: 'Приглашение отправлено',
      id: invite.id,
      email: invite.email,
    };
  }

  async validate(token: string) {
    const invite = await this.findOpen(token);
    const company = await this.prisma.company.findUnique({ where: { id: invite.companyId } });
    return {
      email: invite.email,
      role: invite.role,
      firstName: invite.firstName,
      lastName: invite.lastName,
      companyName: company?.name ?? '',
    };
  }

  async register(dto: RegisterByInviteDto): Promise<AuthSession> {
    const invite = await this.findOpen(dto.token);
    const email = invite.email.trim().toLowerCase();
    const taken = await this.prisma.user.findUnique({ where: { email } });
    if (taken) throw new ConflictException('Пользователь с таким email уже есть');

    const firstName = dto.firstName.trim() || invite.firstName?.trim() || '';
    const lastName = dto.lastName.trim() || invite.lastName?.trim() || '';
    if (!firstName) throw new BadRequestException('Укажите имя');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            email,
            passwordHash,
            firstName,
            lastName,
          },
        });
        await tx.companyMember.create({
          data: {
            companyId: invite.companyId,
            userId: created.id,
            role: invite.role,
          },
        });
        await tx.invitation.update({
          where: { id: invite.id },
          data: { status: InvitationStatus.ACCEPTED },
        });
        return created;
      });
      return this.auth.sessionFor(user.id, invite.companyId);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Пользователь с таким email уже есть');
      }
      throw error;
    }
  }

  private async findOpen(token: string) {
    const value = token.trim();
    if (!value) throw new BadRequestException('Ссылка приглашения неполная');
    const invite = await this.prisma.invitation.findUnique({ where: { token: value } });
    if (!invite) throw new BadRequestException('Приглашение не найдено');
    if (invite.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Приглашение уже принято');
    }
    if (invite.expiresAt.getTime() <= Date.now()) {
      await this.prisma.invitation.update({
        where: { id: invite.id },
        data: { status: InvitationStatus.EXPIRED },
      });
      throw new BadRequestException('Срок приглашения истёк');
    }
    return invite;
  }
}

function cleanName(value?: string): string | null {
  const text = value?.trim();
  return text ? text : null;
}
