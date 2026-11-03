import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getReservationStatusLabel,
  getReservationStatusLabelKey,
  normalizeReservationBranches,
  normalizeReservationResponse,
  fetchReservationBranch,
  fetchReservationBranches,
  selectDefaultReservationBranch,
} from "./reservations";
import type { ApiResult } from "./http";

describe("reservation service helpers", () => {
  it("maps confirmed reservation response status", () => {
    const reservation = normalizeReservationResponse({
      data: {
        id: "reservation-1",
        reservationDate: "2026-06-10T19:30:00.000Z",
        guestCount: 4,
        status: "CONFIRMED",
      },
    } as ApiResult);

    expect(reservation?.status).toBe("CONFIRMED");
    expect(getReservationStatusLabelKey(reservation?.status)).toBe("confirmed");
    expect(getReservationStatusLabel(reservation?.status)).toBe("Confirmed");
  });

  it("maps requested reservation response status", () => {
    const reservation = normalizeReservationResponse({
      data: {
        data: {
          id: "reservation-2",
          reservationDate: "2026-06-10T19:30:00.000Z",
          guestCount: 4,
          status: "REQUESTED",
        },
      },
    } as ApiResult);

    expect(reservation?.status).toBe("REQUESTED");
    expect(getReservationStatusLabelKey(reservation?.status)).toBe("requested");
    expect(getReservationStatusLabel(reservation?.status)).toBe("Requested");
  });

  it("selects the active main branch for a new reservation", () => {
    const branches = normalizeReservationBranches({
      data: [
        { id: "branch-1", name: "West", isMain: false, isActive: true },
        { id: "branch-2", name: "Main", isMain: true, isActive: true },
      ],
    } as ApiResult);

    expect(selectDefaultReservationBranch(branches)?.id).toBe("branch-2");
  });
});

const getRequestMock = vi.hoisted(() => vi.fn());

vi.mock("@/services/http", () => ({
  getRequest: getRequestMock,
  postRequest: vi.fn(),
  patchRequest: vi.fn(),
  deleteRequest: vi.fn(),
}));

describe("reservation branch hydration", () => {
  beforeEach(() => {
    getRequestMock.mockReset();
    getRequestMock.mockResolvedValue({ data: [] });
  });

  it("uses only the public customer-app branch endpoint anonymously", async () => {
    await fetchReservationBranches({
      restaurantId: "restaurant 1",
      search: "Main",
    });
    await fetchReservationBranch({
      branchId: "branch-1",
      restaurantId: "restaurant 1",
    });
    expect(getRequestMock).toHaveBeenNthCalledWith(
      1,
      "/v1/customer-app/branches?restaurantId=restaurant%201&search=Main&page=1",
      undefined,
      undefined,
    );
    expect(getRequestMock).toHaveBeenNthCalledWith(
      2,
      "/v1/customer-app/branches?restaurantId=restaurant%201",
      undefined,
      undefined,
    );
    expect(getRequestMock.mock.calls.flat().join(" ")).not.toContain(
      "/v1/branches",
    );
  });

  it("preserves protected branch endpoints for authenticated callers", async () => {
    await fetchReservationBranches({
      restaurantId: "restaurant-1",
      token: "token",
    });
    await fetchReservationBranch({ branchId: "branch-1", token: "token" });
    expect(getRequestMock).toHaveBeenNthCalledWith(
      1,
      "/v1/branches?restaurantId=restaurant-1&search=&page=1",
      "token",
      undefined,
    );
    expect(getRequestMock).toHaveBeenNthCalledWith(
      2,
      "/v1/branches/branch-1",
      "token",
      undefined,
    );
  });
});
