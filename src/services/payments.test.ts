import { beforeEach, describe, expect, it, vi } from "vitest";

import { capturePaypalOrder, createOrderPaymentAttempt } from "./payments";

const postPaymentsMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/domain-api", () => ({
  createDomainApiService: () => ({
    get: vi.fn(),
    post: postPaymentsMock,
    patch: vi.fn(),
    del: vi.fn(),
  }),
}));

describe("payments service", () => {
  beforeEach(() => {
    postPaymentsMock.mockReset();
  });

  it("starts a payment attempt for an existing order and reads paymentSession first", async () => {
    postPaymentsMock.mockResolvedValue({
      success: true,
      data: {
        id: "payment-1",
        providerData: {
          clientSecret: "provider-secret",
          publishableKey: "provider-key",
        },
      },
      paymentSession: {
        clientSecret: "session-secret",
        publishableKey: "session-key",
      },
    });

    const result = await createOrderPaymentAttempt({
      orderId: "order-1",
      payload: {
        paymentMethod: "STRIPE",
        currency: "USD",
        note: "Retry order payment",
      },
      token: "token-1",
    });

    expect(postPaymentsMock).toHaveBeenCalledWith(
      "/v1/payments/orders/order-1/attempts",
      {
        paymentMethod: "STRIPE",
        currency: "USD",
        note: "Retry order payment",
      },
      "token-1"
    );
    expect(result.clientSecret).toBe("session-secret");
    expect(result.publishableKey).toBe("session-key");
    expect(result.payment?.id).toBe("payment-1");
  });

  it("falls back to providerData when paymentSession is missing", async () => {
    postPaymentsMock.mockResolvedValue({
      success: true,
      data: {
        id: "payment-1",
        providerData: {
          clientSecret: "provider-secret",
          publishableKey: "provider-key",
        },
      },
    });

    const result = await createOrderPaymentAttempt({
      orderId: "order-1",
      payload: {
        paymentMethod: "STRIPE",
        currency: "USD",
      },
    });

    expect(result.clientSecret).toBe("provider-secret");
    expect(result.publishableKey).toBe("provider-key");
  });

  it("returns the PayPal approval URL from the payment session", async () => {
    postPaymentsMock.mockResolvedValue({
      success: true,
      data: {
        id: "payment-2",
        providerData: {
          approvalUrl: "https://www.paypal.com/provider-approval",
        },
      },
      paymentSession: {
        approvalUrl: "https://www.paypal.com/session-approval",
      },
    });

    const result = await createOrderPaymentAttempt({
      orderId: "order-2",
      payload: {
        paymentMethod: "PAYPAL",
        currency: "EUR",
      },
    });

    expect(result.approvalUrl).toBe(
      "https://www.paypal.com/session-approval",
    );
  });

  it("falls back to the PayPal approval URL in provider data", async () => {
    postPaymentsMock.mockResolvedValue({
      success: true,
      data: {
        id: "payment-3",
        providerData: {
          approvalUrl: "https://www.paypal.com/provider-approval",
        },
      },
    });

    const result = await createOrderPaymentAttempt({
      orderId: "order-3",
      payload: {
        paymentMethod: "PAYPAL",
      },
    });

    expect(result.approvalUrl).toBe(
      "https://www.paypal.com/provider-approval",
    );
  });

  it("captures a returned PayPal order", async () => {
    postPaymentsMock.mockResolvedValue({
      success: true,
      data: { id: "payment-4", status: "PAID" },
    });

    await capturePaypalOrder({
      orderId: "order-4",
      paypalOrderId: "paypal-order-4",
      token: "token-4",
    });

    expect(postPaymentsMock).toHaveBeenCalledWith(
      "/v1/payments/orders/order-4/paypal/capture",
      { paypalOrderId: "paypal-order-4" },
      "token-4",
    );
  });
});
