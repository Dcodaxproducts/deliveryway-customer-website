// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";

import {
  addFaviconVersion,
  getBrandingFaviconUrl,
  normalizeBrowserImageUrl,
  resolveFaviconUrl,
  updateDocumentFavicons,
} from "./favicon";

afterEach(() => {
  document.head.innerHTML = "";
});

describe("tenant favicon", () => {
  it("prefers a configured tenant favicon and accepts safe relative media", () => {
    expect(
      resolveFaviconUrl({
        faviconUrl: "/tenant/favicon.png",
        logoUrl: "https://cdn.example.com/logo.png",
      }),
    ).toBe("/tenant/favicon.png");
    expect(normalizeBrowserImageUrl("javascript:alert(1)")).toBeNull();
  });

  it("updates every browser icon relation without duplicating warm updates", () => {
    updateDocumentFavicons(document, "https://cdn.example.com/tenant-a.png");
    updateDocumentFavicons(document, "https://cdn.example.com/tenant-b.png");

    const links = Array.from(document.head.querySelectorAll<HTMLLinkElement>("link"));
    expect(links).toHaveLength(3);
    expect(links.every((link) => link.href.endsWith("/tenant-b.png"))).toBe(true);
  });

  it("updates duplicate metadata links and cache-busts a saved tenant icon", () => {
    document.head.innerHTML =
      '<link rel="icon" href="/old.ico"><link rel="icon" href="/older.ico">';

    updateDocumentFavicons(
      document,
      "https://cdn.example.com/tenant.png?size=32",
      "/favicon.ico",
      "brand-v2",
    );

    const icons = Array.from(
      document.head.querySelectorAll<HTMLLinkElement>("link[rel='icon']"),
    );
    expect(icons).toHaveLength(2);
    expect(icons.every((icon) => icon.href.includes("v=brand-v2"))).toBe(true);
    expect(addFaviconVersion("/tenant.ico", "42")).toBe("/tenant.ico?v=42");
  });

  it("reads the nested domain branding favicon contract", () => {
    expect(
      getBrandingFaviconUrl({
        assets: { logos: { faviconUrl: "https://cdn.example.com/domain.ico" } },
      }),
    ).toBe("https://cdn.example.com/domain.ico");
  });

  it("falls back when the configured favicon fails to load", () => {
    updateDocumentFavicons(document, "https://cdn.example.com/broken.png");
    const icon = document.head.querySelector<HTMLLinkElement>("link[rel='icon']");

    icon?.onerror?.(new Event("error"));

    expect(icon?.href).toContain("/favicon.ico");
  });
});
