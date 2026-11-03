// Классы и хелперы прототипа (assets/app.js) для мест, где нужен сырой элемент, а не компонент Nuxt UI.
export const FIELD = 'w-full h-9 px-3.5 rounded-xl border border-black/10 bg-zinc-50 text-xs text-ink placeholder:text-zinc-400 focus:outline-none focus:bg-white focus:border-accent focus:ring-4 focus:ring-accent/15 transition duration-150'
export const BTN_PRIMARY = 'h-9 px-4 rounded-xl bg-accent text-white text-xs font-medium hover:bg-accent-hover transition shadow-sm active:scale-[0.98]'
export const BTN_SECONDARY = 'h-9 px-4 rounded-xl bg-white border border-black/10 text-zinc-800 text-xs font-medium hover:bg-zinc-50 hover:border-black/15 transition shadow-sm active:scale-[0.98]'
export const BTN_DANGER = 'h-9 px-4 rounded-xl bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition shadow-sm active:scale-[0.98]'
export const CARD = 'bg-white rounded-2xl shadow-card'
export const SEG_ON = 'bg-white text-ink shadow-sm'
export const SEG_OFF = 'text-zinc-500 hover:text-zinc-900'
export const RICH = 'text-sm text-zinc-700 leading-relaxed break-words [&_b]:font-semibold [&_b]:text-zinc-900 [&_strong]:font-semibold [&_i]:italic [&_em]:italic [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 [&_li]:my-0.5 [&_a]:text-accent [&_a]:underline [&_p+p]:mt-1.5'

export const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь']

export function plural(n: number, forms: [string, string, string]): string {
  const m10 = n % 10
  const m100 = n % 100
  return forms[m10 === 1 && m100 !== 11 ? 0 : m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20) ? 1 : 2]
}

export function fmtNum(v: number, suffix = ''): string {
  return (Math.round(v * 10) / 10).toLocaleString('ru-RU') + suffix
}
