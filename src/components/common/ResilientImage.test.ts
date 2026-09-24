import { describe, expect, it } from "vitest";

import { shouldRenderImage } from "@/components/common/ResilientImage";

describe("shouldRenderImage", () => {
  it.each([undefined, null, "", "   "])("uses the fallback for missing source %s", (src) => {
    expect(shouldRenderImage(src, false)).toBe(false);
  });

  it("removes a failed image so the browser cannot show a broken icon or alt text", () => {
    expect(shouldRenderImage("https://tenant.invalid/broken.jpg", true)).toBe(false);
  });

  it("renders a valid source until the browser reports failure", () => {
    expect(shouldRenderImage("/hero.png", false)).toBe(true);
  });
});
