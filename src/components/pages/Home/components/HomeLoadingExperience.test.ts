import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

const homeSource = read("../HomePage.tsx");
const heroSource = read("./heroSection.tsx");
const categoriesSource = read("./foodCategorySection.tsx");
const mobileSource = read("./MobileHomeExperience.tsx");
const imageSource = read("../../../common/ResilientImage.tsx");
const cssSource = read("../../../../app/globals.css");
const nextConfigSource = read("../../../../../next.config.ts");

describe("home loading experience contract", () => {
  it("reserves the final hero and category geometry while restaurant data loads", () => {
    expect(homeSource).toContain("lg:min-h-[660px]");
    expect(homeSource).toContain("-mt-15");
    expect(homeSource).toContain("h-[81px] w-[81px]");
    expect(homeSource).toContain('aria-busy="true"');
    expect(homeSource).toContain('role="status"');
  });

  it("distinguishes category loading, error, empty, and loaded states", () => {
    expect(categoriesSource).toContain("categoriesQuery.isLoading");
    expect(categoriesSource).toContain("categoriesQuery.isError");
    expect(categoriesSource).toContain("categories.length === 0");
    expect(categoriesSource).toContain("categoriesQuery.refetch()");
    expect(mobileSource).toContain("categoriesLoading ?");
    expect(mobileSource).toContain("categoriesError ?");
    expect(mobileSource).toContain("visibleCategories.length > 0 ?");
    expect(mobileSource).toContain('t("categoriesEmpty")');
  });

  it("prioritizes only the LCP hero and sizes responsive images", () => {
    expect(heroSource).toContain('sizes="100vw"');
    expect(heroSource).toContain("priority");
    expect(categoriesSource).toContain('sizes="81px"');
    expect(categoriesSource).not.toMatch(/sizes="81px"[\s\S]{0,120}priority/);
    expect(imageSource).toContain(
      "unoptimized: isTimeLimitedImageUrl(normalizedSource)",
    );
    expect(imageSource).not.toContain("unoptimized: true");
    expect(nextConfigSource).not.toContain("unoptimized: true");
    expect(nextConfigSource).toContain("remotePatterns");
    expect(nextConfigSource).toContain("qualities: [75, 78, 82]");
  });

  it("disables shimmer and crossfade motion when reduced motion is requested", () => {
    expect(cssSource).toContain("@media (prefers-reduced-motion: reduce)");
    expect(cssSource).toContain(".loading-skeleton::after { animation: none; }");
    expect(imageSource).toContain("motion-reduce:transition-none");
  });
});
