import { describe, expect, it } from "vitest";

import {
  buildGiftCardGuestPurchasePayload,
  buildGiftCardPurchasePayload,
  buildGiftCardRedeemPayload,
  giftCardGuestPurchaseSchema,
  giftCardPurchaseSchema,
  giftCardRedeemSchema,
} from "./gift-cards";

describe("giftCardPurchaseSchema", () => {
  it("requires a positive amount", () => {
    expect(giftCardPurchaseSchema.safeParse({ amount: 0 }).success).toBe(false);
    expect(giftCardPurchaseSchema.safeParse({ amount: 1000 }).success).toBe(true);
  });

  it("validates optional expiry date", () => {
    expect(
      giftCardPurchaseSchema.safeParse({
        amount: 1000,
        expiresAt: "not-a-date",
      }).success
    ).toBe(false);
  });

  it("builds purchase payload and omits empty optional fields", () => {
    expect(
      buildGiftCardPurchasePayload({
        amount: 1000,
        title: " Birthday Gift Card ",
        message: "",
        expiresAt: "2099-06-05T00:00",
      })
    ).toEqual({
      amount: 1000,
      title: "Birthday Gift Card",
      expiresAt: new Date("2099-06-05T00:00").toISOString(),
    });
  });

  it("requires a recipient email for guest purchases", () => {
    expect(
      giftCardGuestPurchaseSchema.safeParse({
        amount: 50,
        buyerEmail: "buyer@example.com",
      }).success
    ).toBe(false);
  });

  it("sends buyer and recipient emails as separate normalized fields", () => {
    const result = giftCardGuestPurchaseSchema.parse({
      amount: 50,
      buyerEmail: " buyer@example.com ",
      recipientEmail: " recipient@example.com ",
      buyerName: " Buyer ",
    });

    expect(buildGiftCardGuestPurchasePayload(result)).toEqual({
      amount: 50,
      buyerEmail: "buyer@example.com",
      recipientEmail: "recipient@example.com",
      buyerName: "Buyer",
    });
  });
});

describe("giftCardRedeemSchema", () => {
  it("rejects empty code", () => {
    expect(giftCardRedeemSchema.safeParse({ code: "   " }).success).toBe(false);
  });

  it("accepts normal gift card codes", () => {
    expect(
      giftCardRedeemSchema.safeParse({ code: " GIFT-ABCDEFGHIJ " }).success
    ).toBe(true);
  });

  it("accepts QR payload gift card codes", () => {
    expect(
      giftCardRedeemSchema.safeParse({ code: " DWGC:GIFT-ABCDEFGHIJ " }).success
    ).toBe(true);
  });

  it("builder uppercases lowercase normal code input", () => {
    const result = giftCardRedeemSchema.safeParse({
      code: " gift-abcdefghij ",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(buildGiftCardRedeemPayload(result.data)).toEqual({
        code: "GIFT-ABCDEFGHIJ",
      });
    }
  });

  it("builder uppercases lowercase QR payload input", () => {
    const result = giftCardRedeemSchema.safeParse({
      code: " dwgc:gift-abcdefghij ",
    });

    expect(result.success).toBe(true);

    if (result.success) {
      expect(buildGiftCardRedeemPayload(result.data)).toEqual({
        code: "DWGC:GIFT-ABCDEFGHIJ",
      });
    }
  });
});
