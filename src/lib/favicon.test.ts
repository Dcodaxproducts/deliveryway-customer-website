// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";

import {
  addFaviconVersion,
  getBrandingFaviconUrl,
  maintainDocumentFavicons,
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

  it("does not invalidate signed favicon URLs while adding cache versions", () => {
    const signed =
      "https://media.example.com/favicon.webp?X-Amz-Credential=credential&X-Amz-Signature=signature";

    expect(addFaviconVersion(signed, "brand-v2")).toBe(signed);
  });

  it("reads the nested domain branding favicon contract", () => {
    expect(
      getBrandingFaviconUrl({
        assets: { logos: { faviconUrl: "https://cdn.example.com/domain.ico" } },
      }),
    ).toBe("https://cdn.example.com/domain.ico");
    expect(
      getBrandingFaviconUrl({
        assets: {
          faviconUrl: "",
          logos: { faviconUrl: "https://cdn.example.com/legacy.ico" },
        },
      }),
    ).toBe("https://cdn.example.com/legacy.ico");
  });

  it("reapplies the tenant favicon after client navigation replaces metadata", async () => {
    const signed =
      "https://media.example.com/favicon.webp?X-Amz-Credential=credential&X-Amz-Signature=signature";
    const stop = maintainDocumentFavicons(document, signed, "/favicon.ico", "v2");

    document.head.innerHTML = '<link rel="icon" href="/favicon.ico">';
    await Promise.resolve();
    await Promise.resolve();

    const links = Array.from(
      document.head.querySelectorAll<HTMLLinkElement>("link[rel='icon']"),
    );
    expect(links).toHaveLength(1);
    expect(links[0].href).toBe(signed);
    expect(links[0].href).not.toContain("v=v2");
    stop();
  });

  it("keeps the static fallback absent until a tenant favicon fails", async () => {
    const stop = maintainDocumentFavicons(
      document,
      "https://cdn.example.com/tenant.ico",
      "/favicon.ico",
    );
    const icon = document.head.querySelector<HTMLLinkElement>("link[rel='icon']");

    expect(icon?.href).not.toContain("/favicon.ico");
    icon?.onerror?.(new Event("error"));
    await Promise.resolve();
    expect(icon?.href).toContain("/favicon.ico");
    stop();
  });

  it("falls back when the configured favicon fails to load", () => {
    updateDocumentFavicons(document, "https://cdn.example.com/broken.png");
    const icon = document.head.querySelector<HTMLLinkElement>("link[rel='icon']");

    icon?.onerror?.(new Event("error"));

    expect(icon?.href).toContain("/favicon.ico");
  });
});
