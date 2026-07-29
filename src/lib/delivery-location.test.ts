import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearStoredDeliveryLocation,
  getStoredDeliveryLocation,
  getStoredSelectedDeliveryAddressId,
  resolvePreferredSavedDeliveryAddressId,
  setStoredSelectedDeliveryAddressId,
  setStoredDeliveryLocation,
} from "@/lib/delivery-location";

const storage = new Map<string, string>();

class StorageMock {}

const windowMock = {} as Window & typeof globalThis;

vi.stubGlobal("window", windowMock);
vi.stubGlobal("Storage", StorageMock);

const localStorageMock = new StorageMock() as Storage;
Object.assign(localStorageMock, {
  getItem: vi.fn((key: string) => storage.get(key) ?? null),
  setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
  removeItem: vi.fn((key: string) => storage.delete(key)),
});

Object.defineProperty(windowMock, "localStorage", {
  value: localStorageMock,
  configurable: true,
});

describe("delivery location storage", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("persists structured address details for guest checkout", () => {
    setStoredDeliveryLocation({
      lat: 51.432,
      lng: 6.88,
      label: "Heidestraße 8, 45476 Mülheim an der Ruhr",
      address: {
        street: "Heidestraße",
        houseNumber: "8",
        postalCode: "45476",
        city: "Mülheim an der Ruhr",
        state: "Nordrhein-Westfalen",
        country: "Deutschland",
      },
    });

    expect(getStoredDeliveryLocation()).toEqual({
      lat: 51.432,
      lng: 6.88,
      label: "Heidestraße 8, 45476 Mülheim an der Ruhr",
      address: {
        street: "Heidestraße",
        houseNumber: "8",
        postalCode: "45476",
        city: "Mülheim an der Ruhr",
        state: "Nordrhein-Westfalen",
        country: "Deutschland",
      },
    });

    clearStoredDeliveryLocation();
    expect(getStoredDeliveryLocation()).toBeNull();
  });

  it("keeps a selected saved address scoped to the authenticated customer", () => {
    setStoredSelectedDeliveryAddressId("customer-1", "address-2");

    expect(getStoredSelectedDeliveryAddressId("customer-1")).toBe("address-2");
    expect(getStoredSelectedDeliveryAddressId("customer-2")).toBeNull();
  });

  it("resolves the saved address selected by location before checkout", () => {
    expect(
      resolvePreferredSavedDeliveryAddressId({
        addresses: [
          {
            id: "default-address",
            lat: "52.5000",
            lng: "13.3000",
            isDefault: true,
          },
          {
            id: "home-selected-address",
            lat: "52.532",
            lng: "13.384",
          },
        ],
        location: {
          lat: 52.532,
          lng: 13.384,
          label: "Hauptstraße 12, 10115 Berlin",
        },
        storedAddressId: null,
      }),
    ).toBe("home-selected-address");
  });
});
