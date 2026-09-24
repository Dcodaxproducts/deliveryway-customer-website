import { describe, expect, it } from "vitest";

import {
  MOBILE_NAVBAR_MEDIA_QUERY,
  resolveNavbarVisibility,
  resolveResponsiveNavbarVisibility,
} from "@/lib/navbar-scroll";

describe("resolveNavbarVisibility", () => {
  it("keeps the navbar visible near the top of the page", () => {
    expect(
      resolveNavbarVisibility({
        currentScrollY: 20,
        lastScrollY: 120,
        currentVisible: false,
        hasOpenOverlay: false,
      }),
    ).toBe(true);
  });

  it("hides the navbar after meaningful downward scrolling", () => {
    expect(
      resolveNavbarVisibility({
        currentScrollY: 140,
        lastScrollY: 120,
        currentVisible: true,
        hasOpenOverlay: false,
      }),
    ).toBe(false);
  });

  it("reveals the navbar after meaningful upward scrolling", () => {
    expect(
      resolveNavbarVisibility({
        currentScrollY: 100,
        lastScrollY: 120,
        currentVisible: false,
        hasOpenOverlay: false,
      }),
    ).toBe(true);
  });

  it("keeps the current state for small scroll movements", () => {
    expect(
      resolveNavbarVisibility({
        currentScrollY: 122,
        lastScrollY: 120,
        currentVisible: true,
        hasOpenOverlay: false,
      }),
    ).toBe(true);
  });

  it("keeps the navbar visible while an overlay is open", () => {
    expect(
      resolveNavbarVisibility({
        currentScrollY: 240,
        lastScrollY: 120,
        currentVisible: false,
        hasOpenOverlay: true,
      }),
    ).toBe(true);
  });
});


describe("resolveResponsiveNavbarVisibility", () => {
  it.each([360, 390, 767])("keeps mobile navbar visible at %ipx", (width) => {
    expect(width).toBeLessThanOrEqual(767);
    expect(resolveResponsiveNavbarVisibility({ isMobileViewport: true, currentScrollY: 600, lastScrollY: 100, currentVisible: false, hasOpenOverlay: false })).toBe(true);
  });

  it.each([768, 1024, 1440])("preserves scroll hiding at %ipx", (width) => {
    expect(width).toBeGreaterThan(767);
    expect(resolveResponsiveNavbarVisibility({ isMobileViewport: false, currentScrollY: 600, lastScrollY: 100, currentVisible: true, hasOpenOverlay: false })).toBe(false);
  });

  it("uses the CSS mobile breakpoint in matchMedia", () => {
    expect(MOBILE_NAVBAR_MEDIA_QUERY).toBe("(max-width: 767px)");
  });
});
