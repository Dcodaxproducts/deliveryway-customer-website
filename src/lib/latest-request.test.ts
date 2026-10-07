import { describe, expect, it } from "vitest";

import { createLatestRequestCoordinator } from "./latest-request";

describe("createLatestRequestCoordinator", () => {
  it("aborts the overlapping request and accepts only the latest response", () => {
    const coordinator = createLatestRequestCoordinator();
    const first = coordinator.start();
    const second = coordinator.start();

    expect(first.signal.aborted).toBe(true);
    expect(coordinator.isCurrent(first)).toBe(false);
    expect(second.signal.aborted).toBe(false);
    expect(coordinator.isCurrent(second)).toBe(true);
  });

  it("invalidates the active request during unmount cleanup", () => {
    const coordinator = createLatestRequestCoordinator();
    const request = coordinator.start();

    coordinator.cancel();

    expect(request.signal.aborted).toBe(true);
    expect(coordinator.isCurrent(request)).toBe(false);
  });
});
