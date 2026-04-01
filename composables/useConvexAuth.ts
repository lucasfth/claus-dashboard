export function useConvexAuth() {
  const config = useRuntimeConfig()
  const siteUrl = config.public.convexSiteUrl

  const loggedIn = ref(false)

  onMounted(async () => {
    if (!siteUrl) return
    try {
      const response = await fetch(`${siteUrl}/api/auth/getToken`, { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        loggedIn.value = !!data.token
      }
    } catch {}
  })

  async function clear() {
    if (!siteUrl) return
    try {
      await fetch(`${siteUrl}/api/auth/signOut`, { method: 'POST', credentials: 'include' })
    } catch {}
    loggedIn.value = false
  }

  return { loggedIn, clear }
}
