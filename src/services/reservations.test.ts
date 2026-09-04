import { describe, expect, it } from "vitest";

import {
  getReservationStatusLabel,
  getReservationStatusLabelKey,
  normalizeReservationBranches,
  normalizeReservationResponse,
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
