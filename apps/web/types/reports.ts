/** График отчёта по дням месяца (CHARTS в report.html). */
export interface ReportChartData {
  title: string
  label: string
  color: string
  summary: string
  fact: number[]
  plan: number[]
  yLabels: string[]
}

/** Работа в отчёте: категория, заголовок, текст. html — только для доверенных mock-строк. */
export interface ReportWork {
  id: string
  category: string
  title: string
  text?: string
  html?: string
}
