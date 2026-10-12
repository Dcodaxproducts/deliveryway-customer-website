// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ORDER_TRACKING_POLL_INTERVAL_MS, useOrderTracking } from "./useOrderTracking";

describe("useOrderTracking", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("refreshes immediately and on the visible polling interval", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const { unmount } = renderHook(() =>
      useOrderTracking({ orderId: "order-1", token: "token", onUpdate }),
    );

    expect(onUpdate).toHaveBeenCalledTimes(1);
    await act(async () => {
      await Promise.resolve();
      await vi.advanceTimersByTimeAsync(ORDER_TRACKING_POLL_INTERVAL_MS);
    });
    expect(onUpdate).toHaveBeenCalledTimes(2);

    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(ORDER_TRACKING_POLL_INTERVAL_MS * 2);
    });
    expect(onUpdate).toHaveBeenCalledTimes(2);
  });

  it("does not poll without both order and authentication context", () => {
    const onUpdate = vi.fn();

    renderHook(() => useOrderTracking({ orderId: null, token: "token", onUpdate }));
    renderHook(() => useOrderTracking({ orderId: "order-1", token: null, onUpdate }));

    expect(onUpdate).not.toHaveBeenCalled();
  });
});
