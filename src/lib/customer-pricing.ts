import type { OrderPricingBreakdownLine } from "@/services/orders";

export const isTaxBreakdownLine = (line: OrderPricingBreakdownLine) => {
  const key = String(line.key || line.label || "")
    .toLowerCase()
    .replace(/[\s_-]/g, "");

  return key === "tax" || key === "taxes" || key === "taxamount" || key.includes("tax");
};
