export type ToastTone = 'success' | 'warning' | 'error' | 'info'

const TONES: Record<ToastTone, { color: string; icon: string }> = {
  success: { color: 'emerald', icon: 'i-heroicons-check-circle-20-solid' },
  warning: { color: 'amber', icon: 'i-heroicons-exclamation-circle-20-solid' },
  error: { color: 'red', icon: 'i-heroicons-x-circle-20-solid' },
  info: { color: 'gray', icon: 'i-heroicons-information-circle-20-solid' }
}

const TOAST_ERROR = /^(Заполните|Проверьте|Напишите|Добавьте|Укажите|Выберите|Сначала|Нельзя|Недоступно|Недостаточно|Нет доступа|Ошибка|Не удалось|Принятые задачи не|Порученную задачу|Вернуть из проверки|Вставьте|Файл слишком)/
const TOAST_WARNING = /доработк|ждёт клиента|пауз|отключ|в архив|снят[ао]? с|отменен/i
const TOAST_SUCCESS = /принят|сохран|создан|отправлен|добавлен|подключ|оформлен|скопир|приглаш|передан|загружен|обновл|прикреплён|удален|удалён|готов|запущен|собран|включ|назначен|перенесен|перенесён|→/i

export function toastTone(msg: string): ToastTone {
  if (TOAST_ERROR.test(msg)) return 'error'
  if (TOAST_WARNING.test(msg)) return 'warning'
  if (TOAST_SUCCESS.test(msg)) return 'success'
  return 'info'
}

/** SEOApp.toast прототипа поверх useToast из Nuxt UI. Тон без явного указания определяется по тексту. */
export function useNotify() {
  const toast = useToast()
  return function notify(msg: string, tone?: ToastTone) {
    if (!msg) return
    const t = TONES[tone ?? toastTone(msg)]
    toast.add({ title: msg, color: t.color as never, icon: t.icon, timeout: tone === 'error' ? 4200 : 3400 })
  }
}
