import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearStoredDeliveryLocation,
  getStoredDeliveryLocation,
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
});
