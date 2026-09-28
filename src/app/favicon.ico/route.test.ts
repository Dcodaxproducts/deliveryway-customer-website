import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const apiResponse = (restaurantId: string, faviconUrl: string | null, version: string) =>
  new Response(
    JSON.stringify({
      data: {
        restaurantId,
        branding: { assets: { faviconUrl } },
        brandingVersion: version,
      },
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  );

describe("tenant favicon route", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test/api/v1");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("isolates favicon bytes by forwarded tenant host", async () => {
    const fetchMock = vi.fn(async (input: string | URL | Request) => {
      const url = String(input);
      if (url.includes("domain-context")) {
        const host = new URL(url).searchParams.get("host");
        return host === "tenant-a.example"
          ? apiResponse("restaurant-a", "https://cdn.example.test/a.webp", "v-a")
          : apiResponse("restaurant-b", "https://cdn.example.test/b.png", "v-b");
      }

      return url.endsWith("a.webp")
        ? new Response(new Uint8Array([1, 2, 3]), {
            headers: { "content-type": "image/webp" },
          })
        : new Response(new Uint8Array([4, 5, 6]), {
            headers: { "content-type": "image/png" },
          });
    });
    vi.stubGlobal("fetch", fetchMock);

    const first = await GET(
      new Request("https://internal/favicon.ico?v=v-a", {
        headers: { "x-forwarded-host": "tenant-a.example" },
      }),
    );
    const second = await GET(
      new Request("https://internal/favicon.ico?v=v-b", {
        headers: { "x-forwarded-host": "tenant-b.example" },
      }),
    );

    expect(Array.from(new Uint8Array(await first.arrayBuffer()))).toEqual([1, 2, 3]);
    expect(first.headers.get("content-type")).toBe("image/webp");
    expect(Array.from(new Uint8Array(await second.arrayBuffer()))).toEqual([4, 5, 6]);
    expect(second.headers.get("content-type")).toBe("image/png");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("host=tenant-a.example"),
      expect.any(Object),
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("host=tenant-b.example"),
      expect.any(Object),
    );
  });

  it("uses the product fallback when branding is cleared or invalid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(apiResponse("restaurant-a", null, "cleared")),
    );

    const response = await GET(
      new Request("https://tenant-a.example/favicon.ico?v=cleared"),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(response.headers.get("cache-control")).toContain("immutable");
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
  });

  it("falls back safely when an uploaded asset has a non-image MIME type", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        apiResponse(
          "restaurant-a",
          "https://cdn.example.test/not-an-image.svg",
          "invalid",
        ),
      )
      .mockResolvedValueOnce(
        new Response("not an image", {
          headers: { "content-type": "text/html" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    const response = await GET(
      new Request("https://tenant-a.example/favicon.ico?v=invalid"),
    );

    expect(response.headers.get("content-type")).toBe("image/jpeg");
  });
});
