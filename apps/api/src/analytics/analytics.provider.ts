/** Контракт внешнего источника трафика и лидов. null — данных нет, сервис берёт ручные факты. */
export interface AnalyticsProvider {
  getTraffic(counterId: string, from: Date, to: Date): Promise<number | null>;
  getLeads(counterId: string, goalIds: string[], from: Date, to: Date): Promise<number | null>;
}
