import { describe, expect, it } from "vitest";

import {
  isReliableGeolocationAccuracy,
  MAX_RELIABLE_GEOLOCATION_ACCURACY_METERS,
} from "@/lib/geolocation";

describe("isReliableGeolocationAccuracy", () => {
  it("accepts positions accurate enough for local delivery selection", () => {
    expect(isReliableGeolocationAccuracy(25)).toBe(true);
    expect(
      isReliableGeolocationAccuracy(MAX_RELIABLE_GEOLOCATION_ACCURACY_METERS)
    ).toBe(true);
  });

  it("rejects approximate, missing, and invalid positions", () => {
    expect(
      isReliableGeolocationAccuracy(
        MAX_RELIABLE_GEOLOCATION_ACCURACY_METERS + 1
      )
    ).toBe(false);
    expect(isReliableGeolocationAccuracy(undefined)).toBe(false);
    expect(isReliableGeolocationAccuracy(Number.NaN)).toBe(false);
  });
});
