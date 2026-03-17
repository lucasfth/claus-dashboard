export default defineNuxtConfig({
  modules: ['nuxt-auth-utils', '@nuxtjs/tailwindcss'],

  runtimeConfig: {
    session: {
      password: process.env.NUXT_SESSION_PASSWORD ?? '',
    },
    convexHttpUrl: '',
    bridgeSecret: '',
    public: {
      convexUrl: '',
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
