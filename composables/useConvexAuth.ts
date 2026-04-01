export function useConvexAuth() {
  const loggedIn = ref(false);

  onMounted(async () => {
    try {
      const response = await fetch("/api/auth/getToken", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        loggedIn.value = !!data.token;
      }
    } catch {}
  });

  async function clear() {
    try {
      await fetch("/api/auth/signOut", {
        method: "POST",
        credentials: "include",
      });
    } catch {}
    loggedIn.value = false;
  }

  return { loggedIn, clear };
}
