export interface ConfirmOptions {
  /** Главная строка: «Удалить работу?» (data-confirm). */
  title: string
  /** Пояснение (data-confirm-text). */
  text?: string
  /** Подпись кнопки (data-confirm-ok). */
  ok?: string
  /** Тост после подтверждения (data-confirm-toast). false — без тоста. */
  toast?: string | false
}

interface ConfirmState extends ConfirmOptions {
  open: boolean
}

export const CONFIRM_DEFAULT_TEXT = 'Это действие необратимо. Связанные данные будут удалены или переведены в архив.'

let resolver: ((ok: boolean) => void) | null = null

/** Единая деструктивная модалка (confirm / confirm-sheet прототипа). Рендерится в layouts/default.vue. */
export function useConfirm() {
  const state = useState<ConfirmState>('confirm-sheet', () => ({ open: false, title: '' }))

  function confirm(options: ConfirmOptions): Promise<boolean> {
    resolver?.(false)
    state.value = { ...options, open: true }
    return new Promise(resolve => {
      resolver = resolve
    })
  }

  function settle(ok: boolean) {
    state.value = { ...state.value, open: false }
    const r = resolver
    resolver = null
    r?.(ok)
  }

  return { state, confirm, settle }
}
