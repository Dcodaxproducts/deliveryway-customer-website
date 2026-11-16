// @vitest-environment jsdom

import { afterEach, describe, expect, it } from "vitest";

import {
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

  it("falls back when the configured favicon fails to load", () => {
    updateDocumentFavicons(document, "https://cdn.example.com/broken.png");
    const icon = document.head.querySelector<HTMLLinkElement>("link[rel='icon']");

    icon?.onerror?.(new Event("error"));

    expect(icon?.href).toContain("/favicon.ico");
  });
});
