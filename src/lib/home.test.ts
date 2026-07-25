import { describe, expect, it } from "vitest";

import { resolveHomeBranchId, resolveHomeRestaurantId, resolveTableReservationsEnabled } from "@/lib/home";
import type { AuthUser } from "@/types/auth";

const baseUser: AuthUser = {
  id: "customer-1",
  email: "customer@example.com",
  role: "CUSTOMER",
  tenantId: "tenant-1",
};

describe("home helpers", () => {
  it("uses the live home reservation flag before stale session data", () => {
    expect(
      resolveTableReservationsEnabled(
        { tableReservationsEnabled: false },
        { id: "branch-1", name: "Branch", tableReservationsEnabled: true }
      )
    ).toBe(false);
  });

  it("supports nested home reservation settings", () => {
    expect(
      resolveTableReservationsEnabled(
        { settings: { tableReservationsEnabled: true } },
        { id: "branch-1", name: "Branch", tableReservationsEnabled: false }
      )
    ).toBe(true);
  });

  it("falls back to session branch only when home has no explicit flag", () => {
    expect(
      resolveTableReservationsEnabled(
        null,
        { id: "branch-1", name: "Branch", tableReservationsEnabled: true }
      )
    ).toBe(true);
  });

  it("resolves restaurant id from the selected branch when the user is branch scoped", () => {
    expect(
      resolveHomeRestaurantId({
        ...baseUser,
        restaurantId: null,
        branch: {
          id: "branch-1",
          name: "Main",
          restaurantId: "restaurant-from-branch",
        },
      })
    ).toBe("restaurant-from-branch");
  });

  it("resolves branch id from nested branch when branchId is missing", () => {
    expect(
      resolveHomeBranchId({
        ...baseUser,
        branch: {
          id: "branch-1",
          name: "Main",
        },
      })
    ).toBe("branch-1");
  });

  it("uses the current storefront domain instead of a stale auth restaurant", () => {
    expect(
      resolveHomeRestaurantId(
        {
          ...baseUser,
          restaurantId: "stale-restaurant",
        },
        "stale-restaurant",
        { restaurantId: "domain-restaurant" },
      ),
    ).toBe("domain-restaurant");
  });

  it("uses the current storefront branch instead of a stale auth branch", () => {
    expect(
      resolveHomeBranchId(
        {
          ...baseUser,
          restaurantId: "stale-restaurant",
          branchId: "stale-branch",
        },
        {
          restaurantId: "domain-restaurant",
          branchId: "domain-branch",
        },
      ),
    ).toBe("domain-branch");
  });

  it("does not reuse an auth branch from another storefront restaurant", () => {
    expect(
      resolveHomeBranchId(
        {
          ...baseUser,
          restaurantId: "stale-restaurant",
          branchId: "stale-branch",
        },
        {
          restaurantId: "domain-restaurant",
          branchId: null,
        },
      ),
    ).toBe("");
  });
});
