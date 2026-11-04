import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import bcrypt from 'bcrypt';
import type { Response } from 'express';
import { PrismaService } from '../prisma/prisma.service';
import { AuthPayload, AuthSession, PublicUser } from './auth.types';
import { toDbRole } from './role-map';

const WEEK = 60 * 60 * 24 * 7;
const MONTH = 60 * 60 * 24 * 30;
const COMPANY_NAME = 'Ромашка Digital';

const COOKIE = 'auth_token';

type MemberWithUser = {
  role: Role;
  companyId: string;
  company: { name: string };
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
    member: { role: Role; companyId: string; company: { name: string } },
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
