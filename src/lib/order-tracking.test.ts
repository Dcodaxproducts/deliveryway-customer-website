import { describe, expect, it } from "vitest";

import { getOrderTrackingSocketUrl } from "@/lib/order-tracking";

describe("order tracking socket URL", () => {
  it("uses the API origin and orders tracking namespace", () => {
    expect(
      getOrderTrackingSocketUrl("https://api.delivery-way.de/api/v1"),
    ).toBe("https://api.delivery-way.de/orders-tracking");
  });
});
