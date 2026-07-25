import { describe, expect, it } from "vitest";

import { resolveCheckoutContext } from "./checkout-context";

describe("resolveCheckoutContext", () => {
  it("uses public domain context for anonymous and legacy guest sessions", () => {
    expect(
      resolveCheckoutContext({
        user: {},
        domainContext: {
          restaurantId: "restaurant-domain",
          branchId: "branch-domain",
        },
      })
    ).toEqual({
      restaurantId: "restaurant-domain",
      branchId: "branch-domain",
    });
  });

  it("keeps a guest's explicit restaurant and branch selection", () => {
    expect(
      resolveCheckoutContext({
        user: {
          restaurantId: "restaurant-guest",
          branchId: "branch-guest",
        },
        domainContext: {
          restaurantId: "restaurant-domain",
          branchId: "branch-domain",
        },
      })
    ).toEqual({
      restaurantId: "restaurant-guest",
      branchId: "branch-guest",
    });
  });
});
