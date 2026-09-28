import { describe, expect, it } from "vitest";

import { getCustomTenantFaviconUrl } from "./server-favicon";

describe("server favicon trust boundary", () => {
  it("uses only the API-vetted favicon URL, never raw branding", () => {
    expect(
      getCustomTenantFaviconUrl({
        restaurantId: "restaurant-a",
        branding: {
          assets: { faviconUrl: "https://127.0.0.1/internal" },
        },
        brandingVersion: "unsafe",
        faviconUrl: null,
      }),
    ).toBeNull();

    expect(
      getCustomTenantFaviconUrl({
        restaurantId: "restaurant-a",
        branding: null,
        brandingVersion: "safe",
        faviconUrl: "https://signed-storage.example/favicon.webp",
      }),
    ).toBe("https://signed-storage.example/favicon.webp");
  });

  it("rejects credentials and non-HTTPS vetted URLs", () => {
    const context = {
      restaurantId: "restaurant-a",
      branding: null,
      brandingVersion: "unsafe",
    };

    expect(
      getCustomTenantFaviconUrl({
        ...context,
        faviconUrl: "http://signed-storage.example/favicon.webp",
      }),
    ).toBeNull();
    expect(
      getCustomTenantFaviconUrl({
        ...context,
        faviconUrl: "https://user:password@signed-storage.example/favicon.webp",
      }),
    ).toBeNull();
  });
});
