export function useSwipeNavigation() {
  const { goToNextPage, goToPreviousPage } = usePageSequence()

  // Configuration
  const MIN_SWIPE_DISTANCE = 100
  let touchStartX = 0
  let touchEndX = 0
  let isProcessing = false

  // Track swipe direction for animation
  const swipeDirection = ref<'left' | 'right' | null>(null)

  /**
   * Handle touch start event
   */
  function handleTouchStart(event: TouchEvent): void {
    if (isProcessing) return
    touchStartX = event.changedTouches[0].clientX
  }

  /**
   * Handle touch end event and determine swipe direction
   */
  function handleTouchEnd(event: TouchEvent): void {
    if (isProcessing) return

    touchEndX = event.changedTouches[0].clientX
    const distance = touchStartX - touchEndX

    // Ignore small movements (accidental touches)
    if (Math.abs(distance) < MIN_SWIPE_DISTANCE) {
      return
    }

    // Prevent rapid consecutive swipes
    isProcessing = true
    setTimeout(() => {
      isProcessing = false
    }, 400) // Slightly longer than transition duration

    // Swipe left: navigate to next page
    if (distance > 0) {
      swipeDirection.value = 'left'
      goToNextPage()
    }
    // Swipe right: navigate to previous page
    else {
      swipeDirection.value = 'right'
      goToPreviousPage()
    }
  }

  /**
   * Register touch listeners on an element
   */
  function registerSwipeListener(element: HTMLElement | null): void {
    if (!element) return

    element.addEventListener('touchstart', handleTouchStart, false)
    element.addEventListener('touchend', handleTouchEnd, false)
  }

  /**
   * Unregister touch listeners from an element
   */
  function unregisterSwipeListener(element: HTMLElement | null): void {
    if (!element) return

    element.removeEventListener('touchstart', handleTouchStart)
    element.removeEventListener('touchend', handleTouchEnd)
  }

  return {
    registerSwipeListener,
    unregisterSwipeListener,
    swipeDirection,
  }
}
