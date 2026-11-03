import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.join(__dirname, "CuisineSection.tsx"), "utf8");
const cardSource = fs.readFileSync(
  path.join(__dirname, "components/CuisineCard.tsx"),
  "utf8",
);
const cssSource = fs.readFileSync(
  path.join(__dirname, "../../../app/globals.css"),
  "utf8",
);

describe("CuisineSection desktop layout", () => {
  it("uses a balanced responsive grid instead of an oversized clipped carousel", () => {
    expect(source).toContain(
      "hidden grid-cols-2 gap-5 pb-8 md:grid lg:grid-cols-3 2xl:grid-cols-4",
    );
    expect(source).not.toContain("basis-[86%]");
    expect(source).not.toContain("cursor-grab");
  });

  it("switches the canonical mobile rail off before the desktop grid appears", () => {
    expect(cssSource).toMatch(
      /@media \(min-width: 48rem\) \{\s*\.storefront-rail \{\s*display: none;/,
    );
    expect(source).not.toContain('className="md:hidden"');
  });

  it("keeps cards bounded and accessible for short, long, and variable result sets", () => {
    expect(source).toContain('className="flex min-w-0"');
    expect(cardSource).toContain("h-full w-full min-w-0");
    expect(cardSource).toContain("line-clamp-1");
    expect(cardSource).toContain("line-clamp-2");
    expect(cardSource).toContain("focus-visible:ring-2");
    expect(cardSource).toContain("motion-reduce:transform-none");
  });
});
