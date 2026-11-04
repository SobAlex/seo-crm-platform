import { Injectable } from '@nestjs/common';
import { AuthPayload } from '../auth/auth.types';
import { BillingService } from '../billing/billing.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto';
import { projectSlug } from './slugs';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billing: BillingService,
  ) {}

  async list(actor: AuthPayload) {
    const rows = await this.prisma.project.findMany({
      where: { companyId: actor.companyId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        domain: true,
        client: { select: { name: true } },
      },
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      domain: row.domain,
      clientName: row.client?.name ?? '',
      slug: projectSlug(row.id),
    }));
  }

  async create(actor: AuthPayload, dto: CreateProjectDto) {
    await this.billing.assertProjectCapacity(actor.companyId);
    const project = await this.prisma.project.create({
      data: {
        companyId: actor.companyId,
        name: dto.name.trim(),
        domain: dto.domain?.trim() || null,
        targetKpis: [],
      },
    });
    return { id: project.id, name: project.name, domain: project.domain };
  }
}
