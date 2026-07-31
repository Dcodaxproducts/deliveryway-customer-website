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
    /@guest\.deliveryways?(?:\.local)?$/i.test(email)
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
