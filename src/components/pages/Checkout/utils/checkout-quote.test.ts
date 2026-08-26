import { describe, expect, it } from "vitest";
import { getCheckoutQuotePayload } from "./checkout-quote";
import type { CheckoutAddressValues } from "@/validations/checkout";

const address: CheckoutAddressValues = {
  street: "Hauptstraße",
  houseNumber: "12",
  postalCode: "10115",
  city: "Berlin",
  state: "Berlin",
  country: "Germany",
  area: "",
  lat: "52.532",
  lng: "13.384",
  isDefault: false,
};

describe("getCheckoutQuotePayload", () => {
  it("keeps the selected online payment method when refreshing a cart quote", () => {
    expect(
      getCheckoutQuotePayload({
        activeTab: "delivery",
        checkoutPaymentMethod: "STRIPE",
        guestDeliveryAddress: address,
        isGuest: false,
        selectedAddress: "address-1",
      }),
    ).toEqual({
      paymentMethod: "STRIPE",
      deliveryAddressId: "address-1",
    });
  });

  it("includes a valid guest address in the refreshed quote", () => {
    expect(
      getCheckoutQuotePayload({
        activeTab: "delivery",
        checkoutPaymentMethod: "PAYPAL",
        guestDeliveryAddress: address,
        isGuest: true,
        selectedAddress: null,
      }),
    ).toMatchObject({
      paymentMethod: "PAYPAL",
      guestDeliveryAddress: {
        street: "Hauptstraße",
        houseNumber: "12",
      },
    });
  });
});
