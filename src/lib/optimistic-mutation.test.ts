import { describe, expect, it, vi } from "vitest";

import { runOptimisticMutation } from "@/lib/optimistic-mutation";

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("runOptimisticMutation", () => {
  it("updates the UI before the server mutation settles", async () => {
    let resolveMutation: ((value: { success: boolean }) => void) | undefined;
    const mutation = new Promise<{ success: boolean }>((resolve) => {
      resolveMutation = resolve;
    });
    const onOptimistic = vi.fn();
    const onCommitted = vi.fn();
    const onRolledBack = vi.fn();

    runOptimisticMutation({
      mutation: () => mutation,
      isFailure: (result) => !result.success,
      onOptimistic,
      onCommitted,
      onRolledBack,
    });

    expect(onOptimistic).toHaveBeenCalledOnce();
    expect(onCommitted).not.toHaveBeenCalled();
    expect(onRolledBack).not.toHaveBeenCalled();

    resolveMutation?.({ success: true });
    await flushPromises();

    expect(onCommitted).toHaveBeenCalledWith({ success: true });
    expect(onRolledBack).not.toHaveBeenCalled();
  });

  it("rolls back when the server rejects the mutation result", async () => {
    const onRolledBack = vi.fn();

    runOptimisticMutation({
      mutation: async () => ({ success: false }),
      isFailure: (result) => !result.success,
      onOptimistic: vi.fn(),
      onRolledBack,
    });

    await flushPromises();

    expect(onRolledBack).toHaveBeenCalledWith({ success: false });
  });

  it("rolls back when the server request throws", async () => {
    const error = new Error("offline");
    const onRolledBack = vi.fn();

    runOptimisticMutation({
      mutation: async () => {
        throw error;
      },
      isFailure: () => false,
      onOptimistic: vi.fn(),
      onRolledBack,
    });

    await flushPromises();

    expect(onRolledBack).toHaveBeenCalledWith(undefined, error);
  });
});
