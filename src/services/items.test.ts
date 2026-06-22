import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchCustomerMenuItemBySlug,
  fetchMenuCategoriesPage,
  fetchMenuItemDetailsByIds,
  fetchMenuItemsPage,
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
      "/v1/menu/items?search=No%20Add-Ons",
      undefined
    );
    expect(details["simple-id"]?.name).toBe("No Add-Ons");
  });

  it("fetches customer cuisines with branch context", async () => {
    getItemsMock.mockResolvedValueOnce({
      data: {
        data: [{ id: "cat-1", name: "Pizza", happyHour: { id: "hh-1" } }],
        meta: { page: 1 },
      },
    });

    const result = await fetchMenuCategoriesPage({
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      page: 1,
      limit: 20,
      search: "pizza",
      token: "token-1",
    });

    expect(getItemsMock).toHaveBeenCalledWith(
      "/customer-app/cuisines?restaurantId=restaurant-1&page=1&limit=20&branchId=branch-1&search=pizza",
      "token-1"
    );
    expect(result.categories[0]?.happyHour).toEqual({ id: "hh-1" });
    expect(result.meta.page).toBe(1);
  });

  it("fetches customer cuisine items with branch context", async () => {
    getItemsMock.mockResolvedValueOnce({
      data: {
        items: [
          {
            id: "item-1",
            happyHour: { id: "hh-1" },
            happyHourDiscountedBasePrice: 8,
          },
        ],
        meta: { page: 2 },
      },
    });

    const result = await fetchMenuItemsPage({
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      categoryId: "cat-1",
      page: 2,
      limit: 12,
      token: "token-1",
    });

    expect(getItemsMock).toHaveBeenCalledWith(
      "/customer-app/cuisines/cat-1/items?restaurantId=restaurant-1&page=2&limit=12&branchId=branch-1",
      "token-1"
    );
    expect(result.items[0]?.happyHourDiscountedBasePrice).toBe(8);
    expect(result.meta.page).toBe(2);
  });

  it("fetches customer item detail by slug with branch context", async () => {
    getItemsMock.mockResolvedValueOnce({
      data: {
        id: "item-1",
        slug: "margherita",
        happyHour: { id: "hh-1" },
        variations: [{ id: "large", happyHourDiscountedPrice: 10 }],
      },
    });

    const result = await fetchCustomerMenuItemBySlug({
      slug: "margherita",
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      token: "token-1",
    });

    expect(getItemsMock).toHaveBeenCalledWith(
      "/customer-app/items/margherita?restaurantId=restaurant-1&branchId=branch-1",
      "token-1"
    );
    expect(result.item?.happyHour).toEqual({ id: "hh-1" });
    expect(result.item?.variations?.[0]?.happyHourDiscountedPrice).toBe(10);
  });
});
