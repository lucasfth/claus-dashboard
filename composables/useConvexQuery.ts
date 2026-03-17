import type { FunctionReference } from 'convex/server'
import type { FunctionArgs, FunctionReturnType } from 'convex/server'

export function useConvexQuery<T extends FunctionReference<'query'>>(
  query: T,
  args: FunctionArgs<T>,
) {
  const { $convex } = useNuxtApp()
  const data = ref<FunctionReturnType<T> | undefined>(undefined)

  let unsubscribe: (() => void) | undefined

  onMounted(() => {
    unsubscribe = ($convex as ConvexClient).subscribe(
      query,
      args,
      {
        onUpdate(value: FunctionReturnType<T>) {
          data.value = value
        },
      },
    )
  })

  onUnmounted(() => unsubscribe?.())

  return data
}
