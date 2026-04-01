import { ConvexClient } from "convex/browser";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const client = new ConvexClient(config.public.convexUrl);

  client.setAuth(async ({ forceRefreshToken }) => {
    try {
      const url = `/api/auth/getToken${forceRefreshToken ? "?forceRefreshToken=true" : ""}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) return null;
      const data = await response.json();
      return (data.token as string) ?? null;
    } catch {
      return null;
    }
  });

  return { provide: { convex: client } };
});
