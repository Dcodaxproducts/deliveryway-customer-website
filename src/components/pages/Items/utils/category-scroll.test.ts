import { describe, expect, it } from "vitest";

import {
  getCategoryLoadOrder,
  getCategoryIdsThroughTarget,
  isProgrammaticCategoryTargetReached,
  loadCategoryIdsInBatches,
  resolveCategoryNavigation,
} from "./category-scroll";

describe("category scrolling", () => {
  it("keeps category deep links in the continuous one-page menu", () => {
    expect(resolveCategoryNavigation("vegan-pizza")).toEqual({
      activeCategoryId: "vegan-pizza",
      viewMode: "onePage",
    });
  });

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

  it("loads every category on the initial one-page render", () => {
    expect(
      getCategoryLoadOrder(
        [{ id: "pizza" }, { id: "wraps" }, { id: "desserts" }],
      ),
    ).toEqual(["pizza", "wraps", "desserts"]);
  });

  it("prioritizes a selected category without dropping the other categories", () => {
    expect(
      getCategoryLoadOrder(
        [{ id: "pizza" }, { id: "wraps" }, { id: "desserts" }],
        "desserts",
      ),
    ).toEqual(["desserts", "pizza", "wraps"]);
  });

  it("bounds progressive category request concurrency", async () => {
    let activeRequests = 0;
    let maximumActiveRequests = 0;
    const loadedIds: string[] = [];

    await loadCategoryIdsInBatches({
      categoryIds: ["pizza", "wraps", "desserts", "drinks"],
      batchSize: 2,
      load: async (categoryId) => {
        activeRequests += 1;
        maximumActiveRequests = Math.max(
          maximumActiveRequests,
          activeRequests,
        );
        await Promise.resolve();
        loadedIds.push(categoryId);
        activeRequests -= 1;
      },
    });

    expect(loadedIds).toEqual(["pizza", "wraps", "desserts", "drinks"]);
    expect(maximumActiveRequests).toBe(2);
  });
});
