import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

import {
  fetchCustomerCuisineItems,
  fetchCustomerCuisines,
  fetchPromotionalCuisines,
  normalizeCuisines,
} from "./cuisines";
import { getRequest } from "./http";

vi.mock("./http", () => ({
  getRequest: vi.fn(),
}));

const mockedGetRequest = getRequest as Mock;

describe("cuisines service", () => {
  beforeEach(() => {
    mockedGetRequest.mockReset();
  });

  it("normalizes cuisines from customer-app payloads", () => {
    expect(
      normalizeCuisines({
        data: {
          data: [{ id: "c1", name: "Italian", happyHour: { title: "Lunch" } }],
        },
      }),
    ).toEqual([
      expect.objectContaining({
        id: "c1",
        name: "Italian",
        happyHour: { title: "Lunch" },
      }),
    ]);
  });

  it("lists cuisines through /customer-app/cuisines with customer params", async () => {
    mockedGetRequest.mockResolvedValueOnce({
      data: [{ id: "c1", name: "Italian" }],
    });

    await fetchCustomerCuisines({
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      page: 2,
      limit: 10,
      locale: "en",
      search: "ita",
      sortBy: "name",
      sortOrder: "ASC",
    });

    expect(mockedGetRequest).toHaveBeenCalledWith(
      "/customer-app/cuisines?restaurantId=restaurant-1&branchId=branch-1&page=2&limit=10&locale=en&search=ita&sortBy=name&sortOrder=ASC",
    );
  });

  it("fetches cuisine detail items independently from menu category endpoints", async () => {
    mockedGetRequest.mockResolvedValueOnce({
      data: { cuisine: { id: "cuisine/1", name: "First cuisine" }, items: [{ id: "item-1" }] },
    });

    const result = await fetchCustomerCuisineItems({
      cuisineId: "cuisine/1",
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      page: 1,
      limit: 12,
    });

    expect(mockedGetRequest).toHaveBeenCalledWith(
      "/customer-app/cuisines/cuisine%2F1/items?restaurantId=restaurant-1&branchId=branch-1&page=1&limit=12&sortBy=sortOrder&sortOrder=ASC",
    );
    expect(result.items).toEqual([{ id: "item-1" }]);
    expect(result.cuisine).toEqual(
      expect.objectContaining({ id: "cuisine/1", name: "First cuisine" }),
    );
  });

  it("normalizes the nested production cuisine detail envelope in one bounded request", async () => {
    mockedGetRequest.mockResolvedValueOnce({
      data: {
        data: {
          cuisine: { id: "first-created", name: "Original" },
          items: [{ id: "actual-item", name: "Actual item" }],
        },
      },
    });

    const result = await fetchCustomerCuisineItems({
      cuisineId: "first-created",
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      limit: 48,
    });

    expect(result.cuisine?.id).toBe("first-created");
    expect(result.items).toEqual([
      expect.objectContaining({ id: "actual-item", name: "Actual item" }),
    ]);
    expect(mockedGetRequest).toHaveBeenCalledTimes(1);
  });

  it("rejects an API failure instead of caching a generic empty cuisine", async () => {
    mockedGetRequest.mockResolvedValueOnce({
      success: false,
      status: 500,
      error: { message: "Invalid string length" },
      data: undefined,
    });

    await expect(
      fetchCustomerCuisineItems({
        cuisineId: "italian",
        restaurantId: "restaurant-1",
        branchId: "branch-1",
      }),
    ).rejects.toThrow("Invalid string length");
  });

  it("fetches promotional cuisines when available", async () => {
    mockedGetRequest.mockResolvedValueOnce({ data: [{ id: "promo-cuisine" }] });

    await fetchPromotionalCuisines({
      restaurantId: "restaurant-1",
      branchId: "branch-1",
      limit: 4,
    });

    expect(mockedGetRequest).toHaveBeenCalledWith(
      "/customer-app/promotional-cuisines?restaurantId=restaurant-1&branchId=branch-1&page=1&limit=4&sortBy=sortOrder&sortOrder=ASC",
    );
  });
});
