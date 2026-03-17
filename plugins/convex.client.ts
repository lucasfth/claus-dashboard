import { ConvexClient } from 'convex/browser'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const client = new ConvexClient(config.public.convexUrl)
  return { provide: { convex: client } }
})
