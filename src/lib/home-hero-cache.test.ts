import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  readCachedHomeHeroImage,
  writeCachedHomeHeroImage,
} from "./home-hero-cache";

class StorageMock {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }
}

describe("home hero cache", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { localStorage: new StorageMock() });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("restores a recently cached restaurant banner", () => {
    writeCachedHomeHeroImage(
      "restaurant-1",
      "https://cdn.example.com/hero.webp",
      1_000,
    );

    expect(readCachedHomeHeroImage("restaurant-1", 2_000)).toBe(
      "https://cdn.example.com/hero.webp",
    );
  });

  it("removes expired banner entries", () => {
    writeCachedHomeHeroImage(
      "restaurant-1",
      "https://cdn.example.com/hero.webp",
      1_000,
    );

    expect(
      readCachedHomeHeroImage("restaurant-1", 24 * 60 * 60 * 1000 + 1_001),
    ).toBeNull();
  });

  it("ignores unsafe image protocols", () => {
    writeCachedHomeHeroImage("restaurant-1", "javascript:alert(1)", 1_000);

    expect(readCachedHomeHeroImage("restaurant-1", 2_000)).toBeNull();
  });
});
