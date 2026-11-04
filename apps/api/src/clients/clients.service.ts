import { Injectable, NotFoundException } from '@nestjs/common';
import { BriefStatus, ClientStatus, Prisma } from '@prisma/client';
import { AuthPayload } from '../auth/auth.types';
import { assertCan, assertOwnerOrHead } from '../access';
import { PrismaService } from '../prisma/prisma.service';
import { projectSlug } from '../projects/slugs';
import { ClientDto } from './dto';

const CLIENT_SLUG: Record<string, string> = {
  cli_holod: 'holod',
  cli_remont: 'smirnov',
  cli_stroy: 'stroytech',
  cli_medlife: 'medlife',
  cli_alfa: 'alfa',
};

const SLUG_CLIENT: Record<string, string> = Object.fromEntries(Object.entries(CLIENT_SLUG).map(([id, slug]) => [slug, id]));

export function resolveClientId(key: string): string {
  return SLUG_CLIENT[key] ?? key;
}

function clientSlug(id: string): string {
  return CLIENT_SLUG[id] ?? id;
}

function money(value: Prisma.Decimal | null): number | null {
  return value == null ? null : Number(value);
}

function dateLabel(date: Date): string {
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function sinceLabel(date: Date, status: ClientStatus): string {
  const formatted = dateLabel(date);
  if (status === ClientStatus.LEAD) return `добавлен ${formatted}`;
  if (status === ClientStatus.PAUSED) return `пауза с ${formatted}`;
  return `с ${formatted}`;
}

@Injectable()
export class ClientsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(actor: AuthPayload) {
    assertCan(actor, 'client.view');
    const rows = await this.prisma.client.findMany({
      where: { companyId: actor.companyId },
      orderBy: { createdAt: 'desc' },
      include: {
        projects: { select: { id: true, name: true, domain: true, status: true } },
        briefs: { orderBy: { createdAt: 'desc' }, take: 1, select: { status: true, createdAt: true } },
      },
    });
    return rows.map((row) => this.present(row));
  }

  async get(actor: AuthPayload, id: string) {
    assertCan(actor, 'client.view');
    const row = await this.find(actor.companyId, id);
    return this.present(row);
  }

  async create(actor: AuthPayload, dto: ClientDto) {
    assertCan(actor, 'client.manage');
    const row = await this.prisma.client.create({
      data: this.data(actor.companyId, dto, dto.status ?? ClientStatus.LEAD),
      include: {
        projects: { select: { id: true, name: true, domain: true, status: true } },
        briefs: { orderBy: { createdAt: 'desc' }, take: 1, select: { status: true, createdAt: true } },
      },
    });
    return this.present(row);
  }

  async update(actor: AuthPayload, id: string, dto: ClientDto) {
    assertCan(actor, 'client.manage');
    const current = await this.find(actor.companyId, id);
    const row = await this.prisma.client.update({
      where: { id: current.id },
      data: this.data(actor.companyId, dto, dto.status ?? current.status),
      include: {
        projects: { select: { id: true, name: true, domain: true, status: true } },
        briefs: { orderBy: { createdAt: 'desc' }, take: 1, select: { status: true, createdAt: true } },
      },
    });
    return this.present(row);
  }

  async archive(actor: AuthPayload, id: string) {
    assertOwnerOrHead(actor);
    const current = await this.find(actor.companyId, id);
    await this.prisma.client.update({
      where: { id: current.id },
      data: { status: ClientStatus.PAUSED },
    });
    return { id: current.id, status: ClientStatus.PAUSED };
  }

  private data(companyId: string, dto: ClientDto, status: ClientStatus): Prisma.ClientCreateInput {
    const rate = dto.ratePerHour?.trim();
    return {
      company: { connect: { id: companyId } },
      name: dto.name.trim(),
      contactPerson: dto.contactPerson.trim(),
      contactEmail: dto.email.trim(),
      contactPhone: dto.phone?.trim() || null,
      contactPosition: dto.contactPosition?.trim() || null,
      inn: dto.inn?.trim() || null,
      city: dto.city?.trim() || null,
      website: dto.website?.trim() || null,
      hourlyRate: rate ? rate : null,
      status,
    };
  }

  private async find(companyId: string, id: string) {
    const row = await this.prisma.client.findFirst({
      where: { id: resolveClientId(id), companyId },
      include: {
        projects: { select: { id: true, name: true, domain: true, status: true } },
        briefs: { orderBy: { createdAt: 'desc' }, take: 1, select: { status: true, createdAt: true } },
      },
    });
    if (!row) throw new NotFoundException('Клиент не найден');
    return row;
  }

  private present(row: {
    id: string;
    name: string;
    status: ClientStatus;
    inn: string | null;
    city: string | null;
    website: string | null;
    hourlyRate: Prisma.Decimal | null;
    contactPerson: string | null;
    contactPosition: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    createdAt: Date;
    projects: { id: string; name: string; domain: string | null; status: string }[];
    briefs: { status: BriefStatus; createdAt: Date }[];
  }) {
    const brief = row.briefs[0];
    const briefDate = brief ? brief.createdAt.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }) : undefined;
    const briefState = !brief || brief.status === BriefStatus.DRAFT ? 'none' : brief.status === BriefStatus.COMPLETED ? 'filled' : 'sent';
    const activeProjects = row.projects.filter((project) => project.status === 'ACTIVE').length;
    return {
      id: row.id,
      slug: clientSlug(row.id),
      name: row.name,
      status: row.status,
      inn: row.inn,
      city: row.city,
      website: row.website,
      ratePerHour: money(row.hourlyRate),
      contactPerson: row.contactPerson ?? '',
      contactPosition: row.contactPosition ?? '',
      phone: row.contactPhone ?? '',
      email: row.contactEmail ?? '',
      since: sinceLabel(row.createdAt, row.status),
      createdAt: row.createdAt,
      activeProjects,
      brief: { state: briefState, date: briefState === 'none' ? undefined : briefDate },
      projects: row.projects.map((project) => ({
        id: projectSlug(project.id),
        name: project.name,
        site: project.domain ?? '',
        status: project.status === 'ACTIVE' ? 'active' : 'paused',
      })),
    };
  }
}
