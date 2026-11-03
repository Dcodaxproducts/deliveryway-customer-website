import { describe, expect, it, vi } from "vitest";

import { runOptimisticMutation } from "@/lib/optimistic-mutation";
import {
  addPendingCartItem,
  createOptimisticCartItem,
  removePendingCartItem,
} from "@/lib/optimistic-cart";
import { getApiErrorMessage } from "@/lib/errors";

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("runOptimisticMutation", () => {
  it("updates the UI before the server mutation settles", async () => {
    let resolveMutation: ((value: { success: boolean }) => void) | undefined;
    const mutation = new Promise<{ success: boolean }>((resolve) => {
      resolveMutation = resolve;
    });
    const onOptimistic = vi.fn();
    const onCommitted = vi.fn();
    const onRolledBack = vi.fn();

    runOptimisticMutation({
      mutation: () => mutation,
      isFailure: (result) => !result.success,
      onOptimistic,
      onCommitted,
      onRolledBack,
    });

    expect(onOptimistic).toHaveBeenCalledOnce();
    expect(onCommitted).not.toHaveBeenCalled();
    expect(onRolledBack).not.toHaveBeenCalled();

    resolveMutation?.({ success: true });
    await flushPromises();

    expect(onCommitted).toHaveBeenCalledWith({ success: true });
    expect(onRolledBack).not.toHaveBeenCalled();
  });

  it("rolls back when the server rejects the mutation result", async () => {
    const onRolledBack = vi.fn();

    runOptimisticMutation({
      mutation: async () => ({ success: false }),
      isFailure: (result) => !result.success,
      onOptimistic: vi.fn(),
      onRolledBack,
    });

    await flushPromises();

    expect(onRolledBack).toHaveBeenCalledWith({ success: false });
  });

  it("fully removes a Pizzeria pending row and preserves its localized API error", async () => {
    const pendingItem = createOptimisticCartItem({
      menuItem: { id: "pizza-schinken", name: "05. Pizza Schinken" },
      payload: {
        quantity: 1,
        variationId: "size-l",
        modifierSelections: [
          {
            modifierGroupId: "extras",
            modifiers: Array.from({ length: 9 }, (_, index) => ({
              modifierId: "extra-" + (index + 1),
              quantity: 1,
            })),
          },
        ],
      },
      selectedVariation: { id: "size-l", name: "L 32 cm ø" },
    });
    let snapshot = addPendingCartItem({ items: [], quote: null }, pendingItem);
    let displayedError = "";
    const failure = {
      success: false,
      error: {
        code: "Bad Request",
        message:
          "Ihre Zutaten-Auswahl ist ungültig. Bitte wählen Sie höchstens 9 Extras.",
      },
    };

    runOptimisticMutation({
      mutation: async () => failure,
      isFailure: (result) => !result.success,
      onOptimistic: vi.fn(),
      onRolledBack: (response) => {
        snapshot = removePendingCartItem(snapshot, pendingItem.id);
        displayedError = getApiErrorMessage(
          response,
          "Artikel konnte nicht gespeichert werden",
        );
      },
    });

    await flushPromises();

    expect(snapshot.items).toEqual([]);
    expect(displayedError).toBe(
      "Ihre Zutaten-Auswahl ist ungültig. Bitte wählen Sie höchstens 9 Extras.",
    );
  });

  it("rolls back when the server request throws", async () => {
    const error = new Error("offline");
    const onRolledBack = vi.fn();

    runOptimisticMutation({
      mutation: async () => {
        throw error;
      },
      isFailure: () => false,
      onOptimistic: vi.fn(),
      onRolledBack,
    });

    await flushPromises();

    expect(onRolledBack).toHaveBeenCalledWith(undefined, error);
  });
});
