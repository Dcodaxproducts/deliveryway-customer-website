import { describe, expect, it } from "vitest";

import { STRIPE_PAYMENT_ELEMENT_OPTIONS } from "./stripe-payment-element";

describe("Stripe Payment Element options", () => {
  it("keeps Apple Pay and Google Pay enabled when the browser is eligible", () => {
    expect(STRIPE_PAYMENT_ELEMENT_OPTIONS.wallets).toEqual({
      applePay: "auto",
      googlePay: "auto",
    });
  });
});
