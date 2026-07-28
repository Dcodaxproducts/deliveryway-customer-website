import { describe, expect, it } from "vitest";

import { getAvailableCheckoutPaymentMethods } from "./payment-methods";

describe("getAvailableCheckoutPaymentMethods", () => {
  it("returns only configured methods in checkout display order", () => {
    expect(
      getAvailableCheckoutPaymentMethods({
        allowedPaymentMethods: [
          "BANK_TRANSFER",
          "JAZZCASH",
          "STRIPE",
          "COD",
          "EASYPAISA",
          "UNKNOWN",
        ],
        allowCardOnDelivery: true,
        allowCashOnDelivery: true,
        isGuest: false,
      }),
    ).toEqual(["COD", "STRIPE", "EASYPAISA", "JAZZCASH", "BANK_TRANSFER"]);
  });

  it("hides wallet for guests and card-on-delivery for pickup", () => {
    expect(
      getAvailableCheckoutPaymentMethods({
        allowedPaymentMethods: ["COD", "CARD_ON_DELIVERY", "WALLET"],
        allowCardOnDelivery: false,
        allowCashOnDelivery: true,
        isGuest: true,
      }),
    ).toEqual(["COD"]);
  });

  it("does not invent fallback methods without configuration", () => {
    expect(
      getAvailableCheckoutPaymentMethods({
        allowedPaymentMethods: undefined,
        allowCardOnDelivery: true,
        allowCashOnDelivery: true,
        isGuest: false,
      }),
    ).toEqual([]);
  });
});
