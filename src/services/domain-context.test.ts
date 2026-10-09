import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DOMAIN_CONTEXT_CACHE_TTL_MS,
  resolveDomainContext,
} from "./domain-context";

vi.mock("@/lib/axios", () => ({
  API_BASE_URL: "https://api.example.com/api/v1",
}));

vi.mock("@/config/i18n", () => ({
  getRequestLocale: () => "en",
}));

const fetchMock = vi.fn<typeof fetch>();

const createResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("resolveDomainContext", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("shares one request across concurrent and later consumers", async () => {
    fetchMock.mockResolvedValue(
      createResponse({
        data: {
          restaurantId: "restaurant-1",
          branchId: "branch-1",
          host: "shared.example.com",
        },
      }),
    );

    const contexts = await Promise.all([
      resolveDomainContext("shared.example.com"),
      resolveDomainContext("shared.example.com"),
      resolveDomainContext("https://shared.example.com/items"),
    ]);
    const laterContext = await resolveDomainContext("shared.example.com");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(contexts).toEqual([
      expect.objectContaining({ restaurantId: "restaurant-1" }),
      expect.objectContaining({ restaurantId: "restaurant-1" }),
      expect.objectContaining({ restaurantId: "restaurant-1" }),
    ]);
    expect(laterContext).toMatchObject({ restaurantId: "restaurant-1" });
  });

  it("refreshes context before signed media URLs can remain stale", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-09T12:00:00.000Z"));
    fetchMock
      .mockResolvedValueOnce(
        createResponse({
          data: {
            restaurantId: "restaurant-signed-media",
            host: "signed-media.example.com",
            logoUrl: "https://media.example/logo.webp?X-Amz-Signature=first",
          },
        }),
      )
      .mockResolvedValueOnce(
        createResponse({
          data: {
            restaurantId: "restaurant-signed-media",
            host: "signed-media.example.com",
            logoUrl: "https://media.example/logo.webp?X-Amz-Signature=second",
          },
        }),
      );

    const first = await resolveDomainContext("signed-media.example.com");
    vi.setSystemTime(Date.now() + DOMAIN_CONTEXT_CACHE_TTL_MS + 1);
    const refreshed = await resolveDomainContext("signed-media.example.com");

    expect(first.logoUrl).toContain("Signature=first");
    expect(refreshed.logoUrl).toContain("Signature=second");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("evicts failed requests so a later consumer can retry", async () => {
    fetchMock
      .mockResolvedValueOnce(
        createResponse({ message: "Domain context unavailable" }, 503),
      )
      .mockResolvedValueOnce(
        createResponse({
          data: {
            restaurantId: "restaurant-2",
            branchId: "branch-2",
            host: "retry.example.com",
          },
        }),
      );

    await expect(resolveDomainContext("retry.example.com")).rejects.toThrow(
      "Domain context unavailable",
    );
    await expect(
      resolveDomainContext("retry.example.com"),
    ).resolves.toMatchObject({ restaurantId: "restaurant-2" });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("deduplicates apex and www custom-domain bootstrap requests", async () => {
    fetchMock.mockResolvedValueOnce(
      createResponse({
        data: {
          restaurantId: "restaurant-pizzeria",
          tenantId: "tenant-pizzeria",
          host: "pizzeriafourstar.de",
          customDomain: "www.pizzeriafourstar.de",
          subdomain: "pizzeria-four-star",
        },
      }),
    );

    const [apex, www] = await Promise.all([
      resolveDomainContext("pizzeriafourstar.de"),
      resolveDomainContext("www.pizzeriafourstar.de"),
    ]);

    expect(apex.restaurantId).toBe("restaurant-pizzeria");
    expect(www.restaurantId).toBe("restaurant-pizzeria");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain(
      "host=pizzeriafourstar.de",
    );
  });

  it("refreshes context before short-lived signed media URLs can remain stale forever", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-09T12:00:00.000Z"));
    fetchMock
      .mockResolvedValueOnce(
        createResponse({
          data: {
            restaurantId: "restaurant-signed-media",
            host: "signed-media.example.com",
            logoUrl: "https://media.example.com/logo.webp?signature=first",
          },
        }),
      )
      .mockResolvedValueOnce(
        createResponse({
          data: {
            restaurantId: "restaurant-signed-media",
            host: "signed-media.example.com",
            logoUrl: "https://media.example.com/logo.webp?signature=second",
          },
        }),
      );

    const first = await resolveDomainContext("signed-media.example.com");
    vi.setSystemTime(Date.now() + DOMAIN_CONTEXT_CACHE_TTL_MS + 1);
    const refreshed = await resolveDomainContext("signed-media.example.com");

    expect(first.logoUrl).toContain("signature=first");
    expect(refreshed.logoUrl).toContain("signature=second");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
