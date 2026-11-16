import { describe, expect, it } from "vitest";

import { getBranchStatsDisplay } from "./statsSection";

describe("homepage branch statistics", () => {
  it("shows the exact successful completed-order count from the API contract", () => {
    expect(
      getBranchStatsDisplay({
        completedOrders: 42,
        activeMenuItems: 9,
        reviewCount: 8,
        averageRating: 4.75,
        fiveStarReviews: 6,
      }),
    ).toEqual({
      completedOrders: "42",
      activeMenuItems: "9",
      averageRating: "4.8/5",
      fiveStarReviews: "6",
    });
  });

  it("never substitutes shared marketing numbers while stats are unavailable", () => {
    expect(getBranchStatsDisplay()).toEqual({
      completedOrders: "—",
      activeMenuItems: "—",
      averageRating: "—",
      fiveStarReviews: "—",
    });
  });
});
