import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DEFAULT_LOCALE,
  getRequestLocale,
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  resolveLocale,
} from "@/config/i18n";

describe("i18n config", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses German as the default locale", () => {
    expect(DEFAULT_LOCALE).toBe("de");
  });

  it("supports English and German", () => {
    expect(SUPPORTED_LOCALES).toContain("en");
    expect(SUPPORTED_LOCALES).toContain("de");
  });

  it("resolves unsupported locales to German", () => {
    expect(resolveLocale("fr")).toBe("de");
    expect(resolveLocale(null)).toBe("de");
  });

  it("resolves a valid locale to itself", () => {
    expect(resolveLocale("de")).toBe("de");
    expect(resolveLocale("en")).toBe("en");
  });

  it("uses the Deliveryway customer locale storage key", () => {
    expect(LOCALE_STORAGE_KEY).toBe("deliveryway-customer-locale");
  });

  it("uses the persisted customer locale for API requests", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn().mockReturnValue("de"),
      },
    });

    expect(getRequestLocale()).toBe("de");
  });

  it("falls back to German when browser storage is unavailable", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: vi.fn(() => {
          throw new Error("Storage blocked");
        }),
      },
    });

    expect(getRequestLocale()).toBe("de");
  });
});
