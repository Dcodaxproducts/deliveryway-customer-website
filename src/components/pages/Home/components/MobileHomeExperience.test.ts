import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("./MobileHomeExperience.tsx", import.meta.url), "utf8");
const promotionSource = readFileSync(new URL("./PromotionalItemsSection.tsx", import.meta.url), "utf8");
const dealSource = readFileSync(new URL("./deals/DealChooserDrawer.tsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../../../../app/globals.css", import.meta.url), "utf8");

describe("mobile storefront layout contract", () => {
  it("stacks sticky controls below the measured navbar", () => {
    expect(homeSource).toContain('top: "var(--storefront-sticky-offset, 64px)"');
    expect(homeSource).toContain("storefront-rail mt-2");
  });

  it("uses a shared snap rail with a visible scrollbar affordance", () => {
    expect(cssSource).toContain("scroll-snap-type: inline mandatory");
    expect(cssSource).toContain("scrollbar-width: thin");
    expect(cssSource).toContain(".storefront-rail::-webkit-scrollbar-thumb");
    expect(promotionSource).toContain('className="storefront-rail');
  });

  it("keeps the deal sheet viewport bounded with internal scrolling", () => {
    expect(dealSource).toContain("h-[min(94dvh,860px)]");
    expect(dealSource).toContain("grid-rows-[auto_minmax(0,1fr)_auto]");
    expect(dealSource).toContain("overflow-y-auto overscroll-contain");
    expect(dealSource).toContain("env(safe-area-inset-bottom)");
  });
});
