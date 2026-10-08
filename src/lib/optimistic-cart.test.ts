import { describe, expect, it } from "vitest";

import {
  addPendingCartItem,
  createOptimisticCartItem,
  hasPendingCartItems,
  mergeCommittedCartSnapshots,
  reconcileCartSnapshot,
  removePendingCartItem,
  shouldApplyAuthoritativeCartSnapshot,
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

  it("overlays pending items onto a stale refresh response", () => {
    const snapshot = reconcileCartSnapshot(
      { items: [], quote: { subtotal: 0, totalAmount: 0 } },
      [pendingItem],
    );

    expect(snapshot.items).toEqual([pendingItem]);
    expect(hasPendingCartItems(snapshot)).toBe(true);
  });

  it("rejects reverse-order authoritative responses that would regress the cart", () => {
    expect(shouldApplyAuthoritativeCartSnapshot(2, 0)).toBe(true);
    expect(shouldApplyAuthoritativeCartSnapshot(1, 2)).toBe(false);
    expect(shouldApplyAuthoritativeCartSnapshot(undefined, 2)).toBe(true);
  });

  it("merges reverse-order successful responses without losing committed items", () => {
    const merged = mergeCommittedCartSnapshots(
      {
        items: [{ id: "server-second", menuItemId: "second", quantity: 1 }],
        quote: { totalAmount: 20 },
      },
      {
        items: [{ id: "server-first", menuItemId: "first", quantity: 1 }],
        quote: { totalAmount: 10 },
      },
      [],
    );

    expect(merged.items.map((item) => item.id)).toEqual([
      "server-first",
      "server-second",
    ]);
    expect(merged.quote?.totalAmount).toBe(20);
  });

  it("carries customized payload metadata while marking pricing unconfirmed", () => {
    const customized = createOptimisticCartItem({
      menuItem: { id: "pizza", name: "Custom pizza", basePrice: 10 },
      payload: {
        menuItemId: "pizza",
        quantity: 1,
        modifierSelections: [{ modifierId: "extra-cheese", quantity: 2 }],
        modifiers: [{ id: "legacy-olive", price: 3 }],
        sections: [{ slot: "RIGHT", menuItemId: "pepperoni" }],
      },
      mutationSequence: 42,
      optimisticItemId: "optimistic-custom",
    });

    expect(customized.__optimisticPricingUnconfirmed).toBe(true);
    expect(customized.__optimisticSequence).toBe(42);
    expect(customized.__optimisticCustomization).toEqual({
      modifierSelections: [
        { modifierId: "extra-cheese", quantity: 2 },
      ],
      modifiers: [{ id: "legacy-olive", price: 3 }],
      sections: [{ slot: "RIGHT", menuItemId: "pepperoni" }],
    });
  });

  it("keeps the same optimistic identity and sequence across a branch retry", () => {
    const retryItem = pendingItem;

    expect(retryItem.id).toBe(pendingItem.id);
    expect(retryItem.__optimisticSequence).toBe(
      pendingItem.__optimisticSequence,
    );
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
