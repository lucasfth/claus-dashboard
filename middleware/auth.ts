export default defineNuxtRouteMiddleware(async () => {
  if (!import.meta.client) return;

  try {
    const response = await fetch("/api/auth/getToken", {
      credentials: "include",
    });
    if (!response.ok) return navigateTo("/login");
    const data = await response.json();
    if (!data.token) return navigateTo("/login");
  } catch {
    return navigateTo("/login");
  }
});
