export function useTheme() {
  const isDark = useState<boolean>('isDark', () => true)

  function applyTheme(dark: boolean) {
    if (!import.meta.client) return
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem('theme', dark ? 'dark' : 'light') } catch (e) {
      console.warn('[useTheme] Could not persist theme to localStorage:', e)
    }
  }

  function init() {
    if (!import.meta.client) return
    try {
      const saved = localStorage.getItem('theme')
      // Default to dark mode when no preference is saved
      const dark = saved === null || saved === 'dark'
      isDark.value = dark
      applyTheme(dark)
    } catch (e) {
      console.warn('[useTheme] Could not read theme from localStorage:', e)
      applyTheme(true)
    }
  }

  function toggle() {
    isDark.value = !isDark.value
    applyTheme(isDark.value)
  }

  return { isDark, init, toggle }
}
