// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useVisibilityPolling } from "./useVisibilityPolling";

const setVisibility = (visibilityState: DocumentVisibilityState) => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: visibilityState,
  });
  document.dispatchEvent(new Event("visibilitychange"));
};

describe("useVisibilityPolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("polls immediately and serially while visible", async () => {
    let resolvePoll: (() => void) | undefined;
    const poll = vi.fn(() => new Promise<void>((resolve) => {
      resolvePoll = resolve;
    }));

    renderHook(() => useVisibilityPolling({ enabled: true, intervalMs: 1_000, poll }));
    expect(poll).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(poll).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolvePoll?.();
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(999);
    });
    expect(poll).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(poll).toHaveBeenCalledTimes(2);
  });

  it("pauses while hidden, resumes immediately, and cleans up", async () => {
    const poll = vi.fn().mockResolvedValue(undefined);
    const removeEventListener = vi.spyOn(document, "removeEventListener");
    const { unmount } = renderHook(() =>
      useVisibilityPolling({ enabled: true, intervalMs: 1_000, poll }),
    );

    await act(async () => {
      await Promise.resolve();
      setVisibility("hidden");
      await vi.advanceTimersByTimeAsync(5_000);
    });
    expect(poll).toHaveBeenCalledTimes(1);

    await act(async () => {
      setVisibility("visible");
      await Promise.resolve();
    });
    expect(poll).toHaveBeenCalledTimes(2);

    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(5_000);
      setVisibility("hidden");
      setVisibility("visible");
    });

    expect(poll).toHaveBeenCalledTimes(2);
    expect(removeEventListener).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function),
    );
  });
});
