import { describe, expect, it } from "vitest";

import { resolveCheckoutErrorMessage } from "@/components/pages/Checkout/utils/checkout-errors";
import de from "@/messages/de.json";
import en from "@/messages/en.json";

const translator = (messages: { checkout: unknown }) => (key: string) => {
  const value = key.split(".").reduce<unknown>((current, segment) => {
    if (!current || typeof current !== "object" || Array.isArray(current)) return undefined;
    return (current as Record<string, unknown>)[segment];
  }, messages.checkout);

  return typeof value === "string" ? value : key;
};

describe("resolveCheckoutErrorMessage", () => {
  it.each([
    ["BRANCH_TEMPORARILY_CLOSED", "errors.branchTemporarilyClosed"],
    ["BRANCH_HOLIDAY_CLOSED", "errors.branchHolidayClosed"],
    ["MINIMUM_ORDER_AMOUNT_NOT_MET", "errors.minimumOrderAmountNotMet"],
    ["DELIVERY_ADDRESS_OUTSIDE_AREA", "errors.outsideDeliveryArea"],
  ])("maps backend code %s in English and German", (code, key) => {
    expect(resolveCheckoutErrorMessage({ code, message: "backend text" }, translator(en), "fallback"))
      .toBe(translator(en)(key));
    expect(resolveCheckoutErrorMessage({ code, message: "backend text" }, translator(de), "fallback"))
      .toBe(translator(de)(key));
  });

  it.each([
    ["Delivery address is outside branch delivery zones", "errors.outsideDeliveryArea"],
    ["Delivery address is outside branch delivery zone bands", "errors.outsideDeliveryArea"],
    ["Delivery address postal code is not serviceable for this branch", "errors.outsideDeliveryArea"],
    ["This address is outside the restaurant's delivery area.", "errors.outsideDeliveryArea"],
    ["This address is outside the restaurant’s delivery area.", "errors.outsideDeliveryArea"],
    ["Delivery address must include lat/lng", "errors.incompleteDeliveryAddress"],
    ["Branch delivery zones are not configured", "errors.deliveryConfigurationUnavailable"],
    ["Delivery is not available at requested order time", "errors.deliveryTimeUnavailable"],
    ["Pickup is not available at requested order time", "errors.pickupTimeUnavailable"],
    ["Branch not found or inactive", "errors.branchUnavailable"],
  ])("maps backend message %s in English and German", (message, key) => {
    expect(resolveCheckoutErrorMessage({ code: "INTERNAL_ERROR", message }, translator(en), "fallback"))
      .toBe(translator(en)(key));
    expect(resolveCheckoutErrorMessage({ code: "INTERNAL_ERROR", message }, translator(de), "fallback"))
      .toBe(translator(de)(key));
  });

  it("preserves an unknown English backend message instead of replacing it with the wrong error", () => {
    expect(resolveCheckoutErrorMessage(
      { code: "NEW_BACKEND_ERROR", message: "Specific backend explanation" },
      translator(en),
      "fallback",
    )).toBe("Specific backend explanation");
  });
});
