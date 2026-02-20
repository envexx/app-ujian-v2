// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxtjs/color-mode',
    '@pinia/nuxt',
    '@vueuse/nuxt',
    '@nuxt/image',
    '@nuxt/icon',
  ],

  css: ['~/assets/css/main.css',
        'katex/dist/katex.min.css'
  ],

  colorMode: {
    classSuffix: '',
    preference: 'light',
    fallback: 'light',
  },

  runtimeConfig: {
    public: {
      apiUrl: process.env.NUXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    },
  },

  app: {
    head: {
      title: 'Nilai Online',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Platform ujian dan pembelajaran digital oleh PT Core Solution Digital' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/icon/logo-no-bg-png-blue.png' },
      ],
    },
  },

  // Cloudflare Pages preset
  nitro: {
    preset: 'cloudflare-pages',
  },

  typescript: {
    strict: true,
  },

  vite: {
    optimizeDeps: {
      include: ['leader-line-new'],
    },
  },

  imports: {
    dirs: ['composables', 'composables/**', 'stores', 'utils'],
  },

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],
})
