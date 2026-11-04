import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthPayload } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { YandexMetrikaDriver } from './yandex-metrika.driver';

const PROJECT_SLUGS: Record<string, string> = {
  holod: 'prj_holod',
  remont: 'prj_remont',
  medlife: 'prj_medlife',
  stroytech: 'prj_stroy',
  holodb2b: 'prj_promo',
};

const MONTHS = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
const MONTHS_FULL = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

interface MonthRow {
  key: string;
  label: string;
  year: number;
  monthIndex: number;
  planTraffic: number;
  planLeads: number;
  planTop10: number;
  factTraffic: number;
  factLeads: number;
  factTop10: number;
}

interface ParsedQuery {
  query: string;
  targetUrl: string | null;
  frequency: number | null;
}

function asNumber(value: { toString(): string } | number | null | undefined): number {
  if (value == null) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function monthKey(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${date.getUTCFullYear()}-${month}`;
}

function monthEnd(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function pct(fact: number, plan: number): number {
  if (!plan) return 0;
  return Math.round((fact / plan) * 100);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function parseLine(line: string): ParsedQuery | null {
  const parts = line.split(';').map((part) => part.trim());
  const query = parts[0] ?? '';
  if (!query) return null;
  let targetUrl: string | null = null;
  let frequency: number | null = null;
  for (const part of parts.slice(1)) {
    if (!part) continue;
    const numeric = part.replace(/\s/g, '').replace(',', '.');
    if (frequency == null && /^\d+(\.\d+)?$/.test(numeric) && !part.startsWith('/')) {
      frequency = Math.round(Number(numeric));
      continue;
    }
    if (!targetUrl) targetUrl = part;
  }
  return { query, targetUrl, frequency };
}

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly metrika: YandexMetrikaDriver,
  ) {}

  async getProjectDashboard(actor: AuthPayload, idParam: string, periodMonth?: string) {
    const project = await this.resolveProject(actor, idParam);
    const [plans, facts, queries] = await Promise.all([
      this.prisma.projectMetricPlan.findMany({ where: { projectId: project.id }, orderBy: { periodMonth: 'asc' } }),
      this.prisma.projectMetricFact.findMany({ where: { projectId: project.id }, orderBy: { periodMonth: 'asc' } }),
      this.prisma.searchQuery.findMany({
        where: { projectId: project.id },
        include: { positions: { orderBy: { checkedAt: 'desc' }, take: 1 } },
      }),
    ]);

    const byMonth = new Map<string, MonthRow>();
    const ensure = (date: Date): MonthRow => {
      const key = monthKey(date);
      const existing = byMonth.get(key);
      if (existing) return existing;
      const row: MonthRow = {
        key,
        label: MONTHS[date.getUTCMonth()] ?? key,
        year: date.getUTCFullYear(),
        monthIndex: date.getUTCMonth(),
        planTraffic: 0,
        planLeads: 0,
        planTop10: 0,
        factTraffic: 0,
        factLeads: 0,
        factTop10: 0,
      };
      byMonth.set(key, row);
      return row;
    };

    for (const plan of plans) {
      const row = ensure(plan.periodMonth);
      row.planTraffic = plan.targetTraffic;
      row.planLeads = plan.targetLeads;
      row.planTop10 = asNumber(plan.targetTop10);
    }
    for (const fact of facts) {
      const row = ensure(fact.periodMonth);
      row.factTraffic = fact.factTraffic;
      row.factLeads = fact.factLeads;
      row.factTop10 = asNumber(fact.factTop10);
    }

    const rows = [...byMonth.values()].sort((a, b) => a.key.localeCompare(b.key));
    const requested = (periodMonth ?? '').slice(0, 7);
    const focusIndex = Math.max(0, rows.findIndex((row) => row.key === requested));
    const focus = rows[requested && rows.some((row) => row.key === requested) ? focusIndex : rows.length - 1];

    let mode: 'live' | 'fallback' = 'fallback';
    const source = await this.prisma.projectSource.findUnique({ where: { projectId: project.id } });
    if (source?.metrikaCounter && focus) {
      const from = new Date(`${focus.key}-01T00:00:00.000Z`);
      const to = monthEnd(from);
      const [traffic, leads] = await Promise.all([
        this.metrika.getTraffic(source.metrikaCounter, from, to).catch(() => null),
        this.metrika.getLeads(source.metrikaCounter, source.goalIds, from, to).catch(() => null),
      ]);
      if (traffic != null) {
        focus.factTraffic = traffic;
        mode = 'live';
      }
      if (leads != null) {
        focus.factLeads = leads;
        mode = 'live';
      }
    }

    const total = queries.length;
    const inTop = queries.filter((item) => item.positions[0] && item.positions[0].position <= 10).length;
    const visibilityTop10 = total > 0 ? round1((inTop / total) * 100) : null;
    const kpiSource = focus ?? {
      factTraffic: 0,
      planTraffic: 0,
      factLeads: 0,
      planLeads: 0,
      factTop10: 0,
      planTop10: 0,
    };

    const first = rows[0];
    const last = rows[rows.length - 1];
    const periodLabel = !first || !last
      ? ''
      : first.year === last.year
        ? `${MONTHS_FULL[first.monthIndex]}–${MONTHS_FULL[last.monthIndex].toLowerCase()} ${first.year}`
        : `${MONTHS_FULL[first.monthIndex]} ${first.year}–${MONTHS_FULL[last.monthIndex].toLowerCase()} ${last.year}`;

    return {
      projectId: project.id,
      mode,
      periodLabel,
      visibilityTop10,
      months: rows.map((row) => row.label),
      series: {
        traffic: { fact: rows.map((row) => row.factTraffic), plan: rows.map((row) => row.planTraffic) },
        leads: { fact: rows.map((row) => row.factLeads), plan: rows.map((row) => row.planLeads) },
        top10: { fact: rows.map((row) => row.factTop10), plan: rows.map((row) => row.planTop10) },
      },
      kpi: {
        traffic: { fact: kpiSource.factTraffic, plan: kpiSource.planTraffic, pct: pct(kpiSource.factTraffic, kpiSource.planTraffic) },
        leads: { fact: kpiSource.factLeads, plan: kpiSource.planLeads, pct: pct(kpiSource.factLeads, kpiSource.planLeads) },
        top10: { fact: kpiSource.factTop10, plan: kpiSource.planTop10, pct: pct(kpiSource.factTop10, kpiSource.planTop10) },
      },
    };
  }

  async getMarkerQueries(actor: AuthPayload, idParam: string) {
    const project = await this.resolveProject(actor, idParam);
    const [markers, total, positioned] = await Promise.all([
      this.prisma.searchQuery.findMany({
        where: { projectId: project.id, isMarker: true },
        orderBy: { createdAt: 'asc' },
        take: 10,
        include: { positions: { orderBy: { checkedAt: 'desc' }, take: 2 } },
      }),
      this.prisma.searchQuery.count({ where: { projectId: project.id } }),
      this.prisma.searchQuery.findMany({
        where: { projectId: project.id },
        include: { positions: { orderBy: { checkedAt: 'desc' }, take: 1 } },
      }),
    ]);
    const inTop = positioned.filter((item) => item.positions[0] && item.positions[0].position <= 10).length;
    return {
      visibilityTop10: total > 0 ? round1((inTop / total) * 100) : null,
      items: markers.map((item) => {
        const current = item.positions[0]?.position ?? null;
        const previous = item.positions[1]?.position ?? null;
        return {
          id: item.id,
          query: item.query,
          targetUrl: item.targetUrl,
          frequency: item.frequency,
          position: current,
          previousPosition: previous,
          delta: current != null && previous != null ? previous - current : null,
        };
      }),
    };
  }

  async importQueries(actor: AuthPayload, idParam: string, rawText: string) {
    const project = await this.resolveProject(actor, idParam);
    const parsed = rawText
      .split(/\r?\n/)
      .map((line) => parseLine(line.trim()))
      .filter((line): line is ParsedQuery => line != null)
      .slice(0, 500);
    if (!parsed.length) {
      throw new BadRequestException('Добавьте хотя бы одну поисковую фразу');
    }
    const markerCount = Math.min(parsed.length, 10);
    await this.prisma.$transaction(async (tx) => {
      await tx.searchQuery.deleteMany({ where: { projectId: project.id } });
      for (let index = 0; index < parsed.length; index += 1) {
        const row = parsed[index]!;
        await tx.searchQuery.create({
          data: {
            projectId: project.id,
            query: row.query,
            targetUrl: row.targetUrl,
            frequency: row.frequency,
            isMarker: index < markerCount,
          },
        });
      }
    });
    return { imported: parsed.length, markers: markerCount };
  }

  async getSource(actor: AuthPayload, idParam: string) {
    const project = await this.resolveProject(actor, idParam);
    const source = await this.prisma.projectSource.findUnique({ where: { projectId: project.id } });
    return {
      metrikaCounter: source?.metrikaCounter ?? null,
      goalIds: source?.goalIds ?? [],
      searchEngine: source?.searchEngine ?? 'YANDEX',
      regionId: source?.regionId ?? null,
      isAutoSync: source?.isAutoSync ?? false,
      lastSyncAt: source?.lastSyncAt ?? null,
    };
  }

  async updateSource(actor: AuthPayload, idParam: string, input: { metrikaCounter?: string; goalIds?: string[] }) {
    const project = await this.resolveProject(actor, idParam);
    const metrikaCounter = input.metrikaCounter === undefined ? undefined : input.metrikaCounter.trim() || null;
    const goalIds = input.goalIds?.map((id) => id.trim()).filter((id) => id.length > 0);
    const source = await this.prisma.projectSource.upsert({
      where: { projectId: project.id },
      create: {
        projectId: project.id,
        metrikaCounter: metrikaCounter ?? null,
        goalIds: goalIds ?? [],
      },
      update: {
        ...(metrikaCounter !== undefined ? { metrikaCounter } : {}),
        ...(goalIds !== undefined ? { goalIds } : {}),
      },
    });
    return {
      metrikaCounter: source.metrikaCounter,
      goalIds: source.goalIds,
      searchEngine: source.searchEngine,
      regionId: source.regionId,
      isAutoSync: source.isAutoSync,
      lastSyncAt: source.lastSyncAt,
    };
  }

  private async resolveProject(actor: AuthPayload, idParam: string) {
    const mapped = PROJECT_SLUGS[idParam] ?? idParam;
    const candidates = [...new Set([mapped, idParam, `prj_${idParam}`])];
    const project = await this.prisma.project.findFirst({
      where: { companyId: actor.companyId, id: { in: candidates } },
    });
    if (!project) throw new NotFoundException('Проект не найден');
    return project;
  }
}
