import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchMenuItemDetailsByIds,
  fetchMenuItemsPage,
  fetchMenuCategoriesPage,
  fetchSplitPizzaMenuItems,
} from "./items";

const getItemsMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/domain-api", () => ({
  createDomainApiService: () => ({
    get: getItemsMock,
    post: vi.fn(),
    patch: vi.fn(),
    del: vi.fn(),
  }),
}));

describe("fetchMenuItemDetailsByIds", () => {
  beforeEach(() => {
    getItemsMock.mockReset();
  });

  it("falls back to scoped item slug when id search does not return the item", async () => {
    getItemsMock
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        data: [
          {
            id: "pizza-id",
            slug: "pizza-tse",
            name: "Pizza Tse",
            modifierGroups: [{ id: "group-1", minSelect: 1 }],
          },
        ],
      });

    const details = await fetchMenuItemDetailsByIds({
      itemIds: ["pizza-id"],
      itemSearchTermsById: {
        "pizza-id": ["pizza-tse", "Pizza Tse"],
      },
      token: "token-1",
    });

    expect(getItemsMock).toHaveBeenNthCalledWith(
      1,
      "/v1/menu/items?search=pizza-id",
      "token-1"
    );
    expect(getItemsMock).toHaveBeenNthCalledWith(
      2,
      "/v1/menu/items?search=pizza-tse",
      "token-1"
    );
    expect(details["pizza-id"]?.modifierGroups).toEqual([
      { id: "group-1", minSelect: 1 },
    ]);
  });

  it("falls back to scoped item name when id and slug searches miss", async () => {
    getItemsMock
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        data: [{ id: "simple-id", name: "No Add-Ons", modifiers: [] }],
      });

    const details = await fetchMenuItemDetailsByIds({
      itemIds: ["simple-id"],
      itemSearchTermsById: {
        "simple-id": ["no-add-ons", "No Add-Ons"],
      },
    });

    expect(getItemsMock).toHaveBeenNthCalledWith(
      3,
      "/v1/menu/items?search=No+Add-Ons",
      undefined
    );
    expect(details["simple-id"]?.name).toBe("No Add-Ons");
  });

  it("passes branchId through every fallback item details search", async () => {
    getItemsMock
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [{ id: "pizza-id", slug: "pizza-tse" }] });

    await fetchMenuItemDetailsByIds({
      itemIds: ["pizza-id"],
      itemSearchTermsById: { "pizza-id": ["pizza-tse"] },
      branchId: "branch-1",
      token: "token-1",
    });

    expect(getItemsMock).toHaveBeenNthCalledWith(
      1,
      "/v1/menu/items?search=pizza-id&branchId=branch-1",
      "token-1"
    );
    expect(getItemsMock).toHaveBeenNthCalledWith(
      2,
      "/v1/menu/items?search=pizza-tse&branchId=branch-1",
      "token-1"
    );
  });

  it("passes branchId when fetching paginated menu items", async () => {
    getItemsMock.mockResolvedValueOnce({ data: [], meta: { page: 1 } });

    await fetchMenuItemsPage({
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      categoryId: "category-1",
      page: 2,
      limit: 12,
      locale: "en",
      search: "pizza",
      token: "token-1",
    });

    expect(getItemsMock).toHaveBeenCalledWith(
      "/customer-app/cuisines/category-1/items?restaurantId=restaurant-1&page=2&limit=12&branchId=branch-1&locale=en&search=pizza&sort=sortOrder%3AASC",
      "token-1"
    );
  });

  it("passes customer-app cuisine params when fetching paginated cuisines", async () => {
    getItemsMock.mockResolvedValueOnce({ data: [], meta: { page: 1 } });

    await fetchMenuCategoriesPage({
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      page: 1,
      limit: 20,
      locale: "de",
      search: "pasta",
      token: "token-1",
    });

    expect(getItemsMock).toHaveBeenCalledWith(
      "/customer-app/cuisines?restaurantId=restaurant-1&page=1&limit=20&branchId=branch-1&locale=de&search=pasta&sort=sortOrder%3AASC",
      "token-1"
    );
  });

  it("maps customer-app cuisine items response with nested data and top-level meta", async () => {
    getItemsMock.mockResolvedValueOnce({
      data: {
        cuisine: { id: "cuisine-1", name: "Pizza" },
        items: [{ id: "item-1", promotion: { id: "promo-1", discountAmount: 2 } }],
      },
      meta: { page: 2, hasNext: false },
    });

    const result = await fetchMenuItemsPage({
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      categoryId: "cuisine-1",
      page: 2,
      limit: 12,
      token: "token-1",
    });

    expect(result.items).toEqual([
      { id: "item-1", promotion: { id: "promo-1", discountAmount: 2 } },
    ]);
    expect(result.meta).toEqual({ page: 2, hasNext: false });
  });


  it("passes branchId when fetching split-pizza menu items", async () => {
    getItemsMock.mockResolvedValueOnce({ data: [], meta: { page: 1 } });

    await fetchSplitPizzaMenuItems({
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      search: "pizza",
      page: 3,
      token: "token-1",
    });

    expect(getItemsMock).toHaveBeenCalledWith(
      "/v1/menu/items?page=3&supportsSplitPizza=true&restaurantId=restaurant-1&branchId=branch-1&search=pizza",
      "token-1"
    );
  });
});
