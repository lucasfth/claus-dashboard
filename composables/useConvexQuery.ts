import type { ConvexClient } from "convex/browser";
import type { FunctionReference } from "convex/server";
import type { FunctionArgs, FunctionReturnType } from "convex/server";

export function useConvexQuery<T extends FunctionReference<"query">>(
  query: T,
  args: FunctionArgs<T>,
) {
  const { $convex } = useNuxtApp();
  const data = ref<FunctionReturnType<T> | undefined>(undefined);

  let unsubscribe: ReturnType<ConvexClient["onUpdate"]> | undefined;

  const subscribe = () => {
    // Unsubscribe from previous subscription if it exists
    unsubscribe?.();
    // Re-subscribe with current args
    unsubscribe = ($convex as ConvexClient).onUpdate(
      query,
      args,
      (value: FunctionReturnType<T>) => {
        data.value = value;
      },
    );
  };

  onMounted(() => {
    subscribe();
  });

  onUnmounted(() => unsubscribe?.());

  // Re-subscribe whenever args change (e.g., when taskId in reactive object changes)
  watch(
    () => JSON.stringify(args),
    () => {
      subscribe();
    },
  );

  return data;
}
