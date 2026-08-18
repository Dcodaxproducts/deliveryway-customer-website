import { describe, expect, it } from "vitest";
import { isTaxBreakdownLine } from "@/lib/customer-pricing";

describe("customer pricing visibility", () => {
  it.each(["tax", "taxes", "tax_amount", "VAT tax"])(
    "hides the %s breakdown row",
    (key) => {
      expect(isTaxBreakdownLine({ key, label: key, amount: "1.90" })).toBe(true);
    },
  );

  it("keeps non-tax rows visible", () => {
    expect(
      isTaxBreakdownLine({ key: "serviceCharge", label: "Service charge", amount: "1.90" }),
    ).toBe(false);
  });
});
