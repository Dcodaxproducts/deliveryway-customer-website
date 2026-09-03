import type { AuthUser } from "@/types/auth";

export type GuestContactValues = {
  name: string;
  phone: string;
  email: string;
};

export type GuestContactErrors = Partial<
  Record<keyof GuestContactValues, "required" | "invalid">
>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+()\d\s./-]+$/;
const GENERATED_GUEST_EMAIL_PATTERN = /@guest\.deliveryways?(?:\.local)?$/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const getString = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const normalizeGuestName = (value: string) => {
  const name = value.trim();
  const normalized = name.toLowerCase();

  return normalized === "guest" || normalized === "guest customer" ? "" : name;
};

const normalizeGuestEmail = (value: string) => {
  const email = value.trim();

  return GENERATED_GUEST_EMAIL_PATTERN.test(email) ? "" : email;
};

export const getSavedGuestContact = (
  user: AuthUser | null,
): GuestContactValues => {
  const metadata = isRecord(user?.profile?.metadata)
    ? user.profile.metadata
    : {};
  const guestContact = isRecord(metadata.guestContact)
    ? metadata.guestContact
    : {};
  const profileName = [user?.profile?.firstName, user?.profile?.lastName]
    .map(getString)
    .filter(Boolean)
    .join(" ");

  return {
    name: normalizeGuestName(profileName),
    phone: getString(guestContact.phone) || getString(user?.profile?.phone),
    email:
      normalizeGuestEmail(getString(guestContact.email)) ||
      normalizeGuestEmail(getString(user?.email)),
  };
};

export const mergeSavedGuestContact = (
  current: GuestContactValues,
  saved: GuestContactValues,
): GuestContactValues => ({
  name: normalizeGuestName(current.name) || saved.name,
  phone: current.phone.trim() || saved.phone,
  email: normalizeGuestEmail(current.email) || saved.email,
});

export const saveGuestContactOnUser = (
  user: AuthUser,
  contact: GuestContactValues,
): AuthUser => {
  const metadata = isRecord(user.profile?.metadata)
    ? user.profile.metadata
    : {};
  const existingGuestContact = isRecord(metadata.guestContact)
    ? metadata.guestContact
    : {};
  const name = contact.name.trim();
  const phone = contact.phone.trim();
  const email = contact.email.trim().toLowerCase();

  return {
    ...user,
    profile: {
      ...user.profile,
      firstName: name,
      lastName: "",
      avatarUrl: user.profile?.avatarUrl ?? "",
      phone,
      metadata: {
        ...metadata,
        guestContact: {
          ...existingGuestContact,
          email,
          phone,
        },
      },
    },
  };
};

export const getGuestContactErrors = (
  customer: GuestContactValues,
): GuestContactErrors => {
  const name = customer.name.trim();
  const email = customer.email.trim();
  const phone = customer.phone.trim();
  const phoneDigits = phone.replace(/\D/g, "");
  const errors: GuestContactErrors = {};

  if (!name) errors.name = "required";
  else if (name.length < 2 || !/\p{L}/u.test(name)) errors.name = "invalid";

  if (!phone) errors.phone = "required";
  else if (
    !PHONE_PATTERN.test(phone) ||
    phoneDigits.length < 7 ||
    phoneDigits.length > 15
  ) {
    errors.phone = "invalid";
  }

  if (!email) errors.email = "required";
  else if (
    !EMAIL_PATTERN.test(email) ||
    GENERATED_GUEST_EMAIL_PATTERN.test(email)
  ) {
    errors.email = "invalid";
  }

  return errors;
};

export const hasGuestContact = (customer: GuestContactValues) =>
  Object.keys(getGuestContactErrors(customer)).length === 0;

export const getGuestContactPayload = (
  customer: GuestContactValues,
  privacyPolicyAccepted: boolean,
) => ({
  firstName: customer.name.trim(),
  email: customer.email.trim(),
  phone: customer.phone.trim(),
  privacyPolicyAccepted,
});
