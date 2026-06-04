import { beforeEach, describe, expect, it, vi } from "vitest";

import { addCustomerCartItem, quoteCustomerCart, updateCustomerCartItem } from "./cart";

const postCartMock = vi.hoisted(() => vi.fn());
const patchCartMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/domain-api", () => ({
  createDomainApiService: () => ({
    get: vi.fn(),
    post: postCartMock,
    patch: patchCartMock,
    del: vi.fn(),
  }),
}));

describe("cart service", () => {
  beforeEach(() => {
    postCartMock.mockReset();
    patchCartMock.mockReset();
  });

  it("adds customer cart item with the normal cart item endpoint", async () => {
    postCartMock.mockResolvedValue({ success: true });

    await addCustomerCartItem({
      customerId: "customer-1",
      payload: {
        branchId: "branch-1",
        menuItemId: "burger-id",
        quantity: 1,
      },
    });

    expect(postCartMock).toHaveBeenCalledWith(
      "/v1/cart/items?customerId=customer-1",
      {
        branchId: "branch-1",
        menuItemId: "burger-id",
        quantity: 1,
      },
      undefined
    );
  });

  it("adds customer cart item with grouped modifier selections", async () => {
    postCartMock.mockResolvedValue({ success: true });

    await addCustomerCartItem({
      customerId: "customer-1",
      payload: {
        branchId: "branch-1",
        menuItemId: "burger-id",
        quantity: 1,
        modifierSelections: [
          {
            modifierGroupId: "group-sauces",
            modifiers: [{ modifierId: "modifier-garlic", quantity: 1 }],
          },
        ],
      },
    });

    expect(postCartMock).toHaveBeenCalledWith(
      "/v1/cart/items?customerId=customer-1",
      {
        branchId: "branch-1",
        menuItemId: "burger-id",
        quantity: 1,
        modifierSelections: [
          {
            modifierGroupId: "group-sauces",
            modifiers: [{ modifierId: "modifier-garlic", quantity: 1 }],
          },
        ],
      },
      undefined
    );
    expect(postCartMock.mock.calls[0][1]).not.toHaveProperty("modifiers");
  });

  it("updates customer cart item with grouped modifier selections", async () => {
    patchCartMock.mockResolvedValue({ success: true });

    await updateCustomerCartItem({
      cartItemId: "cart-item-1",
      payload: {
        quantity: 2,
        modifierSelections: [
          {
            modifierGroupId: "group-sauces",
            modifiers: [{ modifierId: "modifier-garlic", quantity: 1 }],
          },
        ],
      },
    });

    expect(patchCartMock).toHaveBeenCalledWith(
      "/v1/cart/items/cart-item-1",
      {
        quantity: 2,
        modifierSelections: [
          {
            modifierGroupId: "group-sauces",
            modifiers: [{ modifierId: "modifier-garlic", quantity: 1 }],
          },
        ],
      },
      undefined
    );
    expect(patchCartMock.mock.calls[0][1]).not.toHaveProperty("modifiers");
  });

  it("refreshes customer cart quote", async () => {
    postCartMock.mockResolvedValue({
      data: {
        appliedPromotion: {
          id: "deal-1",
          title: "Burger Combo",
          discountAmount: 301,
        },
      },
    });

    const response = await quoteCustomerCart({ customerId: "customer-1" });

    expect(postCartMock).toHaveBeenCalledWith(
      "/v1/cart/quote?customerId=customer-1",
      {},
      undefined
    );
    expect(response).toMatchObject({
      data: {
        appliedPromotion: {
          id: "deal-1",
          discountAmount: 301,
        },
      },
    });
  });
});
