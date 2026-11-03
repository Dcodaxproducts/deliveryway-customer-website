import { isCustomerAccountUser } from "@/lib/auth";
import type { AuthUser } from "@/types/auth";

export type ReservationContactPrefill = {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
};

const EMPTY_RESERVATION_CONTACT: ReservationContactPrefill = {
  guestName: "",
  guestEmail: "",
  guestPhone: "",
};

// Legacy guest registration generates exactly guest+<opaque-id>@guest.deliveryways.local.
// Keep this narrow so legitimate plus-addressed customer emails remain eligible for prefill.
const LEGACY_SYNTHETIC_GUEST_EMAIL =
  /^guest\+[^@\s]+@guest\.deliveryways\.local$/i;

const getString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

export const getReservationContactPrefill = (
  user: AuthUser | null,
): ReservationContactPrefill => {
  if (
    !isCustomerAccountUser(user) ||
    LEGACY_SYNTHETIC_GUEST_EMAIL.test(getString(user?.email))
  ) {
    return EMPTY_RESERVATION_CONTACT;
  }

  return {
    guestName: [user?.profile?.firstName, user?.profile?.lastName]
      .map(getString)
      .filter(Boolean)
      .join(" "),
    guestEmail: getString(user?.email),
    guestPhone: getString(user?.profile?.phone),
  };
};
