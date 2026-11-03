import { afterEach, describe, expect, it, vi } from "vitest";

import { LOCALE_STORAGE_KEY } from "@/config/i18n";

import { buildApiUrl, normalizeApiEndpoint } from "./api-endpoint";
import { API_REQUEST_TIMEOUT_MS, httpClient } from "./axios";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("normalizeApiEndpoint", () => {
  it("removes duplicate v1 when the base URL already includes v1", () => {
    expect(normalizeApiEndpoint("/v1/branches", "https://api.example.com/api/v1")).toBe("/branches");
    expect(normalizeApiEndpoint("v1/branches", "https://api.example.com/api/v1/")).toBe("/branches");
  });

  it("keeps v1 when the base URL does not include v1", () => {
    expect(normalizeApiEndpoint("/v1/branches", "https://api.example.com/api")).toBe("/v1/branches");
  });

  it("keeps customer app endpoints under the configured API base", () => {
    expect(normalizeApiEndpoint("/customer-app/home", "https://api.example.com/api/v1")).toBe("/customer-app/home");
  });

  it("builds absolute API URLs without duplicating v1", () => {
    expect(buildApiUrl("https://api.example.com/api/v1", "/v1/branches")).toBe(
      "https://api.example.com/api/v1/branches"
    );
    expect(buildApiUrl("https://api.example.com/api", "/v1/branches")).toBe(
      "https://api.example.com/api/v1/branches"
    );
  });
});

describe("httpClient request context", () => {
  it("bounds API requests so loading states cannot wait indefinitely", () => {
    expect(httpClient.defaults.timeout).toBe(API_REQUEST_TIMEOUT_MS);
    expect(API_REQUEST_TIMEOUT_MS).toBe(15_000);
  });

  it("adds the persisted locale to first-party API requests", async () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn((key: string) =>
          key === LOCALE_STORAGE_KEY ? "de" : null,
        ),
      },
    });
    let acceptLanguage: string | undefined;

    await httpClient.get("/customer-app/home", {
      adapter: async (config) => {
        acceptLanguage = config.headers.get("Accept-Language")?.toString();

        return {
          config,
          data: {},
          headers: {},
          status: 200,
          statusText: "OK",
        };
      },
    });

    expect(acceptLanguage).toBe("de");
  });
});
