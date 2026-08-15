import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resolveDomainContext } from "./domain-context";

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
    await expect(resolveDomainContext("retry.example.com")).resolves.toMatchObject(
      { restaurantId: "restaurant-2" },
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
