import { describe, expect, it } from "vitest";

import { getBackendErrorMessage, getSelectedModifiers, getSelectedSections, normalizeCartItem, normalizeCartResponse, recalculateCartItemQuantity } from "./checkout-normalizers";

describe("checkout normalizers", () => {
  it("normalizes backend errors", () => {
    expect(getBackendErrorMessage({ data: { error: { message: "No stock" } } })).toBe("No stock");
  });

  it("normalizes selected modifiers", () => {
    expect(getSelectedModifiers({ selectedModifiers: [{ modifierId: "m1", name: "Cheese", quantity: 2, unitPrice: 1.5 }] })).toEqual([
      { modifierId: "m1", name: "Cheese", quantity: 2, unitPrice: 1.5, total: 3 },
    ]);
  });

  it("normalizes selected sections", () => {
    expect(
      getSelectedSections({
        menuItem: { id: "pizza", name: "Pizza", splitPizza: { allowedFlavors: [{ id: "right", name: "Right Pizza" }] } },
        sections: [{ slot: "RIGHT", menuItemId: "right", unitPrice: "12" }],
      })
    ).toEqual([{ slot: "RIGHT", label: "Right half", menuItemId: "right", menuItemName: "Right Pizza", unitPrice: 12 }]);
  });

  it("normalizes cart response and cart item quantity recalculation", () => {
    const { items } = normalizeCartResponse({ data: { items: [{ id: "1", quantity: 1, price: 5, menuItem: { name: "Burger" } }] } });
    const normalized = normalizeCartItem(items[0]);
    expect(normalized.name).toBe("Burger");
    expect(recalculateCartItemQuantity(normalized, 3).lineTotal).toBe(15);
  });
});
