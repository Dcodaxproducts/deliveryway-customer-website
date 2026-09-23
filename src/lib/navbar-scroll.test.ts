import { describe, expect, it } from "vitest";

import { resolveNavbarVisibility } from "@/lib/navbar-scroll";

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
