import { describe, expect, it } from "vitest";

import {
  getGuestDeliveryAddressFromStoredLocation,
  getGuestDeliveryAddressPayload,
  hasGuestDeliveryAddress,
} from "./guest-delivery-address";
import type { CheckoutAddressValues } from "@/validations/checkout";

const completeAddress: CheckoutAddressValues = {
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

describe("guest delivery address", () => {
  it("requires derived administrative fields and coordinates", () => {
    expect(hasGuestDeliveryAddress(completeAddress)).toBe(true);
    expect(
      hasGuestDeliveryAddress({ ...completeAddress, houseNumber: "" }),
    ).toBe(false);
    expect(hasGuestDeliveryAddress({ ...completeAddress, state: "" })).toBe(
      false,
    );
    expect(hasGuestDeliveryAddress({ ...completeAddress, country: "" })).toBe(
      false,
    );
    expect(hasGuestDeliveryAddress({ ...completeAddress, lat: "" })).toBe(
      false,
    );
    expect(hasGuestDeliveryAddress({ ...completeAddress, lng: "" })).toBe(
      false,
    );
  });

  it("keeps derived fields in the backend payload", () => {
    expect(getGuestDeliveryAddressPayload(completeAddress)).toEqual({
      street: "Hauptstraße",
      houseNumber: "12",
      area: "12",
      postalCode: "10115",
      city: "Berlin",
      state: "Berlin",
      country: "Germany",
      lat: "52.532",
      lng: "13.384",
    });
  });

  it("hydrates checkout from the structured location selected on home", () => {
    expect(
      getGuestDeliveryAddressFromStoredLocation({
        lat: 52.532,
        lng: 13.384,
        label: "Hauptstraße 12, 10115 Berlin",
        address: {
          street: "Hauptstraße",
          houseNumber: "12",
          postalCode: "10115",
          city: "Berlin",
          state: "Berlin",
          country: "Germany",
        },
      }),
    ).toEqual(completeAddress);
  });
});
