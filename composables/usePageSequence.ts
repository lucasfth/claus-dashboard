// Ordered list of navigable pages
const PAGE_SEQUENCE = ['tasks', 'polybot', 'bridget', 'commands', 'feed']

export function usePageSequence() {
  const router = useRouter()
  const route = useRoute()

  /**
   * Get the current page name from the route
   */
  function getCurrentPageIndex(): number {
    const path = route.path.replace('/', '')
    return PAGE_SEQUENCE.indexOf(path)
  }

  /**
   * Navigate to the next page in sequence (circular)
   */
  function goToNextPage(): void {
    const currentIndex = getCurrentPageIndex()
    if (currentIndex === -1) return

    const nextIndex = (currentIndex + 1) % PAGE_SEQUENCE.length
    const nextPage = PAGE_SEQUENCE[nextIndex]
    router.push(`/${nextPage}`)
  }

  /**
   * Navigate to the previous page in sequence (circular)
   */
  function goToPreviousPage(): void {
    const currentIndex = getCurrentPageIndex()
    if (currentIndex === -1) return

    const prevIndex = (currentIndex - 1 + PAGE_SEQUENCE.length) % PAGE_SEQUENCE.length
    const prevPage = PAGE_SEQUENCE[prevIndex]
    router.push(`/${prevPage}`)
  }

  return {
    getCurrentPageIndex,
    goToNextPage,
    goToPreviousPage,
    PAGE_SEQUENCE,
  }
}
