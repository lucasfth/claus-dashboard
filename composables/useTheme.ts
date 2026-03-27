export function useTheme() {
  const isDark = useState<boolean>('isDark', () => true)

  function applyTheme(dark: boolean) {
    if (!import.meta.client) return
    document.documentElement.classList.toggle('dark', dark)
    try { localStorage.setItem('theme', dark ? 'dark' : 'light') } catch {}
  }

  function init() {
    if (!import.meta.client) return
    const saved = localStorage.getItem('theme')
    const dark = saved !== null ? saved === 'dark' : true
    isDark.value = dark
    applyTheme(dark)
  }

  function toggle() {
    isDark.value = !isDark.value
    applyTheme(isDark.value)
  }

  return { isDark, init, toggle }
}
