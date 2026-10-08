type PendingRequest<T> = {
  controller: AbortController;
  promise: Promise<T>;
  subscribers: Set<symbol>;
};

const createAbortError = () => {
  const error = new Error("Request aborted");
  error.name = "AbortError";
  return error;
};

export const createRequestCoordinator = <T>() => {
  const pending = new Map<string, PendingRequest<T>>();

  const run = (
    key: string,
    signal: AbortSignal | undefined,
    execute: (signal: AbortSignal) => Promise<T>,
  ): Promise<T> => {
    if (signal?.aborted) {
      return Promise.reject(createAbortError());
    }

    let entry = pending.get(key);

    if (!entry) {
      const controller = new AbortController();
      const nextEntry: PendingRequest<T> = {
        controller,
        subscribers: new Set(),
        promise: Promise.resolve(undefined as T),
      };

      nextEntry.promise = execute(controller.signal).finally(() => {
        if (pending.get(key) === nextEntry) {
          pending.delete(key);
        }
      });
      pending.set(key, nextEntry);
      entry = nextEntry;
    }

    const subscriber = Symbol(key);
    entry.subscribers.add(subscriber);

    return new Promise<T>((resolve, reject) => {
      let settled = false;

      const detach = () => {
        signal?.removeEventListener("abort", handleAbort);
        entry.subscribers.delete(subscriber);

        if (!entry.subscribers.size && pending.get(key) === entry) {
          entry.controller.abort();
        }
      };

      const handleAbort = () => {
        if (settled) return;
        settled = true;
        detach();
        reject(createAbortError());
      };

      signal?.addEventListener("abort", handleAbort, { once: true });

      entry.promise.then(
        (value) => {
          if (settled) return;
          settled = true;
          detach();
          resolve(value);
        },
        (error: unknown) => {
          if (settled) return;
          settled = true;
          detach();
          reject(error);
        },
      );
    });
  };

  return {
    run,
    pendingCount: () => pending.size,
  };
};
