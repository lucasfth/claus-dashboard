import { loadEnv } from 'vite'

const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '')

export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],

  app: {
    head: {
      title: 'Claus Dashboard',
      meta: [
        { name: 'description', content: 'A dashboard for Claus' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
      ],
    },
  },

  runtimeConfig: {
    convexHttpUrl:
      env.NUXT_CONVEX_HTTP_URL ??
      env.CONVEX_SITE_URL ??
      process.env.NUXT_CONVEX_HTTP_URL ??
      process.env.CONVEX_SITE_URL ??
      '',
    bridgeSecret: env.BRIDGE_SECRET ?? process.env.BRIDGE_SECRET ?? '',
    public: {
      convexUrl:
        env.NUXT_PUBLIC_CONVEX_URL ??
        env.CONVEX_URL ??
        process.env.NUXT_PUBLIC_CONVEX_URL ??
        process.env.CONVEX_URL ??
        '',
      convexSiteUrl:
        env.CONVEX_SITE_URL ??
        env.NUXT_CONVEX_HTTP_URL ??
        process.env.CONVEX_SITE_URL ??
        process.env.NUXT_CONVEX_HTTP_URL ??
        '',
    },
  },

  tailwindcss: {
    config: {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            bg: '#0a0a0a',
          },
        },
      },
    },
  },

  compatibilityDate: '2024-07-01',
})
