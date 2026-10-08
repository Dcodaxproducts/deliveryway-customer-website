import { describe, expect, it } from "vitest";

import {
  addPendingCartItem,
  createOptimisticCartItem,
  hasPendingCartItems,
  reconcileCartSnapshot,
  removePendingCartItem,
} from "./optimistic-cart";

const pendingItem = createOptimisticCartItem({
  menuItem: {
    id: "menu-item-1",
    name: "Margherita",
    basePrice: 12,
  },
  payload: {
    branchId: "branch-1",
    menuItemId: "menu-item-1",
    quantity: 2,
    variationId: "large",
  },
  selectedVariation: {
    id: "large",
    name: "Large",
    price: 15,
  },
  optimisticItemId: "optimistic-test-item",
});

describe("optimistic cart snapshots", () => {
  it("adds a visible pending item immediately with a stable temporary id", () => {
    const snapshot = addPendingCartItem({ items: [], quote: null }, pendingItem);

    expect(snapshot.items).toEqual([pendingItem]);
    expect(snapshot.items[0].id).toBe("optimistic-test-item");
    expect(hasPendingCartItems(snapshot)).toBe(true);
  });

  it("replaces the committed optimistic item with authoritative cart data", () => {
    const snapshot = reconcileCartSnapshot(
      {
        items: [
          {
            id: "server-item-1",
            menuItemId: "menu-item-1",
            quantity: 2,
          },
        ],
        quote: { subtotal: 30, totalAmount: 30 },
      },
      [],
    );

    expect(snapshot.items.map((item) => item.id)).toEqual(["server-item-1"]);
    expect(hasPendingCartItems(snapshot)).toBe(false);
  });

  it("preserves other pending items while reconciling an authoritative response", () => {
    const snapshot = reconcileCartSnapshot(
      { items: [{ id: "server-item-1", quantity: 1 }], quote: null },
      [pendingItem],
    );

    expect(snapshot.items.map((item) => item.id)).toEqual([
      "server-item-1",
      "optimistic-test-item",
    ]);
  });

  it("removes the matching pending item on rollback", () => {
    const withPending = addPendingCartItem(
      { items: [{ id: "existing", quantity: 1 }], quote: null },
      pendingItem,
    );
    const rolledBack = removePendingCartItem(
      withPending,
      "optimistic-test-item",
    );

    expect(rolledBack.items.map((item) => item.id)).toEqual(["existing"]);
    expect(hasPendingCartItems(rolledBack)).toBe(false);
  });
});
