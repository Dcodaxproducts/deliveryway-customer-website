import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetchMenuItemDetailsByIds: vi.fn(),
  useQuery: vi.fn(),
}));

vi.mock("react", () => ({
  useMemo: (factory: () => unknown) => factory(),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: mocks.useQuery,
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({
    token: "customer-token",
    restaurantId: "auth-restaurant",
    user: {
      branchId: "auth-branch",
    },
  }),
}));

vi.mock("@/services/items", () => ({
  fetchMenuItemDetailsByIds: mocks.fetchMenuItemDetailsByIds,
}));

import { useDealScopedItemsDetails } from "./useDealScopedItemsDetails";
import { getModifierPriceForVariation } from "@/components/pages/Items/utils/modifier-pricing";

describe("useDealScopedItemsDetails", () => {
  beforeEach(() => {
    mocks.fetchMenuItemDetailsByIds.mockReset();
    mocks.fetchMenuItemDetailsByIds.mockResolvedValue({});
    mocks.useQuery.mockReset();
    mocks.useQuery.mockImplementation((options) => options);
  });

  it("uses the storefront deal context when loading selectable item options", async () => {
    mocks.fetchMenuItemDetailsByIds.mockResolvedValue({
      "pizza-id": {
        id: "pizza-id",
        name: "Pizza Tuna",
        category: {
          id: "pizza-category",
          name: "Pizza",
        },
        modifierPriceOverrides: [
          {
            modifierId: "extra-cheese",
            priceDelta: "0",
            modifier: {
              id: "extra-cheese",
              name: "Extra cheese",
              priceDelta: "1.55",
            },
          },
        ],
      },
    });

    useDealScopedItemsDetails({
      itemIds: ["pizza-id"],
      items: [{ id: "pizza-id", name: "Pizza Tuna" }],
      restaurantId: "deal-restaurant",
      branchId: "storefront-branch",
      enabled: true,
    });

    const queryOptions = mocks.useQuery.mock.calls.at(-1)?.[0] as
      | { queryFn: () => Promise<unknown> }
      | undefined;

    expect(queryOptions).toBeDefined();
    const details = await queryOptions?.queryFn();

    expect(details).toEqual({
      "pizza-id": expect.objectContaining({
        category: {
          id: "pizza-category",
          name: "Pizza",
        },
        modifierPriceOverrides: [
          expect.objectContaining({
            modifierId: "extra-cheese",
            priceDelta: "0",
          }),
        ],
      }),
    });
    const item = (details as Record<string, unknown>)["pizza-id"];

    expect(
      getModifierPriceForVariation({
        item: item as Parameters<typeof getModifierPriceForVariation>[0]["item"],
        modifierId: "extra-cheese",
      }),
    ).toBe(1.55);

    expect(mocks.fetchMenuItemDetailsByIds).toHaveBeenCalledWith({
      itemIds: ["pizza-id"],
      itemSearchTermsById: {
        "pizza-id": ["Pizza Tuna"],
      },
      restaurantId: "deal-restaurant",
      branchId: "storefront-branch",
      token: "customer-token",
    });
  });
});
