import { describe, expect, it } from "vitest";

import { parseAddressDetails } from "@/components/common/branch-selector/AddressLocationPicker";
import type { GoogleAddressComponent } from "@/types/google-maps";

const component = (
  longName: string,
  types: string[],
  shortName = longName
): GoogleAddressComponent => ({
  long_name: longName,
  short_name: shortName,
  types,
});

describe("parseAddressDetails", () => {
  it("separates Google street number from route", () => {
    const details = parseAddressDetails([
      component("7-9", ["street_number"]),
      component("Katernberger Straße", ["route"], "Katernberger Str."),
      component("45327", ["postal_code"]),
      component("Essen", ["locality"]),
      component("Nordrhein-Westfalen", ["administrative_area_level_1"], "NRW"),
      component("Deutschland", ["country"], "DE"),
    ]);

    expect(details.street).toBe("Katernberger Straße");
    expect(details.houseNumber).toBe("7-9");
    expect(details.postalCode).toBe("45327");
    expect(details.city).toBe("Essen");
    expect(details.state).toBe("Nordrhein-Westfalen");
    expect(details.country).toBe("Deutschland");
  });

  it("strips the house number from fallback labels when route is missing", () => {
    const details = parseAddressDetails(
      [component("40", ["street_number"])],
      "Example Street 40, 10000 City"
    );

    expect(details.street).toBe("Example Street");
    expect(details.houseNumber).toBe("40");
  });
});
