import { describe, expect, it, vi } from "vitest";

import {
  getCartSnapshotState,
  publishCartSnapshotState,
  subscribeCartSnapshotState,
} from "./cart-snapshot-store";

describe("canonical cart snapshot store", () => {
  it("publishes the owner snapshot to embedded menu subscribers", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeCartSnapshotState(listener);
    const snapshot = {
      items: [{ id: "optimistic-menu-item", __optimisticPending: true }],
      quote: null,
    };

    publishCartSnapshotState({
      cartSnapshot: snapshot,
      cartLoadState: "ready",
      cartRefreshKey: 7,
    });

    expect(listener).toHaveBeenCalledOnce();
    expect(getCartSnapshotState()).toEqual({
      cartSnapshot: snapshot,
      cartLoadState: "ready",
      cartRefreshKey: 7,
    });

    unsubscribe();
  });
});
