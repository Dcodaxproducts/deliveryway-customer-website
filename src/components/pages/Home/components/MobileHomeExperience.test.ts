import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(
  new URL("./MobileHomeExperience.tsx", import.meta.url),
  "utf8",
);
const promotionSource = readFileSync(
  new URL("./PromotionalItemsSection.tsx", import.meta.url),
  "utf8",
);
const customerDealsSource = readFileSync(
  new URL("./CustomerDealsSection.tsx", import.meta.url),
  "utf8",
);
const mobileRailSource = readFileSync(
  new URL("./MobileStorefrontRail.tsx", import.meta.url),
  "utf8",
);
const cuisineSource = readFileSync(
  new URL("../../Cuisines/CuisineSection.tsx", import.meta.url),
  "utf8",
);
const dealSource = readFileSync(
  new URL("./deals/DealChooserDrawer.tsx", import.meta.url),
  "utf8",
);
const cssSource = readFileSync(
  new URL("../../../../app/globals.css", import.meta.url),
  "utf8",
);

describe("mobile storefront layout contract", () => {
  it("keeps only search and order controls sticky below the measured navbar", () => {
    expect(homeSource).toContain(
      'top: "var(--storefront-sticky-offset, 64px)"',
    );

    const stickySectionEnd = homeSource.indexOf(
      "</section>",
      homeSource.indexOf("sticky z-40"),
    );
    const categoriesRail = homeSource.indexOf('variant="categories"');

    expect(categoriesRail).toBeGreaterThan(stickySectionEnd);
    expect(homeSource.slice(0, stickySectionEnd)).not.toContain(
      'variant="categories"',
    );
    expect(homeSource).toContain("storefront-category-chip");
    expect(homeSource).toContain("rounded-full bg-primary/10");
  });

  it("uses the canonical snap rail for mobile categories, promotions, deals, and cuisines", () => {
    expect(mobileRailSource).toContain("data-storefront-rail={variant}");
    expect(homeSource).toContain("<MobileStorefrontRail");
    expect(promotionSource).toContain("<MobileStorefrontRail");
    expect(customerDealsSource).toContain("<MobileStorefrontRail");
    expect(cuisineSource).toContain("<MobileStorefrontRail");
    expect(cssSource).toContain("scroll-snap-type: inline mandatory");
    expect(cssSource).toContain("scrollbar-width: thin");
    expect(cssSource).toContain(".storefront-rail::-webkit-scrollbar-thumb");
  });

  it("shows one primary mobile card with a peek and preserves the desktop cuisine carousel", () => {
    expect(cssSource).toContain("flex: 0 0 calc(100% - 2.75rem)");
    expect(cuisineSource).toContain('className="hidden min-w-0 md:block"');
  });

  it("adds breathing room around promotions and removes the deals outer card", () => {
    expect(promotionSource).toContain('className="my-12 min-w-0"');
    expect(customerDealsSource).not.toContain("rounded-[36px]");
    expect(customerDealsSource).not.toContain("bg-[linear-gradient(108deg");
  });

  it("keeps the deal sheet viewport bounded with internal scrolling", () => {
    expect(dealSource).toContain("h-[min(94dvh,860px)]");
    expect(dealSource).toContain("grid-rows-[auto_minmax(0,1fr)_auto]");
    expect(dealSource).toContain("overflow-y-auto overscroll-contain");
    expect(dealSource).toContain("env(safe-area-inset-bottom)");
  });
});
