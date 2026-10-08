import { describe, expect, it, vi } from "vitest";

import { createRequestCoordinator } from "./request-coordinator";

describe("request coordinator", () => {
  it("deduplicates identical concurrent requests", async () => {
    const coordinator = createRequestCoordinator<string>();
    const execute = vi.fn(async () => "menu");

    const [first, second] = await Promise.all([
      coordinator.run("categories:r1:1", undefined, execute),
      coordinator.run("categories:r1:1", undefined, execute),
    ]);

    expect([first, second]).toEqual(["menu", "menu"]);
    expect(execute).toHaveBeenCalledTimes(1);
    expect(coordinator.pendingCount()).toBe(0);
  });

  it("aborts stale work only after its final subscriber leaves", async () => {
    const coordinator = createRequestCoordinator<string>();
    const first = new AbortController();
    const second = new AbortController();
    let sharedSignal: AbortSignal | undefined;
    const execute = vi.fn(
      (signal: AbortSignal) =>
        new Promise<string>((resolve) => {
          sharedSignal = signal;
          signal.addEventListener("abort", () => resolve("aborted"));
        }),
    );

    const firstResult = coordinator
      .run("items:r1:b1:c1:1", first.signal, execute)
      .catch((error: Error) => error.name);
    const secondResult = coordinator
      .run("items:r1:b1:c1:1", second.signal, execute)
      .catch((error: Error) => error.name);

    first.abort();
    await expect(firstResult).resolves.toBe("AbortError");
    expect(sharedSignal?.aborted).toBe(false);

    second.abort();
    await expect(secondResult).resolves.toBe("AbortError");
    expect(sharedSignal?.aborted).toBe(true);
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
