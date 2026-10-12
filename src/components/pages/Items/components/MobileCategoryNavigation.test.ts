import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.join(__dirname, "MobileCategoryNavigation.tsx"),
  "utf8",
);

describe("MobileCategoryNavigation sticky positioning", () => {
  it("stays below the measured storefront navbar while the menu scrolls", () => {
    expect(source).toContain(
      "sticky top-[var(--storefront-sticky-offset)] z-30",
    );
    expect(source).not.toContain('className="sticky top-0 z-30');
  });
});
