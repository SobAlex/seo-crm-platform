import { Injectable } from '@nestjs/common';
import { IntegrationService, IntegrationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsProvider } from './analytics.provider';

const TOKEN_KEYS = ['oauthToken', 'accessToken', 'token'] as const;

function readToken(config: unknown): string | null {
  if (!config || typeof config !== 'object') return null;
  const record = config as Record<string, unknown>;
  for (const key of TOKEN_KEYS) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Яндекс.Метрика. Без OAuth-токена компании или номера счётчика методы возвращают null,
 * чтобы дашборд остался на ручных ProjectMetricFact.
 */
@Injectable()
export class YandexMetrikaDriver implements AnalyticsProvider {
  constructor(private readonly prisma: PrismaService) {}

  async getTraffic(counterId: string, from: Date, to: Date): Promise<number | null> {
    const token = await this.resolveToken(counterId);
    if (!token) return null;
    return this.fetchTotals(token, counterId, 'ym:s:visits', from, to);
  }

  async getLeads(counterId: string, goalIds: string[], from: Date, to: Date): Promise<number | null> {
    const goals = goalIds.filter((id) => /^\d+$/.test(id));
    if (!goals.length) return null;
    const token = await this.resolveToken(counterId);
    if (!token) return null;
    const metrics = goals.map((id) => `ym:s:goal${id}reaches`).join(',');
    return this.fetchTotals(token, counterId, metrics, from, to);
  }

  private async resolveToken(counterId: string): Promise<string | null> {
    const counter = counterId.trim();
    if (!counter) return null;
    const source = await this.prisma.projectSource.findFirst({
      where: { metrikaCounter: counter },
      include: { project: { select: { companyId: true } } },
    });
    if (!source) return null;
    const integration = await this.prisma.companyIntegration.findUnique({
      where: {
        companyId_serviceType: {
          companyId: source.project.companyId,
          serviceType: IntegrationService.YANDEX_METRIKA,
        },
      },
    });
    if (!integration || integration.status === IntegrationStatus.DISCONNECTED) return null;
    return readToken(integration.config);
  }

  private async fetchTotals(token: string, counterId: string, metrics: string, from: Date, to: Date): Promise<number | null> {
    const url = new URL('https://api-metrika.yandex.net/stat/v1/data');
    url.searchParams.set('ids', counterId);
    url.searchParams.set('metrics', metrics);
    url.searchParams.set('date1', isoDay(from));
    url.searchParams.set('date2', isoDay(to));
    try {
      const response = await fetch(url, {
        headers: { Authorization: `OAuth ${token}` },
        signal: AbortSignal.timeout(4000),
      });
      if (!response.ok) return null;
      const body = (await response.json()) as { totals?: unknown[] };
      const totals = Array.isArray(body.totals) ? body.totals : [];
      const sum = totals.reduce<number>((acc, item) => (typeof item === 'number' ? acc + item : acc), 0);
      return totals.length ? Math.round(sum) : null;
    } catch {
      return null;
    }
  }
}
