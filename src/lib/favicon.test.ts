import { describe, expect, it } from "vitest";

import {
  getFaviconMetadata,
  getRequestHost,
  getTenantFaviconUrl,
  getVersionedFaviconHref,
} from "./favicon";

describe("tenant favicon helpers", () => {
  it("reads canonical and legacy nested favicon values", () => {
    expect(
      getTenantFaviconUrl({ assets: { faviconUrl: "/tenant.png" } }),
    ).toBe("/tenant.png");
    expect(
      getTenantFaviconUrl({
        assets: { logos: { faviconUrl: "/legacy.ico" } },
      }),
    ).toBe("/legacy.ico");
    expect(getTenantFaviconUrl({ assets: { faviconUrl: "" } })).toBeNull();
  });

  it("normalizes forwarded hosts without mixing proxy or port data", () => {
    expect(
      getRequestHost(
        new Headers({
          host: "internal:3000",
          "x-forwarded-host": "Tenant-A.Example:443, proxy.internal",
        }),
      ),
    ).toBe("tenant-a.example");
    expect(getRequestHost(new Headers({ host: "tenant-b.example:3000" }))).toBe(
      "tenant-b.example",
    );
  });

  it("renders a deterministic versioned metadata icon", () => {
    expect(getVersionedFaviconHref("asset-update-2")).toBe(
      "/favicon.ico?v=asset-update-2",
    );
    expect(getFaviconMetadata("asset-update-2")).toEqual({
      icon: [{ url: "/favicon.ico?v=asset-update-2" }],
      shortcut: [{ url: "/favicon.ico?v=asset-update-2" }],
    });
    expect(getVersionedFaviconHref(null)).toBe("/favicon.ico?v=fallback");
  });
});
