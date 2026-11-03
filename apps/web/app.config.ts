// Глобальная тема Nuxt UI 2 под классы прототипа: BTN_PRIMARY / BTN_SECONDARY / BTN_DANGER, FIELD, модалка-шит, тосты.
const FIELD =
  'bg-zinc-50 text-ink border border-black/10 focus:bg-white focus:border-accent focus:ring-4 focus:ring-accent/15 transition duration-150'

export default defineAppConfig({
  ui: {
    primary: 'accent',
    gray: 'zinc',

    button: {
      base: 'focus:outline-none focus-visible:outline-0 disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 flex-shrink-0 transition active:scale-[0.98]',
      rounded: 'rounded-xl',
      size: { '2xs': 'text-[11px]', xs: 'text-xs', sm: 'text-xs', md: 'text-sm', lg: 'text-sm', xl: 'text-base' },
      padding: { '2xs': 'h-7 px-2.5', xs: 'h-8 px-3', sm: 'h-9 px-4', md: 'h-10 px-4', lg: 'h-11 px-5', xl: 'h-12 px-6' },
      square: { '2xs': 'h-7 w-7 justify-center', xs: 'h-8 w-8 justify-center', sm: 'h-9 w-9 justify-center', md: 'h-10 w-10 justify-center', lg: 'h-11 w-11 justify-center', xl: 'h-12 w-12 justify-center' },
      color: {
        white: {
          solid: 'shadow-sm bg-white border border-black/10 text-zinc-800 hover:bg-zinc-50 hover:border-black/15 disabled:bg-white aria-disabled:bg-white focus-visible:ring-4 focus-visible:ring-accent/15',
          ghost: 'text-zinc-700 hover:text-zinc-900 hover:bg-black/5 focus-visible:ring-4 focus-visible:ring-accent/15'
        },
        red: {
          solid: 'shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:bg-red-600 aria-disabled:bg-red-600 focus-visible:ring-4 focus-visible:ring-red-200'
        }
      },
      variant: {
        solid: 'shadow-sm text-white bg-{color}-500 hover:bg-{color}-600 disabled:bg-{color}-500 aria-disabled:bg-{color}-500 focus-visible:ring-4 focus-visible:ring-{color}-500/20'
      }
    },

    input: {
      rounded: 'rounded-xl',
      placeholder: 'placeholder:text-zinc-400',
      size: { '2xs': 'text-xs h-7', xs: 'text-xs h-8', sm: 'text-xs h-9', md: 'text-sm h-10', lg: 'text-sm h-11', xl: 'text-base h-12' },
      padding: { '2xs': 'px-2.5', xs: 'px-3', sm: 'px-3.5', md: 'px-3.5', lg: 'px-4', xl: 'px-4' },
      leading: { padding: { '2xs': 'ps-7', xs: 'ps-8', sm: 'ps-9', md: 'ps-10', lg: 'ps-11', xl: 'ps-12' } },
      color: { white: { outline: FIELD } },
      icon: {
        base: 'flex-shrink-0 text-zinc-400',
        size: { '2xs': 'h-3.5 w-3.5', xs: 'h-4 w-4', sm: 'h-4 w-4', md: 'h-4 w-4', lg: 'h-5 w-5', xl: 'h-5 w-5' }
      }
    },

    select: {
      rounded: 'rounded-xl',
      placeholder: 'text-zinc-400',
      size: { '2xs': 'text-xs h-7', xs: 'text-xs h-8', sm: 'text-xs h-9', md: 'text-sm h-10', lg: 'text-sm h-11', xl: 'text-base h-12' },
      padding: { '2xs': 'px-2.5', xs: 'px-3', sm: 'px-3.5', md: 'px-3.5', lg: 'px-4', xl: 'px-4' },
      color: { white: { outline: FIELD } },
      icon: {
        base: 'flex-shrink-0 text-zinc-400',
        size: { '2xs': 'h-3.5 w-3.5', xs: 'h-4 w-4', sm: 'h-4 w-4', md: 'h-4 w-4', lg: 'h-5 w-5', xl: 'h-5 w-5' }
      }
    },

    textarea: {
      rounded: 'rounded-xl',
      placeholder: 'placeholder:text-zinc-400',
      size: { '2xs': 'text-xs', xs: 'text-xs', sm: 'text-xs', md: 'text-sm', lg: 'text-sm', xl: 'text-base' },
      padding: { '2xs': 'px-2.5 py-1.5', xs: 'px-3 py-2', sm: 'px-3.5 py-2.5', md: 'px-3.5 py-2.5', lg: 'px-4 py-3', xl: 'px-4 py-3' },
      color: { white: { outline: FIELD } }
    },

    toggle: {
      inactive: 'bg-zinc-200',
      ring: 'focus-visible:ring-2 focus-visible:ring-accent/20',
      size: { md: 'h-6 w-10' },
      container: {
        base: 'pointer-events-none relative inline-block rounded-full bg-white shadow-sm transform ring-0 transition-all ease-in-out duration-200',
        active: { md: 'translate-x-4' },
        size: { md: 'h-5 w-5' }
      }
    },

    badge: {
      rounded: 'rounded-full',
      size: { xs: 'text-[10px] px-1.5 py-0.5', sm: 'text-[11px] px-2 py-0.5', md: 'text-xs px-2.5 py-0.5', lg: 'text-sm px-3 py-1' },
      variant: {
        soft: 'bg-{color}-50 text-{color}-700',
        subtle: 'bg-{color}-50 text-{color}-700 ring-1 ring-inset ring-{color}-600/15'
      },
      color: {
        gray: { soft: 'bg-zinc-100 text-zinc-700', solid: 'bg-zinc-100 text-zinc-700' },
        black: { solid: 'bg-zinc-900 text-white' }
      },
      default: { size: 'sm', variant: 'soft', color: 'gray' }
    },

    modal: {
      container: 'flex min-h-full items-end sm:items-center justify-center text-center',
      padding: 'p-4',
      margin: '',
      base: 'relative text-left flex flex-col max-h-[90vh] overflow-hidden',
      overlay: { background: 'bg-black/25 backdrop-blur-md' },
      background: 'bg-white',
      ring: 'ring-1 ring-black/5',
      rounded: 'rounded-t-3xl sm:rounded-3xl',
      shadow: 'shadow-pop',
      width: 'w-full sm:max-w-lg'
    },

    notifications: {
      position: 'top-0 end-0',
      width: 'w-full sm:w-auto sm:min-w-[260px] sm:max-w-sm',
      container: 'px-4 py-4 sm:px-6 sm:py-6 space-y-2'
    },

    notification: {
      background: 'bg-white/90 backdrop-blur-xl',
      rounded: 'rounded-2xl',
      shadow: 'shadow-pop',
      ring: 'ring-1 ring-black/5',
      padding: 'pl-3 pr-2 py-2.5',
      title: 'text-sm font-medium text-zinc-900 leading-snug',
      progress: { base: 'hidden' },
      default: { timeout: 3400 }
    }
  }
})
