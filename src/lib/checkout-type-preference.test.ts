import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  checkoutTypeToOrderType,
  getStoredCheckoutTypePreference,
  orderTypeToCheckoutType,
  resolveCheckoutTypePreference,
  setStoredCheckoutTypePreference,
} from "@/lib/checkout-type-preference";

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

describe("checkout type preference", () => {
  beforeEach(() => {
    storage.clear();
  });

  it("stores and reads delivery or pickup preferences", () => {
    expect(getStoredCheckoutTypePreference()).toBeNull();

    setStoredCheckoutTypePreference("pickup");
    expect(getStoredCheckoutTypePreference()).toBe("pickup");

    setStoredCheckoutTypePreference("delivery");
    expect(getStoredCheckoutTypePreference()).toBe("delivery");
  });

  it("maps checkout types to backend order types", () => {
    expect(checkoutTypeToOrderType("pickup")).toBe("TAKEAWAY");
    expect(checkoutTypeToOrderType("delivery")).toBe("DELIVERY");
  });

  it("maps backend order types to checkout types", () => {
    expect(orderTypeToCheckoutType("TAKEAWAY")).toBe("pickup");
    expect(orderTypeToCheckoutType("DELIVERY")).toBe("delivery");
    expect(orderTypeToCheckoutType("DINE_IN")).toBeNull();
  });

  it("keeps a stored delivery choice when pickup is also available", () => {
    expect(
      resolveCheckoutTypePreference({
        availableTypes: ["delivery", "pickup"],
        selectedOrderType: "TAKEAWAY",
        storedType: "delivery",
      }),
    ).toBe("delivery");
  });

  it("falls back to the selected branch order type when no choice is stored", () => {
    expect(
      resolveCheckoutTypePreference({
        availableTypes: ["delivery", "pickup"],
        selectedOrderType: "TAKEAWAY",
        storedType: null,
      }),
    ).toBe("pickup");
  });
});
