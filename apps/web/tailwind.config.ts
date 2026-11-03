// Токены эталонного прототипа (assets/app.js).
// accent расписан шкалой: Nuxt UI берёт primary-оттенки 50–950, прототип — accent и accent-hover.
export default {
  content: ['./constants/**/*.ts', './types/**/*.ts'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"SF Pro Display"', 'Inter', '"Segoe UI"', 'Roboto', 'sans-serif']
      },
      colors: {
        canvas: '#f5f5f7',
        ink: '#1d1d1f',
        accent: {
          DEFAULT: '#0071e3',
          hover: '#0077ed',
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcdaff',
          300: '#8ec3ff',
          400: '#59a2ff',
          500: '#0071e3',
          600: '#0077ed',
          700: '#0059b3',
          800: '#004a94',
          900: '#003e7a',
          950: '#00264d'
        }
      },
      boxShadow: {
        card: '0 1px 2px rgba(0,0,0,.04), 0 0 0 1px rgba(0,0,0,.04)',
        pop: '0 24px 64px rgba(0,0,0,.18)'
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        full: '9999px'
      }
    }
  }
}
