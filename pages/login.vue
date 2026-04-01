<script setup lang="ts">
const config = useRuntimeConfig()
const siteUrl = config.public.convexSiteUrl

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const mode = ref<'signIn' | 'signUp'>('signIn')
const signedUp = ref(false)

onMounted(async () => {
  if (!siteUrl) return
  try {
    const response = await fetch(`${siteUrl}/api/auth/getToken`, { credentials: 'include' })
    if (response.ok) {
      const data = await response.json()
      if (data.token) await navigateTo('/feed')
    }
  } catch {}
})

async function submit() {
  if (!siteUrl || !email.value || !password.value) return
  loading.value = true
  error.value = ''
  try {
    const response = await fetch(`${siteUrl}/api/auth/signIn`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'password',
        params: { email: email.value, password: password.value, flow: mode.value },
      }),
    })
    if (response.ok) {
      if (mode.value === 'signUp') {
        signedUp.value = true
      } else {
        await navigateTo('/feed')
      }
    } else {
      const data = await response.json().catch(() => ({}))
      error.value = data.message ?? (mode.value === 'signIn' ? 'Invalid email or password' : 'Could not create account')
    }
  } catch {
    error.value = 'Request failed'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-white dark:bg-[#0a0a0a]">
    <div class="w-full max-w-sm space-y-6 px-4">
      <div class="text-center">
        <h1 class="text-3xl font-bold">⚡ Claus Dashboard</h1>
        <p class="text-gray-500 mt-2 text-sm">{{ mode === 'signIn' ? 'Sign in to continue' : 'Create an account' }}</p>
      </div>

      <div v-if="signedUp" class="text-center space-y-2">
        <p class="text-sm text-gray-700 dark:text-gray-300">Account created.</p>
        <p class="text-sm text-gray-500">Set <code class="bg-gray-100 dark:bg-gray-800 px-1 rounded">approved: true</code> for your user in the Convex dashboard, then sign in.</p>
        <button class="text-sm text-gray-500 underline mt-2" @click="signedUp = false; mode = 'signIn'">Back to sign in</button>
      </div>

      <form v-else class="space-y-3" @submit.prevent="submit">
        <input
          v-model="email"
          type="email"
          placeholder="Email"
          autocomplete="email"
          required
          class="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111] text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
        />
        <input
          v-model="password"
          type="password"
          placeholder="Password"
          autocomplete="current-password"
          required
          class="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111] text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
        />
        <p v-if="error" class="text-red-500 text-xs">{{ error }}</p>
        <button
          type="submit"
          :disabled="loading"
          class="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {{ loading ? '…' : mode === 'signIn' ? 'Sign in' : 'Create account' }}
        </button>
        <p class="text-center text-xs text-gray-400">
          {{ mode === 'signIn' ? 'No account?' : 'Already have one?' }}
          <button type="button" class="underline" @click="mode = mode === 'signIn' ? 'signUp' : 'signIn'; error = ''">
            {{ mode === 'signIn' ? 'Create one' : 'Sign in' }}
          </button>
        </p>
      </form>
    </div>
  </div>
</template>
