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
const resilientImageSource = readFileSync(
  new URL("../../../common/ResilientImage.tsx", import.meta.url),
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
const storefrontSectionSource = readFileSync(
  new URL("./StorefrontSection.tsx", import.meta.url),
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
    expect(homeSource).toContain("storefront-category-tile");
    expect(homeSource).toContain(
      "h-16 w-16 shrink-0 overflow-hidden rounded-full",
    );
    expect(homeSource).toContain('sizes="64px"');
    expect(homeSource).toContain('alt=""');
    expect(homeSource).toContain("line-clamp-2 text-center");
    expect(homeSource).not.toContain("storefront-category-chip");
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

  it("shows one primary mobile card with a peek and bounds sparse desktop cuisine rows", () => {
    expect(cssSource).toContain("flex: 0 0 calc(100% - 2.75rem)");
    expect(cuisineSource.match(/<div className="md:hidden">/g)).toHaveLength(2);
    expect(cuisineSource).not.toContain(
      '<MobileStorefrontRail className="md:hidden"',
    );
    expect(cuisineSource).toContain(
      'className="hidden grid-cols-[repeat(auto-fill,minmax(16rem,20rem))] gap-5 pb-8 md:grid"',
    );
    expect(cuisineSource).not.toContain("<Carousel");
  });

  it("disables smooth scrolling when the visitor prefers reduced motion", () => {
    expect(cssSource).toContain("@media (prefers-reduced-motion: reduce)");
    expect(cssSource).toContain("html { scroll-behavior: auto; }");
  });

  it("uses one shared page-width and heading contract for promotions, deals, and cuisines", () => {
    expect(storefrontSectionSource).toContain(
      "mx-auto w-full max-w-[1400px] px-4 py-10 sm:px-6 sm:py-14",
    );
    expect(storefrontSectionSource).toContain(
      "mb-6 flex items-end justify-between gap-4",
    );
    expect(promotionSource).toContain("<StorefrontSection");
    expect(customerDealsSource).toContain("<StorefrontSection");
    expect(cuisineSource).toContain("<StorefrontSection");
    expect(promotionSource).not.toContain("-mx-4 px-4");
    expect(customerDealsSource).not.toContain("-mx-4 px-4");
    expect(customerDealsSource).not.toContain("rounded-[36px]");
    expect(customerDealsSource).not.toContain("bg-[linear-gradient(108deg");
    expect(promotionSource).toContain(
      "mx-auto max-w-[1400px] px-4 pb-[34px] pt-[42px]",
    );
    expect(customerDealsSource).toContain(
      "mx-auto max-w-[1400px] px-4 pb-[30px] pt-[30px]",
    );
    expect(customerDealsSource).toContain(
      "text-2xl font-extrabold text-gray-950",
    );
  });

  it("matches compact promotional card proportions to the cuisine card language", () => {
    expect(promotionSource).toContain(
      "h-[340px] w-full min-w-0 shrink-0 flex-col overflow-hidden rounded-[26px] border border-gray-100 bg-white",
    );
    expect(promotionSource).toContain("relative h-44 shrink-0 bg-primary/5");
    expect(promotionSource).toContain(
      "border-t border-dashed border-gray-100 pt-4",
    );
  });

  it("replaces failed promotional item images with the canonical deal fallback", () => {
    expect(promotionSource).toContain(
      'import { ResilientImage } from "@/components/common/ResilientImage"',
    );
    expect(promotionSource).toContain("<ResilientImage");
    expect(promotionSource).toContain('fallback="deal"');
    expect(promotionSource).not.toContain('import Image from "next/image"');
    expect(resilientImageSource).toContain("onError: () =>");
    expect(resilientImageSource).toContain("setFailed(true)");
  });

  it("keeps the deal sheet viewport bounded with internal scrolling", () => {
    expect(dealSource).toContain("h-[min(94dvh,860px)]");
    expect(dealSource).toContain("grid-rows-[auto_minmax(0,1fr)_auto]");
    expect(dealSource).toContain("overflow-y-auto overscroll-contain");
    expect(dealSource).toContain("env(safe-area-inset-bottom)");
  });
});
