import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearMenuItemDetailsCache,
  fetchMenuCategoriesPage,
  fetchMenuItemDetails,
  fetchMenuItemDetailsByIds,
  fetchMenuItemsPage,
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
    clearMenuItemDetailsCache();
  });

  it("loads full item details so deal add-ons are preserved", async () => {
    getItemsMock.mockResolvedValueOnce({
      data: {
        id: "pizza-id",
        slug: "pizza-tse",
        name: "Pizza Tse",
        modifierGroups: [{ id: "group-1", minSelect: 1 }],
      },
    });

    const details = await fetchMenuItemDetailsByIds({
      itemIds: ["pizza-id"],
      itemSearchTermsById: {
        "pizza-id": ["pizza-tse", "Pizza Tse"],
      },
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      token: "token-1",
    });

    expect(getItemsMock).toHaveBeenCalledWith(
      "/customer-app/items/pizza-id?restaurantId=restaurant-1&branchId=branch-1",
      "token-1",
    );
    expect(details["pizza-id"]?.modifierGroups).toEqual([
      { id: "group-1", minSelect: 1 },
    ]);
  });

  it("falls back to scoped item name when id and slug searches miss", async () => {
    getItemsMock
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        data: [{ id: "simple-id", slug: "no-add-ons", name: "No Add-Ons" }],
      })
      .mockResolvedValueOnce({
        data: { id: "simple-id", name: "No Add-Ons", modifiers: [] },
      });

    const details = await fetchMenuItemDetailsByIds({
      itemIds: ["simple-id"],
      itemSearchTermsById: {
        "simple-id": ["no-add-ons", "No Add-Ons"],
      },
    });

    expect(getItemsMock).toHaveBeenNthCalledWith(
      3,
      "/customer-app/items?search=No+Add-Ons",
      undefined,
    );
    expect(getItemsMock).toHaveBeenNthCalledWith(
      4,
      "/customer-app/items/no-add-ons",
      undefined,
    );
    expect(details["simple-id"]?.name).toBe("No Add-Ons");
  });

  it("passes branchId through every fallback item details search", async () => {
    getItemsMock
      .mockResolvedValueOnce({ data: null })
      .mockResolvedValueOnce({
        data: [{ id: "pizza-id", slug: "pizza-tse" }],
      })
      .mockResolvedValueOnce({
        data: { id: "pizza-id", slug: "pizza-tse" },
      });

    await fetchMenuItemDetailsByIds({
      itemIds: ["pizza-id"],
      itemSearchTermsById: { "pizza-id": ["pizza-tse"] },
      branchId: "branch-1",
      token: "token-1",
    });

    expect(getItemsMock).toHaveBeenNthCalledWith(
      1,
      "/customer-app/items/pizza-id?branchId=branch-1",
      "token-1",
    );
    expect(getItemsMock).toHaveBeenNthCalledWith(
      2,
      "/customer-app/items?search=pizza-tse&branchId=branch-1",
      "token-1",
    );
    expect(getItemsMock).toHaveBeenNthCalledWith(
      3,
      "/customer-app/items/pizza-tse?branchId=branch-1",
      "token-1",
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
      token: "token-1",
    });

    expect(getItemsMock).toHaveBeenCalledWith(
      "/customer-app/items?restaurantId=restaurant-1&page=2&limit=12&sortBy=createdAt&sortOrder=ASC&categoryId=category-1&branchId=branch-1",
      "token-1",
    );
  });

  it("caps paginated menu items at the public API maximum", async () => {
    getItemsMock.mockResolvedValueOnce({ data: [], meta: { page: 1 } });

    await fetchMenuItemsPage({
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      categoryId: "category-1",
      page: 1,
      limit: 100,
    });

    expect(getItemsMock).toHaveBeenCalledWith(
      "/customer-app/items?restaurantId=restaurant-1&page=1&limit=50&sortBy=createdAt&sortOrder=ASC&categoryId=category-1&branchId=branch-1",
      undefined,
    );
  });

  it("fetches public item details by slug without an auth token", async () => {
    getItemsMock.mockResolvedValueOnce({
      data: { id: "pizza-id", slug: "pizza-tse", modifiers: [] },
    });

    const result = await fetchMenuItemDetails({
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      identifier: "pizza-tse",
    });

    expect(getItemsMock).toHaveBeenCalledWith(
      "/customer-app/items/pizza-tse?restaurantId=restaurant-1&branchId=branch-1",
      undefined,
    );
    expect(result.item).toEqual(
      expect.objectContaining({ id: "pizza-id", slug: "pizza-tse" }),
    );
  });

  it("reuses pizza details after cart-driven rerenders instead of reloading add-ons", async () => {
    getItemsMock.mockResolvedValue({
      data: {
        id: "pizza-id",
        slug: "pizza-tse",
        modifierGroups: [{ id: "toppings" }],
      },
    });

    const request = {
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      identifier: "pizza-id",
      token: "customer-token",
    };
    const first = await fetchMenuItemDetails(request);
    const repeated = await fetchMenuItemDetails(request);

    expect(getItemsMock).toHaveBeenCalledTimes(1);
    expect(repeated).toBe(first);
    expect(repeated.item?.modifierGroups).toEqual([{ id: "toppings" }]);
  });

  it("deduplicates simultaneous pizza detail requests", async () => {
    let resolveRequest:
      | ((value: { data: { id: string; modifierGroups: never[] } }) => void)
      | undefined;
    getItemsMock.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const request = {
      restaurantId: "restaurant-1",
      identifier: "pizza-id",
    };
    const first = fetchMenuItemDetails(request);
    const second = fetchMenuItemDetails(request);
    resolveRequest?.({ data: { id: "pizza-id", modifierGroups: [] } });

    await expect(Promise.all([first, second])).resolves.toHaveLength(2);
    expect(getItemsMock).toHaveBeenCalledTimes(1);
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
      "/customer-app/items?page=3&supportsSplitPizza=true&restaurantId=restaurant-1&branchId=branch-1&search=pizza",
      "token-1",
    );
  });
  it("fetches menu categories on items page with ascending sort order", async () => {
    getItemsMock.mockResolvedValueOnce({ data: [], meta: { page: 1 } });

    await fetchMenuCategoriesPage({
      restaurantId: "restaurant-1",
      page: 1,
      limit: 50,
      token: "token-1",
    });

    expect(getItemsMock).toHaveBeenCalledWith(
      "/customer-app/categories?restaurantId=restaurant-1&page=1&limit=50&sortBy=createdAt&sortOrder=ASC",
      "token-1",
    );
  });
});
