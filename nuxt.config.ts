import { loadEnv } from 'vite'

const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '')

export default defineNuxtConfig({
  modules: ['nuxt-auth-utils', '@nuxtjs/tailwindcss'],

  runtimeConfig: {
    session: {
      password: env.NUXT_SESSION_PASSWORD ?? process.env.NUXT_SESSION_PASSWORD ?? '',
    },
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
