export interface SegmentOption {
  value: string
  label: string
  disabled?: boolean
  /** Подсказка у недоступного сегмента. */
  tip?: string
  /** Счётчик справа от подписи. */
  count?: number | string
}

export interface MetricSeries {
  label: string
  color: string
  fact: (number | null)[]
  plan?: number[]
  suffix?: string
}
