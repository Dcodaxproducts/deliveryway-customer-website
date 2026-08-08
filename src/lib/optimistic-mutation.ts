export type OptimisticMutationOptions<T> = {
  mutation: () => Promise<T>;
  isFailure: (result: T) => boolean;
  onOptimistic: () => void;
  onCommitted?: (result: T) => void | Promise<void>;
  onRolledBack: (result?: T, error?: unknown) => void | Promise<void>;
};

export const runOptimisticMutation = <T>({
  mutation,
  isFailure,
  onOptimistic,
  onCommitted,
  onRolledBack,
}: OptimisticMutationOptions<T>): void => {
  onOptimistic();

  void mutation().then(
    async (result) => {
      if (isFailure(result)) {
        await onRolledBack(result);
        return;
      }

      await onCommitted?.(result);
    },
    async (error: unknown) => {
      await onRolledBack(undefined, error);
    },
  );
};
