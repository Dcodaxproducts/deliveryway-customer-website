import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getLocalDomainContext,
  normalizeDomainContext,
  normalizeDomainHost,
  readStoredDomainContext,
  writeStoredDomainContext,
  DOMAIN_CONTEXT_STORAGE_TTL_MS,
} from "./domain-context";

describe("domain context helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes hostnames from full URLs and host headers", () => {
    expect(normalizeDomainHost("https://Pizza.Example.com/menu")).toBe("pizza.example.com");
    expect(normalizeDomainHost("www.brand.example.com:3000")).toBe("www.brand.example.com");
  });

  it("extracts valid context from API envelopes", () => {
    expect(
      normalizeDomainContext({
        data: {
          tenantId: "tenant-1",
          restaurantId: "restaurant-1",
          restaurantName: "Pizza",
          branchId: "branch-1",
        },
      }),
    ).toMatchObject({
      tenantId: "tenant-1",
      restaurantId: "restaurant-1",
      branchId: "branch-1",
    });
  });

  it("rejects responses without a restaurant id", () => {
    expect(normalizeDomainContext({ data: { branchId: "branch-1" } })).toBeNull();
  });

  it("uses the development restaurant when running on localhost", () => {
    expect(getLocalDomainContext("localhost:3000")).toEqual({
      restaurantId: "cmp0t09gu0024t7ilmt3x4diu",
      host: "localhost",
    });
  });

  it("does not provide a fallback for deployed domains", () => {
    expect(getLocalDomainContext("restaurant.delivery-way.de")).toBeNull();
  });

  it("does not hydrate domain context stored for another restaurant host", () => {
    const removeItem = vi.fn();
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () =>
          JSON.stringify({
            context: {
              restaurantId: "restaurant-1",
              branchId: "branch-1",
              host: "first.delivery-way.de",
            },
            cachedAt: 100,
          }),
        removeItem,
      },
    });

    expect(readStoredDomainContext("second.delivery-way.de", 101)).toBeNull();
    expect(removeItem).toHaveBeenCalled();
  });

  it("expires stored signed media context instead of persisting private URLs", () => {
    let storedValue: string | null = null;
    const removeItem = vi.fn(() => {
      storedValue = null;
    });
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => storedValue,
        setItem: (_key: string, value: string) => {
          storedValue = value;
        },
        removeItem,
      },
    });

    writeStoredDomainContext(
      {
        restaurantId: "restaurant-1",
        host: "pizza.delivery-way.de",
        logoUrl: "https://media.example/logo.webp?X-Amz-Signature=private",
      },
      1_000,
    );

    expect(readStoredDomainContext("pizza.delivery-way.de", 1_001)?.logoUrl).toContain(
      "X-Amz-Signature",
    );
    expect(
      readStoredDomainContext(
        "pizza.delivery-way.de",
        1_000 + DOMAIN_CONTEXT_STORAGE_TTL_MS + 1,
      ),
    ).toBeNull();
    expect(removeItem).toHaveBeenCalled();
  });
});
