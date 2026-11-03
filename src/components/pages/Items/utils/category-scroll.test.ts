import { describe, expect, it } from "vitest";

import {
  getCategoryPlaceholderCount,
  getCategoryLoadOrder,
  getCategoryIdsThroughTarget,
  getProgressiveCategoryLoadCandidates,
  isProgrammaticCategoryTargetReached,
  loadCategoryIdsInBatches,
  resolveCategoryNavigation,
} from "./category-scroll";

describe("category scrolling", () => {
  it("reserves first-page geometry from category metadata", () => {
    expect(getCategoryPlaceholderCount({ itemCount: 82 })).toBe(50);
    expect(getCategoryPlaceholderCount({ itemsCount: 14 })).toBe(14);
    expect(getCategoryPlaceholderCount({ _count: { items: 9 } })).toBe(9);
    expect(getCategoryPlaceholderCount({ id: "unknown" })).toBe(6);
  });

  it("suppresses observer fan-out while programmatic navigation owns scroll", () => {
    expect(
      getProgressiveCategoryLoadCandidates({
        visibleCategoryIds: ["pizza", "hamburger", "rolls"],
        programmaticTargetId: "rolls",
      }),
    ).toEqual([]);
    expect(
      getProgressiveCategoryLoadCandidates({
        visibleCategoryIds: ["hamburger", "rolls"],
      }),
    ).toEqual(["hamburger"]);
  });

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

  it("loads only the first category on the initial one-page render", () => {
    expect(
      getCategoryLoadOrder(
        [{ id: "pizza" }, { id: "wraps" }, { id: "desserts" }],
      ),
    ).toEqual(["pizza"]);
  });

  it("loads only the selected category for a direct deep link", () => {
    expect(
      getCategoryLoadOrder(
        [{ id: "pizza" }, { id: "wraps" }, { id: "desserts" }],
        "desserts",
      ),
    ).toEqual(["desserts"]);
  });

  it("keeps an 82-item many-category direct reload to one initial request", () => {
    const fixtureItems = Array.from({ length: 82 }, (_, index) => ({
      id: `item-${index + 1}`,
      categoryId: `category-${(index % 18) + 1}`,
    }));
    const categories = Array.from(
      new Set(fixtureItems.map((item) => item.categoryId)),
      (id) => ({ id }),
    );

    expect(categories).toHaveLength(18);
    expect(getCategoryLoadOrder(categories, "category-14")).toEqual([
      "category-14",
    ]);
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
