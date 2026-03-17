import type { FunctionReference } from 'convex/server'
import type { FunctionArgs, FunctionReturnType } from 'convex/server'

export function useConvexMutation<T extends FunctionReference<'mutation'>>(
  mutation: T,
) {
  const { $convex } = useNuxtApp()

  return async (args: FunctionArgs<T>): Promise<FunctionReturnType<T>> => {
    return ($convex as ConvexClient).mutation(mutation, args)
  }
}
