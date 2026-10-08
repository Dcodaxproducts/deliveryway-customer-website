import { describe, expect, it } from "vitest";

import {
  shouldCancelCartFetchAfterChange,
  shouldFetchCartAfterChange,
} from "./cart-events";

describe("cart event fetch policy", () => {
  it("reuses a mutation snapshot without a follow-up GET", () => {
    expect(
      shouldFetchCartAfterChange({
        itemCount: 2,
        cartData: { items: [{ id: "item-1" }] },
      }),
    ).toBe(false);
  });

  it("allows at most one owner fetch for an invalidation event", () => {
    expect(shouldFetchCartAfterChange()).toBe(true);
    expect(shouldFetchCartAfterChange({ refreshCart: true })).toBe(true);
    expect(shouldFetchCartAfterChange({ itemCount: 1 })).toBe(false);
  });

  it("cancels stale fetches before applying optimistic or authoritative data", () => {
    expect(
      shouldCancelCartFetchAfterChange({ mutationStatus: "pending" }),
    ).toBe(true);
    expect(
      shouldCancelCartFetchAfterChange({ cartData: { items: [] } }),
    ).toBe(true);
    expect(shouldCancelCartFetchAfterChange({ itemCount: 1 })).toBe(false);
  });
});
