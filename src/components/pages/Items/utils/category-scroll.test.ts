import { describe, expect, it } from "vitest";

import {
  getCategoryIdsThroughTarget,
  isProgrammaticCategoryTargetReached,
} from "./category-scroll";

describe("category scrolling", () => {
  it("loads every preceding category before scrolling to a lower target", () => {
    expect(
      getCategoryIdsThroughTarget(
        [{ id: "pizza" }, { id: "wraps" }, { id: "desserts" }],
        "desserts",
      ),
    ).toEqual(["pizza", "wraps", "desserts"]);
  });

  it("keeps programmatic navigation locked until the target reaches the sticky offset", () => {
    expect(
      isProgrammaticCategoryTargetReached({
        targetTop: 520,
        atBottom: false,
      }),
    ).toBe(false);
    expect(
      isProgrammaticCategoryTargetReached({
        targetTop: 132,
        atBottom: false,
      }),
    ).toBe(true);
  });

  it("accepts the final category when the document reaches the bottom", () => {
    expect(
      isProgrammaticCategoryTargetReached({
        targetTop: 400,
        atBottom: true,
      }),
    ).toBe(true);
  });
});
