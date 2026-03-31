export default defineNuxtRouteMiddleware(async () => {
  if (!import.meta.client) return
  const config = useRuntimeConfig()
  const siteUrl = config.public.convexSiteUrl
  if (!siteUrl) return navigateTo('/login')

  try {
    const response = await fetch(`${siteUrl}/api/auth/getToken`, {
      credentials: 'include',
    })
    if (!response.ok) return navigateTo('/login')
    const data = await response.json()
    if (!data.token) return navigateTo('/login')
  } catch {
    return navigateTo('/login')
  }
})
