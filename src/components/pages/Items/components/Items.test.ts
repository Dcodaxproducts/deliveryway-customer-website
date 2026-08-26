import { describe, expect, it } from "vitest";

import {
  createEmptyCategoryState,
  resolveFailedCategoryItemsState,
} from "./Items";

describe("category item request recovery", () => {
  it("finishes the loading state when the initial request fails", () => {
    const failedState = resolveFailedCategoryItemsState({
      ...createEmptyCategoryState(),
      loading: true,
    });

    expect(failedState).toMatchObject({
      failed: true,
      loadedOnce: true,
      loading: false,
      loadingMore: false,
    });
  });

  it("preserves already loaded items when a later page fails", () => {
    const failedState = resolveFailedCategoryItemsState({
      ...createEmptyCategoryState(),
      items: [{ id: "item-1", name: "Pizza" }],
      loadedOnce: true,
      loadingMore: true,
    });

    expect(failedState.items).toEqual([{ id: "item-1", name: "Pizza" }]);
    expect(failedState.failed).toBe(true);
    expect(failedState.loadingMore).toBe(false);
  });
});
