import { describe, expect, it } from "vitest";
import type { CartQuote } from "@/types/cart";

import {
  createCartMutationCoordinator,
  resolveDeliveryQuoteResult,
  shouldShowFloatingCart,
} from "./cart-reliability";

describe("cart mutation coordination", () => {
  it("serializes mutations so a second row cannot race the active response", () => {
    const coordinator = createCartMutationCoordinator();
    const first = coordinator.start();

    expect(first).not.toBeNull();
    expect(coordinator.start()).toBeNull();
    expect(coordinator.finish(first!)).toBe(true);
    expect(coordinator.start()).not.toBeNull();
  });

  it("does not let an older finally block release a newer mutation", () => {
    const coordinator = createCartMutationCoordinator();
    const first = coordinator.start();

    expect(first).not.toBeNull();
    expect(coordinator.finish(first!)).toBe(true);
    const second = coordinator.start();
    expect(second).not.toBeNull();

    expect(coordinator.finish(first!)).toBe(false);
    expect(coordinator.start()).toBeNull();
  });
});

describe("delivery quote result", () => {
  const normalizeQuote = (value: unknown) =>
    value && typeof value === "object" ? (value as CartQuote) : null;

  it("distinguishes an address-free cart from a failed quote", () => {
    expect(resolveDeliveryQuoteResult(false, null, normalizeQuote)).toEqual({
      status: "not-applicable",
      quote: null,
    });
  });

  it.each([
    { error: "timeout", timedOut: true, data: undefined },
    { success: false, data: undefined },
  ])(
    "rejects failed delivery quotes without exposing fallback totals",
    (response) => {
      expect(
        resolveDeliveryQuoteResult(true, response as never, normalizeQuote),
      ).toEqual({ status: "error", quote: null });
    },
  );
});

describe("floating cart visibility", () => {
  it("keeps an initial empty-cart load failure visible for retry", () => {
    expect(shouldShowFloatingCart(false, "error")).toBe(true);
    expect(shouldShowFloatingCart(false, "ready")).toBe(false);
  });
});
