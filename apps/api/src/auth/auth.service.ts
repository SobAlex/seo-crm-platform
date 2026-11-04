import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PlanTier, Prisma, Role, SubscriptionStatus } from '@prisma/client';
import bcrypt from 'bcrypt';
import type { Response } from 'express';
import { TRIAL_LIMITS } from '../billing/plans';
import { PrismaService } from '../prisma/prisma.service';
import { AuthPayload, AuthSession, PublicUser } from './auth.types';
import { assertCan } from '../access';
import { RegisterCompanyDto, UpdateCompanyDto, UpdateProfileDto } from './dto';
import { toDbRole } from './role-map';

const WEEK = 60 * 60 * 24 * 7;
const MONTH = 60 * 60 * 24 * 30;
const COMPANY_NAME = 'Ромашка Digital';

const COOKIE = 'auth_token';

type MemberWithUser = {
  role: Role;
  companyId: string;
  company: { name: string; inn: string | null; address: string | null; city: string | null; email: string | null };
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    telegram: string | null;
    avatar: string | null;
    passwordHash: string;
  };
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async login(email: string, password: string, remember = false): Promise<AuthSession> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { memberships: { include: { company: true }, orderBy: { createdAt: 'asc' } } },
    });
    const member = user?.memberships[0];
    const ok = user ? await this.passwordMatches(user.passwordHash, password) : false;
    if (!user || !member || !ok) {
      throw new UnauthorizedException('Неверный email или пароль');
    }
    if (!member.isActive) {
      throw new ForbiddenException('Учётная запись отключена');
    }
    return this.issue(this.pack(user, member), remember);
  }

  async me(payload: AuthPayload): Promise<PublicUser> {
    const member = await this.prisma.companyMember.findUnique({
      where: { companyId_userId: { companyId: payload.companyId, userId: payload.sub } },
      include: { user: true, company: true },
    });
    if (!member || !member.isActive) {
      throw new UnauthorizedException('Нужно войти в систему');
    }
    return this.pack(member.user, member);
  }

  async updateProfile(actor: AuthPayload, dto: UpdateProfileDto): Promise<PublicUser> {
    const data: Prisma.UserUpdateInput = {};
    if (dto.firstName?.trim()) data.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) data.lastName = dto.lastName.trim();
    if (dto.phone !== undefined) data.phone = dto.phone.trim() || null;
    if (dto.telegram !== undefined) data.telegram = dto.telegram.trim() || null;
    if (dto.email?.trim()) data.email = dto.email.trim().toLowerCase();
    try {
      await this.prisma.user.update({ where: { id: actor.sub }, data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Этот email уже занят');
      }
      throw error;
    }
    return this.me(actor);
  }

  async updateCompany(actor: AuthPayload, dto: UpdateCompanyDto): Promise<PublicUser> {
    assertCan(actor, 'company.profile.manage');
    await this.prisma.company.update({
      where: { id: actor.companyId },
      data: {
        name: dto.name.trim(),
        inn: dto.inn?.trim() || null,
        city: dto.city?.trim() || null,
        address: dto.address?.trim() || null,
        email: dto.email?.trim() || null,
      },
    });
    return this.me(actor);
  }

  /** Dev-переключатель: JWT пользователя «Ромашка Digital» с выбранной ролью. */
  async devSwitch(role: string): Promise<AuthSession> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Переключатель ролей доступен только в разработке');
    }
    const dbRole = toDbRole(role);
    if (!dbRole) throw new BadRequestException('Неизвестная роль');

    const company = await this.prisma.company.findFirst({ where: { name: COMPANY_NAME } });
    if (!company) throw new BadRequestException(`Компания «${COMPANY_NAME}» не найдена`);

    const members = await this.prisma.companyMember.findMany({
      where: { companyId: company.id, role: dbRole, isActive: true },
      include: { user: true, company: true },
    });
    members.sort((a, b) => a.user.createdAt.getTime() - b.user.createdAt.getTime());
    const member = members[0];
    if (!member) {
      throw new BadRequestException(`В компании «${COMPANY_NAME}» нет пользователя с этой ролью`);
    }
    return this.issue(this.pack(member.user, member), false);
  }

  async registerCompany(dto: RegisterCompanyDto): Promise<AuthSession> {
    const email = dto.email.trim().toLowerCase();
    const companyName = dto.companyName.trim();
    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();
    if (!companyName || !firstName || !lastName) {
      throw new BadRequestException('Заполните название компании, имя и фамилию');
    }
    const taken = await this.prisma.user.findUnique({ where: { email } });
    if (taken) throw new ConflictException('Пользователь с таким email уже есть');

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const expiresAt = new Date(Date.now() + TRIAL_LIMITS.days * 24 * 60 * 60 * 1000);
    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email, passwordHash, firstName, lastName },
      });
      const company = await tx.company.create({ data: { name: companyName } });
      await tx.companyMember.create({
        data: { companyId: company.id, userId: user.id, role: Role.owner },
      });
      await tx.subscription.create({
        data: {
          companyId: company.id,
          plan: PlanTier.TRIAL,
          status: SubscriptionStatus.ACTIVE,
          maxProjects: TRIAL_LIMITS.maxProjects,
          maxMembers: TRIAL_LIMITS.maxMembers,
          expiresAt,
        },
      });
      await tx.project.create({
        data: { companyId: company.id, name: 'Мой первый проект', targetKpis: [] },
      });
      return { userId: user.id, companyId: company.id };
    });
    return this.sessionFor(created.userId, created.companyId);
  }

  async sessionFor(userId: string, companyId: string): Promise<AuthSession> {
    const member = await this.prisma.companyMember.findUnique({
      where: { companyId_userId: { companyId, userId } },
      include: { user: true, company: true },
    });
    if (!member) throw new UnauthorizedException('Нужно войти в систему');
    return this.issue(this.pack(member.user, member), false);
  }

  setAuthCookie(res: Response, token: string, remember = false): void {
    const seconds = remember ? MONTH : WEEK;
    res.cookie(COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: seconds * 1000,
    });
  }

  clearAuthCookie(res: Response): void {
    res.clearCookie(COOKIE, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    });
  }

  private async issue(user: PublicUser, remember: boolean): Promise<AuthSession> {
    const seconds = remember ? MONTH : WEEK;
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, companyId: user.companyId, role: user.role },
      { expiresIn: seconds },
    );
    return { accessToken, user };
  }

  private pack(
    user: MemberWithUser['user'],
    member: {
      role: Role;
      companyId: string;
      company: { name: string; inn: string | null; address: string | null; city: string | null; email: string | null };
    },
  ): PublicUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: member.role,
      companyId: member.companyId,
      phone: user.phone,
      telegram: user.telegram,
      avatar: user.avatar,
      companyName: member.company.name,
      companyInn: member.company.inn ?? null,
      companyCity: member.company.city ?? null,
      companyAddress: member.company.address ?? null,
      companyEmail: member.company.email ?? null,
    };
  }

  private async passwordMatches(hash: string, password: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hash);
    } catch {
      return false;
    }
  }
}
