import { describe, expect, it } from "vitest";

import {
  getPaymentStatusTranslationKey,
  isPaymentPendingOnlineOrder,
  isPaymentPendingStripeOrder,
  isPlacedPaidOrder,
} from "./payment-state";

describe("order payment state", () => {
  it("treats PAYMENT_PENDING Stripe orders as not placed", () => {
    const order = {
      paymentMethod: "STRIPE",
      paymentStatus: "PENDING",
      status: "PAYMENT_PENDING",
    };

    expect(isPaymentPendingStripeOrder(order)).toBe(true);
    expect(isPaymentPendingOnlineOrder(order)).toBe(true);
    expect(isPlacedPaidOrder(order)).toBe(false);
  });

  it("treats PAYMENT_PENDING PayPal orders as online payments", () => {
    const order = {
      paymentMethod: "PAYPAL",
      paymentStatus: "PENDING",
      status: "PAYMENT_PENDING",
    };

    expect(isPaymentPendingOnlineOrder(order)).toBe(true);
    expect(isPaymentPendingStripeOrder(order)).toBe(false);
    expect(isPlacedPaidOrder(order)).toBe(false);
  });

  it("requires Stripe orders to be PLACED and PAID before placed UI", () => {
    expect(
      isPlacedPaidOrder({
        paymentMethod: "STRIPE",
        paymentStatus: "PAID",
        status: "PAYMENT_PENDING",
      }),
    ).toBe(false);
    expect(
      isPlacedPaidOrder({
        paymentMethod: "STRIPE",
        paymentStatus: "PENDING",
        status: "PLACED",
      }),
    ).toBe(false);
    expect(
      isPlacedPaidOrder({
        paymentMethod: "STRIPE",
        paymentStatus: "PAID",
        status: "PLACED",
      }),
    ).toBe(true);
  });

  it("keeps non-Stripe placed semantics unchanged", () => {
    expect(
      isPlacedPaidOrder({
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        status: "PLACED",
      }),
    ).toBe(true);
  });

  it.each(["STRIPE", "PAYPAL"])(
    "labels paid %s orders as online paid",
    (method) => {
      expect(getPaymentStatusTranslationKey("PAID", method)).toBe(
        "paymentStatus.onlinePaid",
      );
    },
  );

  it("labels paid COD orders as paid", () => {
    expect(getPaymentStatusTranslationKey("PAID", "COD")).toBe(
      "paymentStatus.paid",
    );
  });
});
