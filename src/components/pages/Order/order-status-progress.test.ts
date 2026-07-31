import { describe, expect, it } from "vitest";

import {
  getOrderProgressStep,
  getOrderProgressStepKeys,
  getTerminalOrderState,
} from "@/components/pages/Order/order-status-progress";

describe("order status progress", () => {
  it("maps delivery out for delivery to the fourth achieved step", () => {
    expect(getOrderProgressStep("OUT_FOR_DELIVERY", "DELIVERY")).toBe(4);
    expect(getOrderProgressStepKeys("DELIVERY")).toEqual([
      "placed",
      "confirmed",
      "preparing",
      "outForDelivery",
      "delivered",
    ]);
  });

  it("keeps pickup and takeaway progress separate from delivery", () => {
    expect(getOrderProgressStep("READY_FOR_PICKUP", "TAKEAWAY")).toBe(4);
    expect(getOrderProgressStep("PICKED_UP", "TAKEAWAY")).toBe(5);
    expect(getOrderProgressStepKeys("TAKEAWAY")).toEqual([
      "placed",
      "confirmed",
      "preparing",
      "readyForPickup",
      "pickedUp",
    ]);
  });

  it("handles delivered/completed terminal statuses", () => {
    expect(getOrderProgressStep("DELIVERED", "DELIVERY")).toBe(5);
    expect(getOrderProgressStep("COMPLETED", "PICKUP")).toBe(5);
  });

  it("keeps rejection and cancellation out of delivered progress", () => {
    expect(getTerminalOrderState("REJECTED")).toBe("rejected");
    expect(getTerminalOrderState("CANCELLED")).toBe("cancelled");
    expect(getTerminalOrderState("DELIVERED")).toBeNull();
    expect(getOrderProgressStep("REJECTED", "DELIVERY")).toBe(1);
  });
});
