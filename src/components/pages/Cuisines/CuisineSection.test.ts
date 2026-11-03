import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.join(__dirname, "CuisineSection.tsx"), "utf8");

describe("CuisineSection desktop layout", () => {
  it("uses a balanced responsive grid instead of an oversized clipped carousel", () => {
    expect(source).toContain(
      "hidden grid-cols-2 gap-5 pb-8 md:grid lg:grid-cols-3 2xl:grid-cols-4",
    );
    expect(source).not.toContain("basis-[86%]");
    expect(source).not.toContain("cursor-grab");
  });
});
