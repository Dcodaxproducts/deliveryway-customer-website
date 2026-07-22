import { describe, expect, it } from "vitest";

import { getLocalDomainContext, normalizeDomainContext, normalizeDomainHost } from "./domain-context";

describe("domain context helpers", () => {
  it("normalizes hostnames from full URLs and host headers", () => {
    expect(normalizeDomainHost("https://Pizza.Example.com/menu")).toBe("pizza.example.com");
    expect(normalizeDomainHost("www.brand.example.com:3000")).toBe("brand.example.com");
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
});
