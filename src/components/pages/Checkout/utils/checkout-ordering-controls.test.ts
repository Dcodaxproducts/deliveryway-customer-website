import { describe, expect, it } from "vitest";

import {
  getCheckoutOrderTime,
  getCheckoutTipAmount,
} from "./checkout-ordering-controls";

describe("checkout ordering controls", () => {
  it("clears a future order time when preorder is disabled", () => {
    expect(
      getCheckoutOrderTime({
        preorderEnabled: false,
        orderTime: "2030-06-10T19:30:00.000Z",
      }),
    ).toBeNull();
  });

  it("keeps scheduling data when preorder is enabled", () => {
    expect(
      getCheckoutOrderTime({
        preorderEnabled: true,
        orderTime: "2030-06-10T19:30:00.000Z",
      }),
    ).toBe("2030-06-10T19:30:00.000Z");
  });

  it("zeros stale tips when tips are disabled", () => {
    expect(getCheckoutTipAmount({ tipsEnabled: false, tipAmount: 7 })).toBe(0);
    expect(getCheckoutTipAmount({ tipsEnabled: true, tipAmount: 7 })).toBe(7);
  });
});
