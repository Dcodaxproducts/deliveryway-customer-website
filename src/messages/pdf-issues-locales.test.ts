import { describe, expect, it } from "vitest";

import en from "@/messages/en.json";
import de from "@/messages/de.json";

const requiredKeys = [
  "eyebrow",
  "title",
  "description",
  "availablePoints",
  "earnedPoints",
  "viewProgram",
  "useAtCheckout",
] as const;

describe("PDF issue locale coverage", () => {
  it("has complete EN/DE loyalty and legal representative copy", () => {
    for (const key of requiredKeys) {
      expect(en.home.loyalty[key]).toBeTruthy();
      expect(de.home.loyalty[key]).toBeTruthy();
    }

    expect(en.legal.impressum.representativeName).toBeTruthy();
    expect(de.legal.impressum.representativeName).toBeTruthy();
    expect(en.cuisines.itemsLoadError).toBeTruthy();
    expect(de.cuisines.itemsLoadError).toBeTruthy();
  });
});
