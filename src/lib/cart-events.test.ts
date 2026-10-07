import { describe, expect, it } from "vitest";

import { shouldFetchCartAfterChange } from "./cart-events";

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
});
