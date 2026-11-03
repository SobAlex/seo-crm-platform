// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: true,
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  tailwindcss: {
    configPath: 'tailwind.config.ts'
  },
  colorMode: {
    preference: 'light',
    fallback: 'light'
  },
  app: {
    head: {
      htmlAttrs: { lang: 'ru', class: 'overflow-x-hidden' },
      bodyAttrs: { class: 'bg-canvas text-ink antialiased overflow-x-hidden' },
      title: 'SEO Control',
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }]
    }
  }
})
