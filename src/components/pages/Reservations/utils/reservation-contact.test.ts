import { describe, expect, it } from "vitest";

import type { AuthUser } from "@/types/auth";
import { getReservationContactPrefill } from "./reservation-contact";

const createUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: "customer-1",
  email: "customer@example.com",
  role: "CUSTOMER",
  tenantId: "tenant-1",
  profile: {
    firstName: "Ada",
    lastName: "Lovelace",
    avatarUrl: "",
    phone: "+49 151 23456789",
  },
  ...overrides,
});

const emptyContact = {
  guestName: "",
  guestEmail: "",
  guestPhone: "",
};

describe("reservation contact prefill", () => {
  it("keeps contact fields empty without a session", () => {
    expect(getReservationContactPrefill(null)).toEqual(emptyContact);
  });

  it("does not expose legacy synthetic values from a guest session", () => {
    expect(
      getReservationContactPrefill(
        createUser({
          email:
            "guest+restaurant-1+1770000000000-deadbeef@guest.deliveryways.local",
          isGuest: true,
          profile: {
            firstName: "Guest",
            lastName: "Customer",
            avatarUrl: "",
          },
        }),
      ),
    ).toEqual(emptyContact);
  });

  it("prefills a real authenticated customer profile", () => {
    expect(getReservationContactPrefill(createUser())).toEqual({
      guestName: "Ada Lovelace",
      guestEmail: "customer@example.com",
      guestPhone: "+49 151 23456789",
    });
  });

  it("preserves genuine plus-addressed customer emails", () => {
    expect(
      getReservationContactPrefill(
        createUser({ email: "ada+reservations@example.com" }),
      ),
    ).toEqual({
      guestName: "Ada Lovelace",
      guestEmail: "ada+reservations@example.com",
      guestPhone: "+49 151 23456789",
    });
  });

  it("rejects the exact legacy email marker even if an old session lacks guest flags", () => {
    expect(
      getReservationContactPrefill(
        createUser({
          email: "guest+opaque-id@guest.deliveryways.local",
          profile: {
            firstName: "Guest",
            lastName: "Customer",
            avatarUrl: "",
            phone: "+49 151 23456789",
          },
        }),
      ),
    ).toEqual(emptyContact);
  });
});
